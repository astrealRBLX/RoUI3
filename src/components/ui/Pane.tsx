import React from '@rbxts/react';
import { Palette } from 'utils/styling';

interface PaneProps {
  children?: React.ReactNode;
  position?: UDim2;
  size?: UDim2 | React.Binding<UDim2>;
  rounded?: boolean;
  padded?: boolean;
  paddingAll?: UDim;
  paddingVertical?: UDim;
  paddingHorizontal?: UDim;
  color?: Color3 | React.Binding<Color3>;
  transparency?: number;
  reference?: React.RefObject<Frame>;
  layoutOrder?: number;
  outlined?: boolean;
  zIndex?: number;
  event?: React.InstanceEvent<Frame>;
}

/*
  components/ui/Pane

  A core UI component that acts as a fancier
  version of a Frame with pretty defaults.
*/
export function Pane({
  children,
  position = UDim2.fromScale(0, 0),
  size = UDim2.fromScale(1, 1),
  rounded = false,
  padded = true,
  paddingAll = new UDim(0, 4),
  paddingHorizontal,
  paddingVertical,
  color = Palette.Background1,
  transparency = 0,
  reference,
  layoutOrder = 0,
  outlined = false,
  zIndex = 1,
  event,
}: PaneProps) {
  return (
    <frame
      Position={position}
      Size={size}
      BackgroundColor3={color}
      BorderSizePixel={0}
      BackgroundTransparency={transparency}
      LayoutOrder={layoutOrder}
      ref={reference}
      ZIndex={zIndex}
      Event={event}
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
      ) : undefined}
      {rounded ? <uicorner CornerRadius={new UDim(0, 4)} /> : <></>}
      {outlined ? (
        <uistroke
          ApplyStrokeMode={Enum.ApplyStrokeMode.Border}
          Color={Palette.Outline}
          Transparency={0}
        />
      ) : undefined}
      {children}
    </frame>
  );
}
