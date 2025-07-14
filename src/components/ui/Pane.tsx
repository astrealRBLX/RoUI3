import React from '@rbxts/react';
import { Pallete } from 'utils/styling';

interface PaneProps {
  children?: React.ReactNode;
  position?: UDim2;
  size?: UDim2;
  rounded?: boolean;
  padded?: boolean;
  paddingAll?: UDim;
  paddingVertical?: UDim;
  paddingHorizontal?: UDim;
  color?: Color3;
}

export function Pane({
  children,
  position = UDim2.fromScale(0, 0),
  size = UDim2.fromScale(1, 1),
  rounded = false,
  padded = true,
  paddingAll = new UDim(0, 4),
  paddingHorizontal,
  paddingVertical,
  color = Pallete.Background1,
}: PaneProps) {
  return (
    <frame
      Position={position}
      Size={size}
      BackgroundColor3={color}
      BorderSizePixel={0}
    >
      {padded ? (
        <uipadding
          PaddingTop={
            paddingVertical === undefined ? paddingAll : paddingVertical
          }
          PaddingBottom={
            paddingVertical === undefined ? paddingAll : paddingVertical
          }
          PaddingLeft={
            paddingHorizontal === undefined ? paddingAll : paddingHorizontal
          }
          PaddingRight={
            paddingHorizontal === undefined ? paddingAll : paddingHorizontal
          }
        />
      ) : (
        <></>
      )}
      {rounded ? <uicorner CornerRadius={new UDim(0, 4)} /> : <></>}
      {children}
    </frame>
  );
}
