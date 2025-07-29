import { useMotion } from '@rbxts/pretty-react-hooks';
import React, { useBinding, useState } from '@rbxts/react';
import { springs } from 'utils/springs';
import { Palette } from 'utils/styling';
import { useToggleState } from 'utils/useToggleState';

interface ImageButtonElementProps {
  children?: React.ReactNode;
  image: string;
  imageColor?: Color3;
  asToggle?: boolean; // If `true` acts as a toggle instead of single action
  toggledColor?: Color3; // Color to use when the button is toggled if `asToggle` is true
  onPressed?: () => void;
  layoutOrder?: number;
  sizePx?: number;
  useVisualEffects?: boolean; // Should visual effects (e.g. animations) be used
  zIndex?: number;
  sinkInput?: boolean; // Should input be sinked
  imageRectSize?: Vector2;
  imageRectOffset?: Vector2;
}

/*
  components/ui/ImageButtonElement

  Acts as a button with an attached image
*/
export function ImageButtonElement({
  children,
  image,
  imageColor = Palette.DefaultText,
  asToggle = false,
  toggledColor = Palette.ButtonPrimaryBackground,
  layoutOrder = 0,
  sizePx = 20,
  useVisualEffects = true,
  zIndex = 1,
  sinkInput = false,
  imageRectSize = new Vector2(0, 0),
  imageRectOffset = new Vector2(0, 0),
  onPressed,
}: ImageButtonElementProps) {
  const [buttonSize, buttonSizeMotion] = useMotion(0);
  const buttonToggled = useToggleState(false);

  return (
    <imagebutton
      ZIndex={zIndex}
      ImageRectSize={imageRectSize}
      ImageRectOffset={imageRectOffset}
      Active={!sinkInput}
      Interactable={!sinkInput}
      Size={buttonSize.map((size) => new UDim2(0, sizePx - size, 0, sizePx - size))}
      BackgroundTransparency={1}
      AnchorPoint={new Vector2(0, 0.5)}
      Position={new UDim2(0, 0, 0.5, 0)}
      Image={image}
      LayoutOrder={layoutOrder}
      ScaleType={Enum.ScaleType.Fit}
      ImageColor3={buttonToggled.on ? toggledColor : imageColor}
      Event={{
        Activated: () => {
          if (asToggle) {
            buttonToggled.toggle();
          }

          if (onPressed !== undefined) onPressed();
        },
        MouseEnter: (rbx) => {
          if (useVisualEffects) {
            rbx.ImageColor3 = buttonToggled.on ? Palette.ButtonPrimaryHoveringBackground : Palette.White;
          }
        },
        MouseLeave: (rbx) => {
          if (useVisualEffects) {
            rbx.ImageColor3 = buttonToggled.on ? toggledColor : imageColor;
          }
        },
        MouseButton1Down: () => {
          if (useVisualEffects) buttonSizeMotion.spring(2, springs.responsive);
        },
        MouseButton1Up: () => {
          if (useVisualEffects) buttonSizeMotion.spring(0, springs.responsive);
        },
      }}
    >
      {children}
    </imagebutton>
  );
}
