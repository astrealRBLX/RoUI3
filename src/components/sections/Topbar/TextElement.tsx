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
}: TextElementProps) {
  return (
    <textlabel
      BorderSizePixel={0}
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
    >
      <uipadding PaddingLeft={new UDim(0, 2)} PaddingRight={new UDim(0, 2)} />
      {children}
    </textlabel>
  );
}
