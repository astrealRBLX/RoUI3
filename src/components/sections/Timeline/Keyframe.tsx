import React, { useEffect, useRef } from '@rbxts/react';
import { useAtom } from '@rbxts/react-charm';
import { RunService } from '@rbxts/services';
import { Tooltip } from 'components/ui/Tooltip';
import { KeyframeData, settingMaxTimelineLength } from 'state/editor';
import { getRelativeMouse } from 'utils/getRelativeMouse';
import { getKeyframeColorFromEasingStyle, getKeyframeValuePrettified } from 'utils/keyframeUtils';
import { Palette } from 'utils/styling';

interface KeyframeProps {
  data: KeyframeData;
  refData: { kf: KeyframeData; ref: React.RefObject<Frame> };
  isSelected: boolean;
  onSelected: () => void;
  onDragging: (startMousePos: Vector2, currentMousePos: Vector2) => void;
  onDragged: (startMousePos: Vector2, endMousePos: Vector2) => void;
}

export function Keyframe({ data, refData, isSelected, onSelected, onDragging, onDragged }: KeyframeProps) {
  const maxTimelineLength = useAtom(settingMaxTimelineLength);

  const clicked = useRef(false);
  const isDragging = useRef(false);
  const startPos = useRef(new Vector2());
  const inputStartTime = useRef(0);

  useEffect(() => {
    const conn = RunService.RenderStepped.Connect(() => {
      if (!clicked.current) return;

      const mousePos = getRelativeMouse();

      if (mousePos.sub(startPos.current).Magnitude < 3) return;

      if (tick() - inputStartTime.current < 0.1) return;

      isDragging.current = true;

      onDragging(startPos.current, mousePos);
    });

    return () => {
      conn.Disconnect();
    };
  }, []);

  return (
    <frame
      ref={refData.ref}
      Active={true}
      AnchorPoint={new Vector2(0.5, 0.5)}
      Size={new UDim2(0, 9, 0, 9)}
      Position={new UDim2(data.time / maxTimelineLength, 0, 0.5, 0)}
      ZIndex={15}
      Rotation={45}
      BorderSizePixel={isSelected ? 1 : 0}
      BorderColor3={Palette.White}
      BackgroundColor3={getKeyframeColorFromEasingStyle(data.easingStyle)}
      Event={{
        InputBegan: (_, input) => {
          if (input.UserInputState !== Enum.UserInputState.Begin || input.UserInputType !== Enum.UserInputType.MouseButton1) return;

          startPos.current = new Vector2(input.Position.X, input.Position.Y);
          inputStartTime.current = tick();
          isDragging.current = false;
          clicked.current = true;
        },
        InputEnded: (_, input) => {
          if (input.UserInputState !== Enum.UserInputState.End || input.UserInputType !== Enum.UserInputType.MouseButton1) return;

          if (isDragging.current) {
            isDragging.current = false;
            onDragged(startPos.current, getRelativeMouse());
          } else {
            onSelected();
          }

          clicked.current = false;
        },
      }}
    >
      <imagebutton
        key={'InputSink'}
        ZIndex={14}
        Size={new UDim2(1, 0, 1, 0)}
        Position={new UDim2(0, 0, 0, 0)}
        BackgroundTransparency={1}
        ImageTransparency={1}
      />
      <Tooltip
        text={`${getKeyframeValuePrettified(data.value)} @ ${string.format('%.2f', data.time)} s\n${data.easingStyle.Name} | ${
          data.easingDirection.Name
        }`}
      />
    </frame>
  );
}
