import React, { useBinding, useCallback, useEffect, useMemo, useRef, useState } from '@rbxts/react';
import { useAtom } from '@rbxts/react-charm';
import {
  activeContextMenu,
  animationRegistry,
  DraggingKeyframeData,
  finishInternalPropertyChange,
  internalPropertyChange,
  KeyframeData,
  mutedPropertiesAtom,
  previewKeyframesAtom,
  selectedKeyframes,
  settingAutoKeyframe,
  settingMaxTimelineLength,
  startInternalPropertyChange,
} from 'state/editor';
import { currentTimestamps, forceUpdatePreview, instanceTreeSelection } from 'state/timeline';
import { Palette } from 'utils/styling';
import { TextElement } from '../Topbar/TextElement';
import { ContextMenu } from 'components/ui/ContextMenu';
import { matchKeyframes } from 'utils/keyframeUtils';
import { HotkeyIDs, isHotkeyPressed, useHotkey, useHotkeyDown } from 'utils/hotkeyUtils';
import { RunService } from '@rbxts/services';
import { getRelativeMouse } from 'utils/getRelativeMouse';
import { getAnimatableProperties, SupportedClass } from 'utils/animatableProperties';
import { peek } from '@rbxts/charm';
import Log from '@rbxts/log';
import {
  ActionBatch,
  DeleteKeyframeAction,
  ActionManager,
  makeUpdateKeyframeAction,
  DeleteInstancePropertyAction,
  MoveKeyframeAction,
} from 'state/history';
import { addProperties, getCachedValueOfProperty } from 'state/properties';
import { ClipboardManager } from 'state/clipboard';
import { Keyframe } from './Keyframe';
import { KeyframeVisualizer } from './KeyframeVisualizer';
import { ToastManager, ToastType } from 'state/toasts';
import { getSortedDistances } from 'utils/getSortedDistances';

// Helper function to get the delta of mouse movement in seconds
function getDeltaTime(startMousePos: Vector2, mousePos: Vector2, timelineContentRef: React.RefObject<ScrollingFrame>, maxTimelineLength: number) {
  const deltaX = mousePos.X - startMousePos.X;
  const deltaPosition = deltaX / (timelineContentRef.current!.AbsoluteSize.X - 150);
  const deltaTime = deltaPosition * maxTimelineLength;

  return deltaTime;
}

// Heplper function to find the nearest timestamp from a given time
function getNearestTimestamp(from: number) {
  const timestampsData = peek(currentTimestamps);
  const timestampsTime = timestampsData.map((data) => data.time);
  const nearestTimestamp = getSortedDistances(from, timestampsTime)[0];

  return nearestTimestamp.position;
}

// Helper function to get the nearest keyframe from a given time
function getNearestKeyframe(from: number) {
  const selectedInstanceOption = peek(instanceTreeSelection);

  if (selectedInstanceOption.isSome()) {
    const selectedInstance = selectedInstanceOption.unwrap();
    const animRegistry = peek(animationRegistry);

    if (animRegistry.get(selectedInstance) !== undefined) {
      const allKeyframeTimes: Set<number> = new Set();

      animRegistry.get(selectedInstance)!.keyframes.forEach((kf) => allKeyframeTimes.add(kf.time));

      const nearestKeyframePositionsArray = getSortedDistances(from, [...allKeyframeTimes]);

      return nearestKeyframePositionsArray[0].position;
    }
  }
}

