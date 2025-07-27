import React, {
  useBinding,
  useCallback,
  useEffect,
  useRef,
} from '@rbxts/react';
import { Fonts, Palette } from 'utils/styling';
import { TextElement } from './TextElement';

interface TextboxElementProps {
  children?: React.ReactNode;
  labelText: string; // Text of the label that appears next to the text box
  initialText: string; // Starting text of the text box
  placeholderText: string; // Placeholder text when the text box is empty
  suffix?: string; // Suffix to display after text when not editing the text box
  asNumberInput?: boolean; // Should only numbers be accepted?
  decimalPlaces?: number; // If only numbers are accepted then how many decimal places to use?
  valueClamper?: (num: number) => number; // Calls a clamper function if acting as a number input
  onTextChanged?: (value: string | number, finishedEditing: boolean) => void; // Callback for when input changes
}

/*
  Formats a string into a number with a given number of decimals
*/
function formatWithDecimals(text: string, decimalPlaces: number) {
  let match = text.match('^(%d*)%.?(%d*)$'); // Capture number before decimal & after decimal

  if (match) {
    let [beforeDec = '', afterDec = ''] = match;
    let limitedDec = (afterDec as string).sub(1, decimalPlaces);

    if (!tonumber(beforeDec)) {
      beforeDec = '0';
    }

    if (!tonumber(limitedDec)) {
      limitedDec = '';

      for (let i = 0; i < decimalPlaces; i++) {
        limitedDec += '0';
      }
    } else if (tonumber(limitedDec) && limitedDec.size() < decimalPlaces) {
      for (let i = limitedDec.size(); i < decimalPlaces; i++) {
        limitedDec += '0';
      }
    }

    return `${beforeDec}.${limitedDec}`;
  }

  return text;
}

/*
  components/ui/TextboxElement

  Used to gather text or number input
*/
export function TextboxElement({
  children,
  labelText,
  initialText,
  placeholderText,
  suffix,
  asNumberInput = false,
  decimalPlaces = 0,
  valueClamper,
  onTextChanged,
}: TextboxElementProps) {
  const currentTextRef = useRef(initialText);
  const [isEditing, setIsEditing] = useBinding(false);

  useEffect(() => {
    currentTextRef.current = initialText;
  }, [initialText]);

  const onTextFocusChanged = useCallback((textbox: TextBox) => {
    if (isEditing.getValue() && suffix !== undefined) {
      // Remove suffix when editing starts
      textbox.Text = textbox.Text.sub(1, -suffix.size() - 2);
    } else if (!isEditing.getValue() && suffix !== undefined) {
      let finalText = textbox.Text;

      // Fix formatting for number of decimal places
      if (asNumberInput && decimalPlaces > 0) {
        finalText = formatWithDecimals(finalText, decimalPlaces);
      }

      if (asNumberInput && valueClamper !== undefined) {
        const numVal = valueClamper(tonumber(finalText)!);

        finalText = string.format(`%.${decimalPlaces}f`, tostring(numVal));

        if (onTextChanged) onTextChanged(numVal, true);
      }

      // Apply suffix when editing ends
      textbox.Text = `${finalText} ${suffix}`;
    }
  }, []);

  const onTextChange = useCallback((textbox: TextBox) => {
    const txt = textbox.Text;

    // Forced text change from `onTextFocusChanged()`
    if (!isEditing.getValue()) {
      currentTextRef.current = txt;
      return;
    }

    if (txt === currentTextRef.current) {
      return;
    }

    // If this textbox is a number input then limit text to digits (and decimals if `decimalPlaces` > 0)
    if (asNumberInput) {
      let totalReplacements = 0;
      let finalNumberText = txt;

      const [cleanedText, numReplacements1] = txt.gsub(
        decimalPlaces > 0 ? '[^%d%.]' : '[^%d]',
        ''
      );

      finalNumberText = cleanedText;
      totalReplacements += numReplacements1;

      // Prevent more than one decimal point from existing at a time
      if (decimalPlaces > 0) {
        let decimalFound = false;
        const [formattedText, numReplacements2] = cleanedText.gsub('%.', () => {
          if (!decimalFound) {
            decimalFound = true;
            return '.';
          } else {
            return '';
          }
        });

        finalNumberText = formattedText;
        totalReplacements += decimalFound
          ? numReplacements2 - 1
          : numReplacements2;
      }

      // If any formatting changes had to be made then update the textbox
      if (totalReplacements > 0) {
        textbox.Text = finalNumberText;
        return;
      }
    }

    currentTextRef.current = txt;

    if (onTextChanged)
      onTextChanged(
        asNumberInput && decimalPlaces > 0
          ? valueClamper!(tonumber(formatWithDecimals(txt, decimalPlaces))!)
          : txt,
        false
      );
  }, []);

  return (
    <>
      <uilistlayout
        FillDirection={Enum.FillDirection.Horizontal}
        HorizontalAlignment={Enum.HorizontalAlignment.Left}
        VerticalAlignment={Enum.VerticalAlignment.Center}
        Padding={new UDim(0, 2)}
      />

      <TextElement
        text={labelText}
        textColor={Palette.DefaultText}
        textSize={12}
        font={Fonts.JosefinSans.Medium}
      >
        {children}
      </TextElement>
      <textbox
        ClearTextOnFocus={false}
        TextXAlignment={Enum.TextXAlignment.Left}
        AutomaticSize={Enum.AutomaticSize.X}
        Size={new UDim2(0, 0, 1, -4)}
        FontFace={Fonts.JosefinSans.Regular}
        BackgroundColor3={Palette.Background1}
        TextColor3={Palette.DefaultText}
        PlaceholderColor3={Palette.ButtonDisabledText}
        PlaceholderText={placeholderText}
        Text={suffix === undefined ? initialText : `${initialText} ${suffix}`}
        TextSize={12}
        Event={{
          Focused: (rbx) => {
            setIsEditing(true);
            onTextFocusChanged(rbx);
          },
          FocusLost: (rbx) => {
            setIsEditing(false);
            onTextFocusChanged(rbx);
          },
        }}
        Change={{
          Text: (rbx) => {
            onTextChange(rbx);
          },
        }}
      >
        <uicorner CornerRadius={new UDim(0, 2)} />
        <uipadding PaddingLeft={new UDim(0, 4)} PaddingRight={new UDim(0, 4)} />
        <uistroke
          ApplyStrokeMode={Enum.ApplyStrokeMode.Border}
          Color={Palette.Outline}
          Transparency={0}
        />
      </textbox>
    </>
  );
}
