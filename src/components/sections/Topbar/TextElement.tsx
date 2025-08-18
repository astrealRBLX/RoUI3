import React from '@rbxts/react';
import { Fonts, Palette } from 'utils/styling';

interface TextElementProps {
  children?: React.ReactNode;
  text: string;
  textColor: Color3;
  textSize?: number;
  font?: Font;
  backgroundColor?: Color3;
  backgroundTransparency?: number;
  layoutOrder?: number;
  zIndex?: number;
  size?: UDim2;
  borderSize?: number;
  textXAlign?: Enum.TextXAlignment;
  customPadding?: number;
  anchorPoint?: Vector2;
  position?: UDim2;
}

/*
  components/ui/TextElement

  Displays text
*/
export function TextElement({
  children,
  text,
  textColor,
  textSize = 12,
  font = Fonts.JosefinSans.Regular,
  backgroundColor = Palette.Background1,
  backgroundTransparency = 1,
  layoutOrder = 0,
  zIndex = 1,
  size,
  borderSize = 0,
  textXAlign = Enum.TextXAlignment.Center,
  customPadding = 2,
  anchorPoint = new Vector2(),
  position = new UDim2(),
}: TextElementProps) {
  return (
    <textlabel
      AnchorPoint={anchorPoint}
      Position={position}
      BorderSizePixel={borderSize}
      AutomaticSize={size === undefined ? Enum.AutomaticSize.X : undefined}
      BackgroundTransparency={backgroundTransparency}
      BackgroundColor3={backgroundColor}
      Size={size === undefined ? new UDim2(0, 0, 1, 0) : size}
      FontFace={font}
      TextSize={textSize}
      Text={text}
      TextColor3={textColor}
      LayoutOrder={layoutOrder}
      ZIndex={zIndex}
      TextXAlignment={textXAlign}
    >
      <uipadding PaddingLeft={new UDim(0, customPadding)} PaddingRight={new UDim(0, customPadding)} />
      {children}
    </textlabel>
  );
}