// Handles keyframe drag moving functionality
function dragCallback(
  isActivelyDragging: boolean,
  startMousePos: Vector2,
  currentMousePos: Vector2,
  timelineContentRef: React.RefObject<ScrollingFrame>,
  kf: KeyframeData
) {
  const sKeyframes = peek(selectedKeyframes);
  const maxTLength = peek(settingMaxTimelineLength);

  const isActivelySelected = sKeyframes.findIndex((_kf) => matchKeyframes(_kf, kf)) !== -1;

  const action = new MoveKeyframeAction();
  const previewList: DraggingKeyframeData[] = [];

  const deltaTime = getDeltaTime(startMousePos, currentMousePos, timelineContentRef, maxTLength);

  const snapToTimestamp = isHotkeyPressed(HotkeyIDs.ScrubberSnapTimestamp);
  const snapToKeyframe = isHotkeyPressed(HotkeyIDs.ScrubberSnapKeyframe);

  let finalTime = math.clamp(kf.time + deltaTime, 0, maxTLength);

  let deltaTimestampTime: number | undefined;
  let deltaKeyframeTime: number | undefined;

  if (snapToTimestamp) {
    finalTime = getNearestTimestamp(finalTime);
    deltaTimestampTime = finalTime - kf.time;
  } else if (snapToKeyframe) {
    const nearest = getNearestKeyframe(finalTime);

    if (nearest) {
      finalTime = nearest;
      deltaKeyframeTime = nearest - kf.time;
    }
  }

  finalTime = tonumber(string.format('%.2f', finalTime))!;

  if (!isActivelySelected) {
    if (isActivelyDragging) {
      previewList.push({
        keyframe: { ...kf },
        oldTime: kf.time,
        newTime: finalTime,
      });
    } else {
      action.addMove(kf, finalTime);
    }
  }

  sKeyframes.forEach((selKf) => {
    finalTime = math.clamp(selKf.time + deltaTime, 0, maxTLength);

    if (snapToTimestamp) {
      finalTime = math.clamp(selKf.time + deltaTimestampTime!, 0, maxTLength);
    } else if (snapToKeyframe && deltaKeyframeTime !== undefined) {
      finalTime = math.clamp(selKf.time + deltaKeyframeTime, 0, maxTLength);
    }

    const newTime = tonumber(string.format('%.2f', finalTime))!;

    if (isActivelyDragging) {
      previewList.push({
        keyframe: { ...selKf },
        oldTime: selKf.time,
        newTime: newTime,
      });
    } else {
      action.addMove(selKf, newTime);
    }
  });

  if (isActivelyDragging) {
    previewKeyframesAtom(previewList);
  } else {
    ActionManager.execute(action);
    forceUpdatePreview();

    const newSelected: KeyframeData[] = [];

    peek(previewKeyframesAtom).forEach((data) => {
      newSelected.push({ ...data.keyframe, time: data.newTime });
    });

    previewKeyframesAtom([]);
    selectedKeyframes(newSelected);
  }
}

function keyframeNudgeCallback(selectedKfs: KeyframeData[], maxTimelineLength: number, direction: 'left' | 'right') {
  if (selectedKfs.size() === 0) return;

  const action = new MoveKeyframeAction(true);

  const postMoveSelectedKeyframes: KeyframeData[] = [];

  selectedKfs.forEach((selected) => {
    let newTime = math.clamp(selected.time + (direction === 'left' ? -0.01 : 0.01), 0, maxTimelineLength);

    newTime = tonumber(string.format('%.2f', newTime))!;

    action.addMove({ ...selected }, newTime);
    postMoveSelectedKeyframes.push({
      ...selected,
      time: newTime,
    });
  });

  ActionManager.execute(action, true);
  forceUpdatePreview();
  selectedKeyframes(postMoveSelectedKeyframes);
}

