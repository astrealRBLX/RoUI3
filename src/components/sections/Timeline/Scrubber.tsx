import { effect, peek, subscribe } from '@rbxts/charm';
import { lerp, useUpdate } from '@rbxts/pretty-react-hooks';
import React, { useBinding, useEffect, useRef } from '@rbxts/react';
import { useAtom } from '@rbxts/react-charm';
import { RunService, TweenService } from '@rbxts/services';
import {
  animationRegistry,
  finishInternalPropertyChange,
  internalPropertyChange,
  KeyframeData,
  KeyframeValue,
  settingMaxTimelineLength,
  settingScrubberPosition,
  startInternalPropertyChange,
} from 'state/editor';
import { appPlugin } from 'state/globals';
import { addProperties, getCachedValueOfProperty } from 'state/properties';
import { currentTimestamps, previewData, scrubbingData, previewUpdate, instanceTreeSelection } from 'state/timeline';
import { getRelativeMouse } from 'utils/getRelativeMouse';
import { getSortedDistances } from 'utils/getSortedDistances';
import { HotkeyIDs, isHotkeyPressed, useHotkey, useHotkeyDown } from 'utils/hotkeyUtils';
import { Palette } from 'utils/styling';

export function Scrubber() {
  const update = useUpdate();

  const maxTimelineLength = useAtom(settingMaxTimelineLength);
  const previewInfo = useAtom(previewData);

  const [scrubberPositionScale, setScrubberPositionScale] = useBinding(peek(settingScrubberPosition) / maxTimelineLength);

  const scrubberContainerRef = useRef<Frame>();

  // Effect to preview an animation
  useEffect(() => {
    if (!previewInfo.isPreviewing) return;
    const previewTimeInstance = new Instance('NumberValue');
    previewTimeInstance.Value = previewInfo.previewTime;

    const tween = TweenService.Create(previewTimeInstance, new TweenInfo(maxTimelineLength - previewInfo.previewTime, Enum.EasingStyle.Linear), {
      Value: maxTimelineLength,
    });

    const conn = previewTimeInstance.GetPropertyChangedSignal('Value').Connect(() => {
      settingScrubberPosition(previewTimeInstance.Value);
    });

    let completed: RBXScriptConnection;

    const cleanup = () => {
      conn.Disconnect();
      completed.Disconnect();
      tween.Destroy();
      previewTimeInstance.Destroy();
      previewData({
        isPreviewing: false,
        previewTime: 0,
      });
    };

    completed = tween.Completed.Connect(cleanup);
    tween.Play();

    return cleanup;
  }, [previewInfo, maxTimelineLength]);

  // Effect to preview animation changes when the scrubber moves
  useEffect(() => {
    effect(() => {
      const scrubberPos = tonumber(string.format('%.2f', settingScrubberPosition()))!;
      const animRegistry = peek(animationRegistry);

      // Listen for any forced updates
      previewUpdate();

      animRegistry.forEach((data, instance) => {
        data.properties.forEach((property) => {
          // Get keyframes only related to this property
          const propertyKeyframes = data.keyframes.filter((kf) => kf.property === property);

          // Sort keyframes by position
          const sortedKeyframes = propertyKeyframes.sort((a, b) => a.time < b.time);

          // Find the keyframe exactly on the scrubber position (if it exists)
          const keyframeAtScrubberPos = sortedKeyframes.find((kf) => kf.time === scrubberPos);

          if (keyframeAtScrubberPos !== undefined) {
            // Scrubber is exactly at a keyframe

            startInternalPropertyChange(instance, property);
            addProperties(instance, {
              [property]: keyframeAtScrubberPos.value,
            });
            task.defer(() => finishInternalPropertyChange(instance, property));
          } else if (sortedKeyframes.size() === 0 || (sortedKeyframes.size() > 0 && scrubberPos < sortedKeyframes[0].time)) {
            // Scrubber is before the first keyframe OR there are no keyframes

            startInternalPropertyChange(instance, property);
            addProperties(instance, {
              [property]: getCachedValueOfProperty(instance, property),
            });
            task.defer(() => finishInternalPropertyChange(instance, property));
          } else if (scrubberPos > sortedKeyframes[sortedKeyframes.size() - 1].time) {
            // Scrubber is after the last keyframe

            startInternalPropertyChange(instance, property);
            addProperties(instance, {
              [property]: sortedKeyframes[sortedKeyframes.size() - 1].value,
            });
            task.defer(() => finishInternalPropertyChange(instance, property));
          } else {
            // Scrubber is between 2 keyframes

            let keyframe1: KeyframeData | undefined;
            let keyframe2: KeyframeData | undefined;

            // Find keyframes surrounding the scrubber
            sortedKeyframes.forEach((kf, index) => {
              if (index === sortedKeyframes.size() - 1) return;

              const nextKeyframe = sortedKeyframes[index + 1];

              if (scrubberPos > kf.time && scrubberPos < nextKeyframe.time) {
                keyframe1 = kf;
                keyframe2 = nextKeyframe;
              }
            });

            if (keyframe1 !== undefined && keyframe2 !== undefined) {
              const normalizedAlpha = ((scrubberPos - keyframe1.time) / (keyframe2.time - keyframe1.time)) * (1 - 0) + 0;
              const tweenAlpha = TweenService.GetValue(normalizedAlpha, keyframe2.easingStyle, keyframe2.easingDirection);

              const value1 = keyframe1.value;
              const value2 = keyframe2.value;
              let finalValue: KeyframeValue | undefined;

              if (typeIs(value1, 'number')) {
                finalValue = lerp(value1, value2 as number, tweenAlpha);
              } else if (typeIs(value1, 'boolean') || typeIs(value1, 'string')) {
                finalValue = tweenAlpha === 1 ? value2 : value1;
              } else if (typeIs(value1, 'UDim')) {
                finalValue = new UDim(
                  lerp(value1.Scale, (value2 as UDim).Scale, tweenAlpha),
                  lerp(value1.Offset, (value2 as UDim).Offset, tweenAlpha)
                );
              } else {
                finalValue = (value1 as UDim2 & Vector2 & Color3).Lerp(value2 as UDim2 & Vector2 & Color3, tweenAlpha);
              }

              startInternalPropertyChange(instance, property);
              addProperties(instance, {
                [property]: finalValue,
              });
              task.defer(() => finishInternalPropertyChange(instance, property));
            }
          }
        });
      });
    });
  }, []);

  // Hotkey to preview
  useHotkey(
    HotkeyIDs.ScrubberPreview,
    [],
    () => {
      previewData({
        isPreviewing: !previewInfo.isPreviewing,
        previewTime: previewInfo.isPreviewing ? 0 : peek(settingScrubberPosition),
      });
    },
    [previewInfo]
  );

  // Hotkey to nudge scrubber left
  useHotkeyDown(
    HotkeyIDs.ScrubberNudgeLeft,
    [],
    0.03,
    () => {
      if (peek(scrubbingData).isScrubbing || previewInfo.isPreviewing) return;

      const scrubberTime = peek(settingScrubberPosition);
      const nudgeTime = math.clamp(scrubberTime - 0.005, 0, maxTimelineLength);

      setScrubberPositionScale(nudgeTime / maxTimelineLength);
      settingScrubberPosition(nudgeTime);
    },
    [maxTimelineLength, previewInfo]
  );

  // Hotkey to nudge scrubber left (slow & fast)
  useHotkeyDown(
    HotkeyIDs.ScrubberNudgeLeftSlow,
    [HotkeyIDs.ScrubberNudgeLeftFast],
    0,
    (ctx) => {
      if (peek(scrubbingData).isScrubbing || previewInfo.isPreviewing) return;

      const scrubberTime = peek(settingScrubberPosition);
      let nudgeTime = scrubberTime;

      switch (ctx) {
        case HotkeyIDs.ScrubberNudgeLeftFast:
          nudgeTime -= 0.02;
          break;
        default:
          nudgeTime -= 0.01;
          break;
      }

      nudgeTime = math.clamp(nudgeTime, 0, maxTimelineLength);

      setScrubberPositionScale(nudgeTime / maxTimelineLength);
      settingScrubberPosition(nudgeTime);
    },
    [maxTimelineLength, previewInfo]
  );

  // Hotkey to nudge scrubber right
  useHotkeyDown(
    HotkeyIDs.ScrubberNudgeRight,
    [],
    0.03,
    () => {
      if (peek(scrubbingData).isScrubbing || previewInfo.isPreviewing) return;

      const scrubberTime = peek(settingScrubberPosition);
      const nudgeTime = math.clamp(scrubberTime + 0.005, 0, maxTimelineLength);

      setScrubberPositionScale(nudgeTime / maxTimelineLength);
      settingScrubberPosition(nudgeTime);
    },
    [maxTimelineLength, previewInfo]
  );

  // Hotkey to nudge scrubber right (slow & fast)
  useHotkeyDown(
    HotkeyIDs.ScrubberNudgeRightSlow,
    [HotkeyIDs.ScrubberNudgeRightFast],
    0,
    (ctx) => {
      if (peek(scrubbingData).isScrubbing || previewInfo.isPreviewing) return;

      const scrubberTime = peek(settingScrubberPosition);
      let nudgeTime = scrubberTime;

      switch (ctx) {
        case HotkeyIDs.ScrubberNudgeRightFast:
          nudgeTime += 0.02;
          break;
        default:
          nudgeTime += 0.01;
          break;
      }

      nudgeTime = math.clamp(nudgeTime, 0, maxTimelineLength);

      setScrubberPositionScale(nudgeTime / maxTimelineLength);
      settingScrubberPosition(nudgeTime);
    },
    [maxTimelineLength, previewInfo]
  );

  // Effect to recalculate scrubber position when max timeline length changes
  useEffect(() => {
    // Update scrubber position
    setScrubberPositionScale(peek(settingScrubberPosition) / maxTimelineLength);

    // Force an update
    update();
  }, [maxTimelineLength]);

  // Effect to move the scrubber
  useEffect(() => {
    const conn = RunService.RenderStepped.Connect(() => {
      const { isScrubbing, mouseOffset } = peek(scrubbingData);

      if (!isScrubbing) return;
      if (scrubberContainerRef.current === undefined) return;

      appPlugin().unwrap().GetMouse().Icon = 'rbxasset://SystemCursors/ClosedHand';

      const maxTLength = peek(settingMaxTimelineLength);
      const scrubberContainer = scrubberContainerRef.current;
      const mousePos = getRelativeMouse();

      let newScrubberPosScale = (mousePos.X - scrubberContainer.AbsolutePosition.X - mouseOffset + 7) / scrubberContainer.AbsoluteSize.X;

      newScrubberPosScale = math.clamp(newScrubberPosScale, 0, 1);

      const snapToTimestamp = isHotkeyPressed(HotkeyIDs.ScrubberSnapTimestamp);
      const snapToKeyframe = isHotkeyPressed(HotkeyIDs.ScrubberSnapKeyframe);

      if (snapToTimestamp) {
        const timestampsData = peek(currentTimestamps);
        const timestampsPositions = timestampsData.map((data) => data.position);
        const nearestTimestamp = getSortedDistances(newScrubberPosScale, timestampsPositions)[0];

        setScrubberPositionScale(nearestTimestamp.position);
        settingScrubberPosition(nearestTimestamp.position * maxTLength);
      } else if (snapToKeyframe) {
        const selectedInstanceOption = peek(instanceTreeSelection);

        if (selectedInstanceOption.isNone()) {
          setScrubberPositionScale(newScrubberPosScale);
          settingScrubberPosition(newScrubberPosScale * maxTLength);
          return;
        }

        const selectedInstance = selectedInstanceOption.unwrap();
        const animRegistry = peek(animationRegistry);

        if (animRegistry.get(selectedInstance) === undefined) {
          setScrubberPositionScale(newScrubberPosScale);
          settingScrubberPosition(newScrubberPosScale * maxTLength);
          return;
        }

        const allKeyframePositions: Set<number> = new Set();

        animRegistry.get(selectedInstance)!.keyframes.forEach((kf) => allKeyframePositions.add(kf.time / maxTLength));

        const nearestKeyframePositionsArray = getSortedDistances(newScrubberPosScale, [...allKeyframePositions]);

        if (nearestKeyframePositionsArray.size() > 0) {
          const nearestKeyframePosition = nearestKeyframePositionsArray[0];

          setScrubberPositionScale(nearestKeyframePosition.position);
          settingScrubberPosition(nearestKeyframePosition.position * maxTLength);
        } else {
          setScrubberPositionScale(newScrubberPosScale);
          settingScrubberPosition(newScrubberPosScale * maxTLength);
        }
      } else {
        setScrubberPositionScale(newScrubberPosScale);
        settingScrubberPosition(newScrubberPosScale * maxTLength);
      }
    });

    const cleanupFunctions: Array<() => void> = [];

    // Scrubber time data was externally changed so update the scrubber instance's position
    cleanupFunctions.push(
      subscribe(settingScrubberPosition, (scrubberPos) => {
        if (!peek(scrubbingData).isScrubbing) setScrubberPositionScale(scrubberPos / peek(settingMaxTimelineLength));
      })
    );

    return () => {
      conn.Disconnect();

      cleanupFunctions.forEach((f) => f());
    };
  }, []);

  return (
    <frame
      key={'ScrubberContainer'}
      ref={scrubberContainerRef}
      Size={new UDim2(1, -150, 1, 0)}
      Position={new UDim2(0, 150, 0, 0)}
      BackgroundTransparency={1}
    >
      <frame
        key={'Scrubber'}
        Size={new UDim2(0, 14, 1, 0)}
        Position={scrubberPositionScale.map((scale) => new UDim2(scale, 0, 0, 0))}
        BackgroundTransparency={1}
        AnchorPoint={new Vector2(0.5, 0)}
      >
        <uilistlayout
          FillDirection={Enum.FillDirection.Vertical}
          HorizontalAlignment={Enum.HorizontalAlignment.Center}
          VerticalAlignment={Enum.VerticalAlignment.Top}
          SortOrder={Enum.SortOrder.LayoutOrder}
        />
        <frame key={'ScrubberHead'} LayoutOrder={1} Size={new UDim2(1, 0, 0, 14)} BackgroundTransparency={1}>
          <imagebutton
            key={'ScrubberHeadHandle'}
            ZIndex={21}
            Size={new UDim2(1, 0, 1, 0)}
            Image={'rbxassetid://788089696'}
            Rotation={180}
            BackgroundTransparency={1}
            ImageColor3={Palette.PrimaryText}
            Event={{
              MouseEnter: () => {
                appPlugin().unwrap().GetMouse().Icon = 'rbxasset://SystemCursors/OpenHand';
              },
              MouseLeave: () => {
                appPlugin().unwrap().GetMouse().Icon = 'rbxasset://SystemCursors/Arrow';
              },
              InputBegan: (rbx, input) => {
                if (input.UserInputState !== Enum.UserInputState.Begin || input.UserInputType !== Enum.UserInputType.MouseButton1) return;

                scrubbingData({
                  isScrubbing: true,
                  mouseOffset: getRelativeMouse().X - rbx.AbsolutePosition.X,
                });
              },

              InputEnded: (_, input) => {
                if (input.UserInputState !== Enum.UserInputState.End || input.UserInputType !== Enum.UserInputType.MouseButton1) return;

                appPlugin().unwrap().GetMouse().Icon = 'rbxasset://SystemCursors/Arrow';

                scrubbingData({
                  isScrubbing: false,
                  mouseOffset: 0,
                });
              },
            }}
          />
        </frame>
        <frame
          key={'ScrubberTail'}
          LayoutOrder={2}
          Size={new UDim2(0, 1, 1, -14)}
          BackgroundColor3={Palette.PrimaryText}
          BorderSizePixel={0}
          ZIndex={20}
        />
      </frame>
    </frame>
  );
}
