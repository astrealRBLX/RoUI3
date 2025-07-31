import React, { useBinding, useCallback, useEffect, useMemo, useRef, useState } from '@rbxts/react';
import { useAtom } from '@rbxts/react-charm';
import {
  activeContextMenu,
  animationRegistry,
  dispatchEditorStateUpdate,
  KeyframeData,
  selectedKeyframes,
  settingMaxTimelineLength,
} from 'state/editor';
import { instanceTreeSelection } from 'state/timeline';
import { Palette } from 'utils/styling';
import { TextElement } from '../Topbar/TextElement';
import { ContextMenu } from 'components/ui/ContextMenu';
import { getKeyframeColorFromEasingStyle, getKeyframeValuePrettified, matchKeyframes } from 'utils/keyframeUtils';
import { Tooltip } from 'components/ui/Tooltip';
import { HotkeyIDs, isHotkeyPressed, useHotkey } from 'utils/hotkeyUtils';
import { RunService } from '@rbxts/services';
import { getRelativeMouse } from 'utils/getRelativeMouse';

export function TimelineContent() {
  const animRegistry = useAtom(animationRegistry);
  const instTreeSelection = useAtom(instanceTreeSelection);
  const maxTimelineLength = useAtom(settingMaxTimelineLength);
  const selectedKfs = useAtom(selectedKeyframes);

  const timelineContentRef = useRef<ScrollingFrame>();

  const [canvasPosition, setCanvasPosition] = useBinding(Vector2.zero);
  const [isDragSelecting, setIsDragSelecting] = useState(false);
  const dragHitboxRef = useRef<Frame>();
  const startDragMousePos = useRef<Vector2>(Vector2.zero);
  const [currentDragMousePos, setCurrentDragMousePos] = useBinding(Vector2.zero);
  const attempingDrag = useRef(false);

  // Hotkey to delete all selected keyframes
  useHotkey(
    HotkeyIDs.KeyframesDeleteSelected,
    [],
    () => {
      selectedKfs.forEach((kf) => {
        dispatchEditorStateUpdate({
          type: 'DeleteKeyframe',
          instance: kf.instance,
          property: kf.property,
          time: kf.time,
        });
      });

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
                label: `Delete ${property}`,
                tooltip: 'Deletes this property and all associated keyframes.',
                clicked: () => {
                  dispatchEditorStateUpdate({
                    type: 'DeleteInstanceProperty',
                    instance: selectedInstance,
                    property: property,
                  });

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
          <frame
            key={`Keyframe-${string.format('%.2f', kf.time)}-${kf.property}-${typeOf(kf.value)}-${kf.value}`}
            ref={newKfRefData.ref}
            Active={true}
            AnchorPoint={new Vector2(0.5, 0.5)}
            Size={new UDim2(0, 9, 0, 9)}
            Position={new UDim2(kf.time / maxTimelineLength, 0, 0.5, 0)}
            ZIndex={15}
            Rotation={45}
            BorderSizePixel={isKeyframeSelected ? 1 : 0}
            BorderColor3={Palette.White}
            BackgroundColor3={getKeyframeColorFromEasingStyle(kf.easingStyle)}
            Event={{
              InputBegan: (_, input) => {
                if (input.UserInputState !== Enum.UserInputState.Begin || input.UserInputType !== Enum.UserInputType.MouseButton1) return;

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
              },
            }}
          >
            <Tooltip
              text={`${getKeyframeValuePrettified(kf.value)} @ ${string.format('%.2f', kf.time)} s\n${kf.easingStyle.Name} | ${
                kf.easingDirection.Name
              }`}
            />
          </frame>
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
            BackgroundColor3={Palette.DefaultText}
          />

          {...keyframeElements!}
        </frame>
      );
    });

    return $tuple(propertyTextLabels, propertyContentBars, kfRefs);
  }, [animRegistry, instTreeSelection, maxTimelineLength, selectedKfs]);

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
      const isDeselectKeyPressed = isHotkeyPressed(HotkeyIDs.KeyframesDragDeselect);
      const isInvertSelectionKeyPressed = isHotkeyPressed(HotkeyIDs.KeyframesDragInvertSelection);

      keyframesToUpdate.forEach((kf) => {
        const selectedKeyframeIndex = selectedKfs.findIndex((_kf) => matchKeyframes(_kf, kf));
        const isKeyframeSelected = selectedKeyframeIndex !== -1;

        if (isKeyframeSelected) {
          if (isInvertSelectionKeyPressed) {
            notSelectedKeyframes.push(kf);
          } else if (!isInvertSelectionKeyPressed && isDeselectKeyPressed) {
            notSelectedKeyframes.push(kf);
          } else if (!isInvertSelectionKeyPressed && !isDeselectKeyPressed) {
            newSelectedKeyframes.push(kf);
          }
        } else {
          if (isInvertSelectionKeyPressed || (!isInvertSelectionKeyPressed && !isDeselectKeyPressed)) {
            newSelectedKeyframes.push(kf);
          }
        }
      });

      selectedKfs
        .filter((currentlySelectedKf) => {
          const shouldStillBeSelected =
            notSelectedKeyframes.find((notSelectedKf) => matchKeyframes(currentlySelectedKf, notSelectedKf)) === undefined;

          return shouldStillBeSelected;
        })
        .forEach((kf) => newSelectedKeyframes.push({ ...kf }));

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
        <uilistlayout
          FillDirection={Enum.FillDirection.Vertical}
          HorizontalAlignment={Enum.HorizontalAlignment.Left}
          VerticalAlignment={Enum.VerticalAlignment.Top}
          SortOrder={Enum.SortOrder.Name}
        />
        {...propertyContent}
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