export function TimelineContent() {
  const animRegistry = useAtom(animationRegistry);
  const instTreeSelection = useAtom(instanceTreeSelection);
  const maxTimelineLength = useAtom(settingMaxTimelineLength);
  const autoKeyframe = useAtom(settingAutoKeyframe);
  const selectedKfs = useAtom(selectedKeyframes);
  const mutedProps = useAtom(mutedPropertiesAtom);

  const timelineContentRef = useRef<ScrollingFrame>();

  const [canvasPosition, setCanvasPosition] = useBinding(Vector2.zero);
  const [isDragSelecting, setIsDragSelecting] = useState(false);
  const dragHitboxRef = useRef<Frame>();
  const startDragMousePos = useRef<Vector2>(Vector2.zero);
  const [currentDragMousePos, setCurrentDragMousePos] = useBinding(Vector2.zero);
  const attempingDrag = useRef(false);

  useHotkeyDown(HotkeyIDs.KeyframesNudgeRight, [], 0.05, () => keyframeNudgeCallback(selectedKfs, maxTimelineLength, 'right'), [
    selectedKfs,
    maxTimelineLength,
  ]);

  useHotkeyDown(HotkeyIDs.KeyframesNudgeLeft, [], 0.05, () => keyframeNudgeCallback(selectedKfs, maxTimelineLength, 'left'), [
    selectedKfs,
    maxTimelineLength,
  ]);

  // Auto-keyframe property update effect
  useEffect(() => {
    const connections: RBXScriptConnection[] = [];

    if (autoKeyframe && instTreeSelection.isSome()) {
      const selection = instTreeSelection.unwrap();
      const supportedProperties = getAnimatableProperties(selection.ClassName as SupportedClass);

      type SelectionProperty = InstancePropertyNames<typeof selection>;

      supportedProperties.forEach((prop) => {
        connections.push(
          selection.GetPropertyChangedSignal(prop as SelectionProperty).Connect(() => {
            const mutedProperties = peek(mutedPropertiesAtom);

            if (mutedProperties.get(selection)?.includes(prop)) return;

            const internalChangeMap = peek(internalPropertyChange);

            if (internalChangeMap.get(selection) !== undefined || internalChangeMap.get(selection)?.has(prop)) return;

            const action = makeUpdateKeyframeAction(
              {
                instance: selection,
                property: prop,
              },
              true
            );

            ActionManager.execute(action, true);
          })
        );
      });
    } else if (!autoKeyframe) {
      Log.Warn(`{PREFIX} Auto-keyframe is disabled. Property changes are not being recorded!`);
    }

    return () => {
      connections.forEach((conn) => conn.Disconnect());
    };
  }, [instTreeSelection, maxTimelineLength, autoKeyframe]);

  // Hotkey to delete all selected keyframes
  useHotkey(
    HotkeyIDs.KeyframesDeleteSelected,
    [],
    () => {
      const actionBatch = new ActionBatch();

      selectedKfs.forEach((kf) => {
        actionBatch.addAction(
          new DeleteKeyframeAction({
            instance: kf.instance,
            property: kf.property,
            time: kf.time,
          })
        );
      });

      ActionManager.execute(actionBatch);
      actionBatch.setActionToast(`${actionBatch.getActions().size()} keyframe(s) deleted`);
      forceUpdatePreview();
      selectedKeyframes([]);
    },
    [selectedKfs]
  );

  // Generate labels & keyframes for each property
  const [propertyLabels, propertyContent, keyframeRefs] = useMemo(() => {
    if (instTreeSelection.isNone() || !animRegistry.has(instTreeSelection.unwrap())) return $tuple([], [], []);

    const selectedInstance = instTreeSelection.unwrap();
    const instanceRegistryData = animRegistry.get(selectedInstance)!;
    const propertyStrings = instanceRegistryData.properties;
    const propertyTextLabels: React.ReactChild[] = [];
    const propertyContentBars: React.ReactChild[] = [];
    const kfRefs: { kf: KeyframeData; ref: React.RefObject<Frame> }[] = [];

    propertyStrings.forEach((property) => {
      const mutedProperties = peek(mutedPropertiesAtom);
      const isMuted = mutedProperties.get(selectedInstance)?.includes(property) ?? false;

      // Property TextLabel
      propertyTextLabels.push(
        <TextElement
          key={`${property}-PropertyLabel`}
          text={property}
          textColor={Palette.DefaultText}
          backgroundColor={Palette.Background3}
          backgroundTransparency={0}
          size={new UDim2(1, 0, 0, 20)}
          textSize={10}
          textXAlign={Enum.TextXAlignment.Left}
          customPadding={4}
        >
          <ContextMenu
            activeContextMenuAtom={activeContextMenu}
            id={`${selectedInstance.Name}-${property}-contextmenu`}
            options={[
              {
                label: 'Insert/Update Keyframe',
                tooltip: "Inserts or updates a keyframe at the scrubber's current position.",
                clicked: () => {
                  const action = makeUpdateKeyframeAction({
                    instance: selectedInstance,
                    property: property,
                  });

                  ActionManager.execute(action);
                  forceUpdatePreview();

                  return true;
                },
              },
              {
                label: `Delete ${property}`,
                tooltip: 'Deletes this property and all associated keyframes.',
                clicked: () => {
                  const newSelected = selectedKfs.filter((kf) => kf.instance !== selectedInstance && kf.property !== property);
                  selectedKeyframes(newSelected);

                  ActionManager.execute(
                    new DeleteInstancePropertyAction({
                      instance: selectedInstance,
                      property: property,
                    })
                  );

                  startInternalPropertyChange(selectedInstance, property);
                  addProperties(selectedInstance, {
                    [property]: getCachedValueOfProperty(selectedInstance, property),
                  });
                  task.defer(() => finishInternalPropertyChange(selectedInstance, property));

                  return true;
                },
              },
              {
                label: `Select Keyframes`,
                tooltip: `Selects all keyframes for this property.`,
                clicked: () => {
                  const instData = peek(animRegistry).get(selectedInstance);
                  if (instData !== undefined) {
                    const newSelected = instData.keyframes.filter((kf) => kf.property === property);

                    selectedKeyframes(newSelected);
                  }

                  return true;
                },
              },
              {
                label: `${isMuted ? 'Unmute' : 'Mute'} Property Track`,
                tooltip: 'Stops/starts listening for property changes for this track if auto-keyframe is on.',
                clicked: () => {
                  const mutedProperties = peek(mutedPropertiesAtom);
                  const mutedPropertiesForInstance = mutedProperties.get(selectedInstance);
                  const newMuted = new Map([...mutedProperties]);

                  if (mutedPropertiesForInstance === undefined || !mutedPropertiesForInstance.includes(property)) {
                    newMuted.set(selectedInstance, [property]);

                    ToastManager.addToast({
                      type: ToastType.Info,
                      message: `Muted ${property} track!`,
                      duration: 4,
                    });
                  } else if (mutedPropertiesForInstance.includes(property)) {
                    const filtered = newMuted.get(selectedInstance)!.filter((p) => p !== property);
                    newMuted.set(selectedInstance, filtered);

                    ToastManager.addToast({
                      type: ToastType.Success,
                      message: `Unmuted ${property} track!`,
                      duration: 4,
                    });
                  }

                  mutedPropertiesAtom(newMuted);

                  return true;
                },
              },
            ]}
          />
        </TextElement>
      );

      // Get keyframes for this property only
      const propertyKeyframes = instanceRegistryData.keyframes.filter((kf) => kf.property === property);

      propertyKeyframes.sort((a, b) => a.time < b.time);

      // Generate keyframe elements
      const keyframeElements: React.ReactChild[] = [];
      propertyKeyframes.forEach((kf) => {
        const selectedKeyframeIndex = selectedKfs.findIndex((_kf) => matchKeyframes(_kf, kf));
        const isKeyframeSelected = selectedKeyframeIndex !== -1;

        const newKfRefData = {
          kf: kf,
          ref: React.createRef<Frame>(),
        };

        keyframeElements.push(
          <Keyframe
            key={`Keyframe-${string.format('%.2f', kf.time)}-${kf.property}-${typeOf(kf.value)}-${kf.value}`}
            data={kf}
            refData={newKfRefData}
            isSelected={isKeyframeSelected}
            onDragging={(startMousePos, currentMousePos) => dragCallback(true, startMousePos, currentMousePos, timelineContentRef, kf)}
            onDragged={(startMousePos, endMousePos) => dragCallback(false, startMousePos, endMousePos, timelineContentRef, kf)}
            onSelected={() => {
              const selectMultiple = isHotkeyPressed(HotkeyIDs.KeyframesSelectMultiple);
              const selectRange = isHotkeyPressed(HotkeyIDs.KeyframesSelectRange);

              if (isKeyframeSelected) {
                if (selectMultiple) {
                  const newKeyframes = [...selectedKfs];

                  newKeyframes.remove(selectedKeyframeIndex);
                  selectedKeyframes(newKeyframes);
                } else {
                  selectedKeyframes([{ ...kf }]);
                }
              } else {
                if (isHotkeyPressed(HotkeyIDs.KeyframesSelectMultiple)) {
                  selectedKeyframes([...selectedKfs, { ...kf }]);
                } else if (selectRange) {
                  const selectedKfsOfProperty = selectedKfs.filter(
                    (selectedKf) => selectedKf.instance === kf.instance && selectedKf.property === property
                  );

                  if (selectedKfsOfProperty.size() > 0) {
                    selectedKfsOfProperty.sort((a, b) => a.time < b.time);
                    const rangeStartIndex = propertyKeyframes.findIndex(
                      (pKf) => pKf.time === selectedKfsOfProperty[selectedKfsOfProperty.size() - 1].time
                    );
                    const rangeEndIndex = propertyKeyframes.findIndex((pKf) => pKf.time === kf.time);
                    const keyframeRangeToAdd: KeyframeData[] = [];

                    propertyKeyframes.forEach((pKf, i) => {
                      if (i >= rangeStartIndex && i <= rangeEndIndex) {
                        keyframeRangeToAdd.push({
                          ...pKf,
                        });
                      }
                    });

                    selectedKeyframes([...selectedKfs, ...keyframeRangeToAdd]);
                  } else {
                    selectedKeyframes([...selectedKfs, { ...kf }]);
                  }
                } else {
                  selectedKeyframes([{ ...kf }]);
                }
              }
            }}
          />
        );

        // Push keyframe ref
        kfRefs.push(newKfRefData);
      });

      // Generate outer animation bar with keyframe elements
      propertyContentBars.push(
        <frame key={`${property}-ContentBar`} Size={new UDim2(1, 0, 0, 20)} BackgroundTransparency={1}>
          <frame
            key={'KeyframeLine'}
            Size={new UDim2(1, 0, 0, 1)}
            Position={new UDim2(0, 0, 0.5, 0)}
            BorderSizePixel={0}
            BackgroundColor3={isMuted ? Palette.Error : peek(settingAutoKeyframe) ? Palette.DefaultText : Palette.Error}
          />

          {...keyframeElements!}
        </frame>
      );
    });

    return $tuple(propertyTextLabels, propertyContentBars, kfRefs);
  }, [animRegistry, instTreeSelection, maxTimelineLength, selectedKfs, mutedProps, autoKeyframe]);

  // Determine dragging & update current mouse position for drag selection
  useEffect(() => {
    const conn = RunService.RenderStepped.Connect(() => {
      if (dragHitboxRef.current === undefined) return;
      if (!attempingDrag.current) return;

      const mousePos = getRelativeMouse();

      if (mousePos.sub(startDragMousePos.current).Magnitude < 3) return;

      setIsDragSelecting(true);

      const hitboxTopLeft = dragHitboxRef.current.AbsolutePosition;
      const hitboxBottomRight = new Vector2(
        hitboxTopLeft.X + dragHitboxRef.current.AbsoluteSize.X,
        hitboxTopLeft.Y + dragHitboxRef.current.AbsoluteSize.Y
      );

      setCurrentDragMousePos(
        new Vector2(
          math.clamp(mousePos.X, hitboxTopLeft.X, hitboxBottomRight.X),
          math.clamp(mousePos.Y, hitboxTopLeft.Y + 1, hitboxBottomRight.Y) // Weird quirk where the top bound is 1 pixel off ?
        )
      );
    });

    return () => conn.Disconnect();
  }, []);

  // Callback when a drag selection completes
  const dragSelectionCompleted = useCallback(
    (finalMousePos: Vector2) => {
      const initialMousePos = startDragMousePos.current;
      const keyframesToUpdate: KeyframeData[] = [];

      keyframeRefs.forEach((kfRefObject) => {
        if (kfRefObject.ref.current) {
          const kfInstance = kfRefObject.ref.current;
          const kfAbsPosition = kfInstance.AbsolutePosition;

          const topLeftCoordinate = new Vector2(math.min(initialMousePos.X, finalMousePos.X), math.min(initialMousePos.Y, finalMousePos.Y));
          const bottomRightCoordinate = new Vector2(math.max(initialMousePos.X, finalMousePos.X), math.max(initialMousePos.Y, finalMousePos.Y));
          const keyframeSizeXBuffer = 5;
          const isInSelectionBounds =
            kfAbsPosition.X >= topLeftCoordinate.X - keyframeSizeXBuffer &&
            kfAbsPosition.Y >= topLeftCoordinate.Y - 1 && // -1 to account for that weird top bound quirk in mouse position updater effect
            kfAbsPosition.X <= bottomRightCoordinate.X + keyframeSizeXBuffer &&
            kfAbsPosition.Y <= bottomRightCoordinate.Y;

          if (isInSelectionBounds) {
            keyframesToUpdate.push({
              ...kfRefObject.kf,
            });
          }
        }
      });

      const newSelectedKeyframes: KeyframeData[] = [];
      const notSelectedKeyframes: KeyframeData[] = [];
      const isAdditiveKeyPressed = isHotkeyPressed(HotkeyIDs.KeyframesDragAdditiveSelection);
      const isInvertKeyPressed = isHotkeyPressed(HotkeyIDs.KeyframesDragInvertSelection);

      keyframesToUpdate.forEach((kf) => {
        const selectedKeyframeIndex = selectedKfs.findIndex((_kf) => matchKeyframes(_kf, kf));
        const isKeyframeSelected = selectedKeyframeIndex !== -1;

        if (!isAdditiveKeyPressed && !isInvertKeyPressed) {
          newSelectedKeyframes.push(kf);
        } else if (isAdditiveKeyPressed) {
          newSelectedKeyframes.push(kf);
        } else if (isInvertKeyPressed) {
          if (isKeyframeSelected) {
            notSelectedKeyframes.push(kf);
          } else {
            newSelectedKeyframes.push(kf);
          }
        }
      });

      if (isAdditiveKeyPressed || isInvertKeyPressed) {
        selectedKfs
          .filter((currentlySelectedKf) => {
            const shouldStillBeSelected =
              notSelectedKeyframes.find((notSelectedKf) => matchKeyframes(currentlySelectedKf, notSelectedKf)) === undefined;

            return shouldStillBeSelected;
          })
          .forEach((kf) => newSelectedKeyframes.push({ ...kf }));
      }

      selectedKeyframes(newSelectedKeyframes);
    },
    [animRegistry, selectedKfs]
  );

  return (
    <scrollingframe
      key={'TimelineContent'}
      ref={timelineContentRef}
      Size={new UDim2(1, 0, 1, -20)}
      BackgroundColor3={Palette.Background0}
      AutomaticCanvasSize={Enum.AutomaticSize.Y}
      BorderSizePixel={0}
      ScrollBarThickness={1}
      ScrollBarImageTransparency={0.5}
      ScrollBarImageColor3={Palette.White}
      CanvasSize={new UDim2(0, 0, 0, 0)}
      Change={{
        CanvasPosition: (rbx) => setCanvasPosition(rbx.CanvasPosition),
      }}
    >
      <frame key={'PropertyLabelsContainer'} Size={new UDim2(0, 150, 1, 0)} BorderSizePixel={0} BackgroundColor3={Palette.Background2}>
        <uilistlayout
          FillDirection={Enum.FillDirection.Vertical}
          HorizontalAlignment={Enum.HorizontalAlignment.Left}
          VerticalAlignment={Enum.VerticalAlignment.Top}
          SortOrder={Enum.SortOrder.Name}
        />

        {...propertyLabels}
      </frame>
      <frame
        key={'PropertyContentContainer'}
        Size={new UDim2(1, -150, 1, 0)}
        Position={new UDim2(0, 150, 0, 0)}
        BorderSizePixel={0}
        BackgroundTransparency={1}
      >
        <frame key={'PropertyContentContainerWrapper'} Size={new UDim2(1, 0, 1, 0)} BackgroundTransparency={1}>
          <uilistlayout
            FillDirection={Enum.FillDirection.Vertical}
            HorizontalAlignment={Enum.HorizontalAlignment.Left}
            VerticalAlignment={Enum.VerticalAlignment.Top}
            SortOrder={Enum.SortOrder.Name}
          />
          {...propertyContent}
        </frame>
        <KeyframeVisualizer keyframeRefData={keyframeRefs} />
      </frame>
      <frame
        key={'DragSelectionInputHitbox'}
        ref={dragHitboxRef}
        Size={new UDim2(1, -150, 1, 0)}
        AutomaticSize={Enum.AutomaticSize.Y}
        Position={canvasPosition.map((pos) => new UDim2(0, 150, 0, pos.Y))}
        BackgroundTransparency={1}
        Event={{
          InputBegan: (_, input) => {
            if (input.UserInputState !== Enum.UserInputState.Begin) return;

            // Deselect all selected keyframes if middle mouse click on the timeline
            if (input.UserInputType === Enum.UserInputType.MouseButton3) {
              selectedKeyframes([]);
            }

            if (input.UserInputType !== Enum.UserInputType.MouseButton1) return;

            // Possibly attemping to start a drag selection
            startDragMousePos.current = new Vector2(input.Position.X, input.Position.Y);
            attempingDrag.current = true;
          },
          InputEnded: (_, input) => {
            if (input.UserInputState !== Enum.UserInputState.End || input.UserInputType !== Enum.UserInputType.MouseButton1) return;

            attempingDrag.current = false;

            if (isDragSelecting) {
              setIsDragSelecting(false);
              dragSelectionCompleted(currentDragMousePos.getValue());
            }
          },
        }}
      >
        <ContextMenu
          activeContextMenuAtom={activeContextMenu}
          id={`timeline-contextmenu`}
          options={[
            {
              label: 'Delete Selected Keyframes',
              tooltip: 'Deletes all currently selected keyframes.',
              clicked: () => {
                const actionBatch = new ActionBatch();

                selectedKfs.forEach((kf) => {
                  actionBatch.addAction(
                    new DeleteKeyframeAction({
                      instance: kf.instance,
                      property: kf.property,
                      time: kf.time,
                    })
                  );
                });

                ActionManager.execute(actionBatch);
                actionBatch.setActionToast(`${actionBatch.getActions().size()} keyframe(s) deleted`);
                forceUpdatePreview();
                selectedKeyframes([]);

                return true;
              },
            },
            {
              label: 'Copy Selected Keyframes',
              tooltip: 'Copies all selected keyframes.',
              clicked: () => {
                ClipboardManager.copy();

                return true;
              },
            },
            {
              label: 'Cut Selected Keyframes',
              tooltip: 'Cuts all selected keyframes.',
              clicked: () => {
                ClipboardManager.cut();

                return true;
              },
            },
            {
              label: 'Paste Clipboard',
              tooltip: 'Pastes the clipboard at the scrubber position.',
              clicked: () => {
                ClipboardManager.paste();

                return true;
              },
            },
          ]}
        />
        {isDragSelecting && dragHitboxRef.current ? (
          <frame
            key={'DragBox'}
            Size={currentDragMousePos.map((pos) => {
              if (dragHitboxRef.current === undefined) return UDim2.fromOffset(0, 0);

              const hitboxAbsPosition = dragHitboxRef.current.AbsolutePosition;
              const startX = startDragMousePos.current.X - hitboxAbsPosition.X;
              const startY = startDragMousePos.current.Y - hitboxAbsPosition.Y;
              const endX = pos.X - hitboxAbsPosition.X;
              const endY = pos.Y - hitboxAbsPosition.Y;

              return UDim2.fromOffset(endX - startX, endY - startY);
            })}
            Position={UDim2.fromOffset(
              startDragMousePos.current.X - dragHitboxRef.current.AbsolutePosition.X,
              startDragMousePos.current.Y - dragHitboxRef.current.AbsolutePosition.Y
            )}
            BackgroundColor3={Palette.PrimaryText}
            BackgroundTransparency={0.9}
            ZIndex={25}
          >
            <frame key={'StrokeContainer'} Size={new UDim2(1, -1, 1, -1)} BackgroundTransparency={1}>
              <uistroke Color={Palette.White} Transparency={0.3} />
            </frame>
          </frame>
        ) : undefined}
      </frame>
    </scrollingframe>
  );
}
