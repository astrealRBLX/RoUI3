import React, { useBinding, useEffect, useRef, useState } from '@rbxts/react';
import { Fonts, Palette } from 'utils/styling';
import { TextElement } from './TextElement';
import { ImageButtonElement } from './ImageButtonElement';
import { createNextOrder } from 'utils/createNextOrder';
import { Pane } from 'components/ui/Pane';
import { TextService } from '@rbxts/services';
import { useToggleState } from 'utils/hooks/useToggleState';

interface DropdownOptionElementProps {
  children?: React.ReactNode;
  labelText: string; // Text of the label that appears next to the dropdown
  options: string[]; // List of dropdown options (first in the array is used as the default selection)
  usesConfirmButton?: boolean; // Should a button be used to confirm a dropdown option selection
  buttonImage?: string; // The image used for the button to confirm a selection
  onOptionChosen?: (selectedOption: string) => void; // The selected option callback when an option is chosen
  onButtonClicked?: (selectedOption: string) => void; // Callback for when the button is clicked
}

/*
  components/ui/DropdownOption

  Used to select an option from a list of choices
*/
export function DropdownOptionElement({
  children,
  labelText,
  options,
  usesConfirmButton = true,
  buttonImage = 'rbxassetid://3192519002',
  onOptionChosen,
  onButtonClicked,
}: DropdownOptionElementProps) {
  const nextOrder = createNextOrder();

  const dropdownButtonRef = useRef<TextButton>();
  const [selectedOption, setSelectedOption] = useState(options[0]);
  const [automaticDropdownY, setAutomaticDropdownY] = useBinding(0);
  const [dropdownMinimumX, setDropdownMinimumX] = useBinding(0);
  const [dropdownElements, setDropdownElements] = useState<React.ReactChild[]>([]);
  const dropdownOpen = useToggleState(false);

  useEffect(() => {
    const dElements: React.ReactChild[] = [];
    let totalY = 0;
    let minimumX = 0;

    options.forEach((option) => {
      if (option !== selectedOption) {
        const textBound = TextService.GetTextSize(option, 10, Enum.Font.JosefinSans, new Vector2(150, 14));

        dElements.push(
          <textbutton
            key={`${option}_DropdownOption`}
            ZIndex={35}
            BackgroundTransparency={0}
            BackgroundColor3={Palette.Background3}
            Size={new UDim2(1, 0, 0, textBound.Y + 4)}
            Text={option}
            FontFace={Fonts.JosefinSans.Regular}
            TextSize={10}
            TextColor3={Palette.DefaultText}
            BorderSizePixel={0}
            TextXAlignment={Enum.TextXAlignment.Left}
            Event={{
              Activated: () => {
                dropdownOpen.disable();
                setSelectedOption(option);
                if (onOptionChosen !== undefined) onOptionChosen(option);
              },
            }}
          >
            <uipadding PaddingLeft={new UDim(0, 2)} />
          </textbutton>
        );

        minimumX = math.max(minimumX, textBound.X + 6);
        totalY += textBound.Y + 6;
      }

      if (dropdownOpen.on && dropdownButtonRef.current && minimumX > dropdownButtonRef.current.AbsoluteSize.X) {
        setDropdownMinimumX(minimumX);
      } else if (dropdownOpen.on && dropdownButtonRef.current && minimumX <= dropdownButtonRef.current.AbsoluteSize.X) {
        setDropdownMinimumX(dropdownButtonRef.current.AbsoluteSize.X);
      } else if (!dropdownOpen.on && dropdownButtonRef.current) {
        setDropdownMinimumX(0);
      }
      setAutomaticDropdownY(totalY);
      setDropdownElements(dElements);
    });
  }, [options, selectedOption, dropdownButtonRef, dropdownOpen.on]);

  return (
    <>
      <uilistlayout
        FillDirection={Enum.FillDirection.Horizontal}
        HorizontalAlignment={Enum.HorizontalAlignment.Left}
        VerticalAlignment={Enum.VerticalAlignment.Center}
        Padding={new UDim(0, 2)}
        SortOrder={Enum.SortOrder.LayoutOrder}
      />

      <TextElement text={labelText} textColor={Palette.DefaultText} textSize={12} font={Fonts.JosefinSans.Medium} layoutOrder={nextOrder()}>
        {children}
      </TextElement>
      <frame AutomaticSize={Enum.AutomaticSize.X} BackgroundTransparency={1} Size={new UDim2(0, 0, 1, -4)} LayoutOrder={nextOrder()}>
        <textbutton
          ref={dropdownButtonRef}
          ZIndex={34}
          AutomaticSize={Enum.AutomaticSize.X}
          BackgroundTransparency={0}
          BackgroundColor3={Palette.Background1}
          Size={dropdownMinimumX.map((x) => new UDim2(0, x, 1, 0))}
          Text={''}
          Event={{
            Activated: () => {
              dropdownOpen.toggle();
            },
          }}
        >
          <uicorner CornerRadius={new UDim(0, 2)} />
          <uipadding PaddingLeft={new UDim(0, 4)} PaddingRight={new UDim(0, 4)} />
          <uistroke ApplyStrokeMode={Enum.ApplyStrokeMode.Border} Color={Palette.Outline} Transparency={0} />
          <uilistlayout
            FillDirection={Enum.FillDirection.Horizontal}
            HorizontalAlignment={Enum.HorizontalAlignment.Left}
            VerticalAlignment={Enum.VerticalAlignment.Center}
            Padding={new UDim(0, 2)}
            SortOrder={Enum.SortOrder.LayoutOrder}
          />

          <TextElement zIndex={35} text={selectedOption} textColor={Palette.DefaultText} textSize={12} font={Fonts.JosefinSans.Regular} />
          <ImageButtonElement
            zIndex={35}
            image='rbxassetid://81194770428805'
            layoutOrder={nextOrder()}
            sizePx={12}
            useVisualEffects={false}
            sinkInput={true}
          />
        </textbutton>
        {dropdownOpen.on ? (
          <Pane
            zIndex={33}
            size={dropdownMinimumX.map((x) => new UDim2(0, x, 0, automaticDropdownY.getValue() > 50 ? 60 : automaticDropdownY.getValue() + 10))}
            position={new UDim2(0, 0, 1, -4)}
            padded={false}
            rounded={true}
            outlined={true}
          >
            <scrollingframe
              key={'DropdownScrollingFrame'}
              ZIndex={34}
              BackgroundTransparency={1}
              BorderSizePixel={0}
              Size={automaticDropdownY.map((y) => new UDim2(1, 0, 0, y > 50 ? 50 : y))}
              Position={new UDim2(0, 0, 0, 8)}
              CanvasSize={automaticDropdownY.map((y) => new UDim2(0, 0, 0, y))}
              ScrollBarImageColor3={Palette.White}
              ScrollBarThickness={2}
              ScrollingDirection={Enum.ScrollingDirection.Y}
            >
              <uilistlayout
                FillDirection={Enum.FillDirection.Vertical}
                HorizontalAlignment={Enum.HorizontalAlignment.Center}
                VerticalAlignment={Enum.VerticalAlignment.Top}
                Padding={new UDim(0, 2)}
                SortOrder={Enum.SortOrder.Name}
              />

              {dropdownElements}
            </scrollingframe>
          </Pane>
        ) : undefined}
      </frame>
      {usesConfirmButton ? (
        <ImageButtonElement
          image={buttonImage}
          layoutOrder={nextOrder()}
          onPressed={() => {
            if (onButtonClicked !== undefined) onButtonClicked(selectedOption);
          }}
        ></ImageButtonElement>
      ) : undefined}
    </>
  );
}
