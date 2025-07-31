import { peek, subscribe } from '@rbxts/charm';
import { useUpdate } from '@rbxts/pretty-react-hooks';
import React, { useBinding, useEffect, useRef } from '@rbxts/react';
import { useAtom } from '@rbxts/react-charm';
import { RunService } from '@rbxts/services';
import { animationRegistry, settingMaxTimelineLength, settingScrubberPosition } from 'state/editor';
import { appPlugin } from 'state/globals';
import { currentTimestamps, scrubbingData } from 'state/timeline';
import { getRelativeMouse } from 'utils/getRelativeMouse';
import { getSortedDistances } from 'utils/getSortedDistances';
import { HotkeyIDs, isHotkeyPressed, useHotkeyDown } from 'utils/hotkeyUtils';
import { Palette } from 'utils/styling';

export function Scrubber() {
  const update = useUpdate();

  const maxTimelineLength = useAtom(settingMaxTimelineLength);

  const [scrubberPositionScale, setScrubberPositionScale] = useBinding(peek(settingScrubberPosition) / maxTimelineLength);

  const scrubberContainerRef = useRef<Frame>();

  // Hotkey to nudge scrubber left
  useHotkeyDown(
    HotkeyIDs.ScrubberNudgeLeft,
    [],
    0.03,
    () => {
      const scrubberTime = peek(settingScrubberPosition);
      const nudgeTime = math.clamp(scrubberTime - 0.005, 0, maxTimelineLength);

      setScrubberPositionScale(nudgeTime / maxTimelineLength);
      settingScrubberPosition(nudgeTime);
    },
    [maxTimelineLength]
  );

  // Hotkey to nudge scrubber left (slow & fast)
  useHotkeyDown(
    HotkeyIDs.ScrubberNudgeLeftSlow,
    [HotkeyIDs.ScrubberNudgeLeftFast],
    0,
    (ctx) => {
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
    [maxTimelineLength]
  );

  // Hotkey to nudge scrubber right
  useHotkeyDown(
    HotkeyIDs.ScrubberNudgeRight,
    [],
    0.03,
    () => {
      const scrubberTime = peek(settingScrubberPosition);
      const nudgeTime = math.clamp(scrubberTime + 0.005, 0, maxTimelineLength);

      setScrubberPositionScale(nudgeTime / maxTimelineLength);
      settingScrubberPosition(nudgeTime);
    },
    [maxTimelineLength]
  );

  // Hotkey to nudge scrubber right (slow & fast)
  useHotkeyDown(
    HotkeyIDs.ScrubberNudgeRightSlow,
    [HotkeyIDs.ScrubberNudgeRightFast],
    0,
    (ctx) => {
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
    [maxTimelineLength]
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
        const animRegistry = peek(animationRegistry);
        const allKeyframePositions: Set<number> = new Set();

        animRegistry.forEach((data) => data.keyframes.forEach((kf) => allKeyframePositions.add(kf.time / maxTLength)));

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
