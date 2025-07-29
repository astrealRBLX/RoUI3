import { peek, subscribe } from '@rbxts/charm';
import { useUpdate } from '@rbxts/pretty-react-hooks';
import React, { useBinding, useEffect, useRef } from '@rbxts/react';
import { useAtom } from '@rbxts/react-charm';
import {
  pressedKeys,
  settingMaxTimelineLength,
  settingScrubberPosition,
} from 'state/editor';
import { currentTimestamps } from 'state/timeline';
import { getSortedDistances } from 'utils/getSortedDistances';
import { HotkeyIDs, isHotkeyPressed } from 'utils/hotkeyUtils';
import { Palette } from 'utils/styling';

export function Scrubber() {
  const update = useUpdate();

  const maxTimelineLength = useAtom(settingMaxTimelineLength);

  const scrubberContainerRef = useRef<Frame>();
  const scrubberHeadRef = useRef<ImageButton>();
  const dragDetectorRef = useRef<UIDragDetector>();

  const initialDragPositionRef = useRef(0);
  const isDraggingRef = useRef(false);

  const [scrubberPositionScale, setScrubberPositionScale] = useBinding(
    peek(settingScrubberPosition) / maxTimelineLength
  );

  // Effect to recalculate scrubber position when max timeline length changes
  useEffect(() => {
    const scrubberPos = peek(settingScrubberPosition);

    // Prevent scrubber position from exceeding the max timeline length
    if (scrubberPos > maxTimelineLength) {
      settingScrubberPosition(maxTimelineLength);
    } else {
      // Update scrubber position
      setScrubberPositionScale(scrubberPos / maxTimelineLength);
    }

    // Force an update
    update();
  }, [maxTimelineLength]);

  useEffect(() => {
    let dragDetectorConstraintConnection: RBXScriptConnection;

    if (dragDetectorRef.current) {
      // Constraint function to clamp scrubber dragging between 0 and 1
      dragDetectorConstraintConnection =
        dragDetectorRef.current.AddConstraintFunction(
          10,
          (proposedPosition, proposedRotation) => {
            const proposedXScale = proposedPosition.X.Scale;
            const futureXScale =
              initialDragPositionRef.current + proposedXScale;
            const clampedXScale = math.clamp(futureXScale, 0, 1);

            const activeKeys = peek(pressedKeys);

            // Snap to timestamp
            if (isHotkeyPressed(HotkeyIDs.ScrubberSnapTimestamp)) {
              const timestampsData = peek(currentTimestamps);
              const timestampPositions = timestampsData.map(
                (data) => data.position
              );
              const nearestTimestamp = getSortedDistances(
                clampedXScale,
                timestampPositions
              )[0];

              return $tuple(
                UDim2.fromScale(
                  nearestTimestamp.position - initialDragPositionRef.current,
                  0
                ),
                proposedRotation
              );
            }

            return $tuple(
              UDim2.fromScale(
                clampedXScale - initialDragPositionRef.current,
                0
              ),
              proposedRotation
            );
          }
        );
    }

    const cleanupFunctions: Array<() => void> = [];

    // Subscription for when the scrubber position is updated externally to update the scrubber
    cleanupFunctions.push(
      subscribe(settingScrubberPosition, (scrubberPos) => {
        if (!isDraggingRef.current) {
          setScrubberPositionScale(
            scrubberPos / peek(settingMaxTimelineLength)
          );
        }
      })
    );

    return () => {
      dragDetectorConstraintConnection.Disconnect();

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
      <imagebutton
        key={'ScrubberHead'}
        ref={scrubberHeadRef}
        ZIndex={21}
        Size={new UDim2(0, 14, 0, 14)}
        Position={scrubberPositionScale.map((x) => new UDim2(x, -7, 0, 0))}
        Image={'rbxassetid://788089696'}
        Rotation={180}
        BackgroundTransparency={1}
        ImageColor3={Palette.PrimaryText}
      >
        <uidragdetector
          ref={dragDetectorRef}
          DragStyle={Enum.UIDragDetectorDragStyle.TranslateLine}
          ResponseStyle={Enum.UIDragDetectorResponseStyle.Scale}
          DragRelativity={Enum.UIDragDetectorDragRelativity.Relative}
          Event={{
            DragStart: () => {
              isDraggingRef.current = true;

              if (scrubberHeadRef.current) {
                initialDragPositionRef.current =
                  scrubberHeadRef.current.Position.X.Scale;
              }
            },
            DragContinue: () => {
              if (scrubberContainerRef.current && scrubberHeadRef.current) {
                const scrubberContainer = scrubberContainerRef.current;
                const scrubberHead = scrubberHeadRef.current;

                const xPosition =
                  (scrubberHead.AbsolutePosition.X -
                    scrubberContainer.AbsolutePosition.X +
                    7) /
                  scrubberContainer.AbsoluteSize.X;

                settingScrubberPosition(xPosition * maxTimelineLength);
                setScrubberPositionScale(xPosition);
              }
            },
            DragEnd: () => {
              isDraggingRef.current = false;

              settingScrubberPosition(
                scrubberPositionScale.getValue() * maxTimelineLength
              );
            },
          }}
        />
      </imagebutton>

      <frame
        key={'ScrubberTail'}
        Size={new UDim2(0, 1, 1, -14)}
        Position={scrubberPositionScale.map((x) => new UDim2(x, 0, 0, 14))}
        BackgroundColor3={Palette.PrimaryText}
        BorderSizePixel={0}
        ZIndex={20}
      />
    </frame>
  );
}
