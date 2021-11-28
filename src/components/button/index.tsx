import Roact from '@rbxts/roact';
import { styleColor, styleMod } from 'utils/studioStyleGuide';
import { useTheme } from 'utils/useTheme';

export enum ButtonStyle {
  Primary,
  Standard,
}

interface IStateProps {
  theme: StudioTheme;
}

interface IProps extends IStateProps {
  Text?: string;
  Size?: UDim2;
  Position?: UDim2;
  Font?: Enum.Font;
  AnchorPoint?: Vector2;

  OnActivated: (
    rbx: TextButton,
    inputObject: InputObject,
    clickCount: number
  ) => void;

  MaxTextSize?: number;
  MinTextSize?: number;

  PaddingX?: UDim;
  PaddingY?: UDim;

  Style?: ButtonStyle;

  Disabled?: boolean;
}

// Button component with styling & state
const ButtonComponent = ({
  Text,
  Size,
  Position,
  Font,
  AnchorPoint,
  MaxTextSize,
  MinTextSize,
  PaddingX,
  PaddingY,
  Style = ButtonStyle.Standard,
  Disabled = false,

  OnActivated,

  theme,
}: IProps) => {
  // Resolve style
  let colorStyle =
    Style === ButtonStyle.Standard
      ? styleColor.Button
      : Disabled
      ? styleColor.Button
      : styleColor.MainButton;
  let colorMod = Disabled ? styleMod.Disabled : styleMod.Default;

  return (
    <textbutton
      Text={Text}
      Size={Size ?? UDim2.fromScale(1, 1)}
      Position={Position}
      BackgroundColor3={theme.GetColor(colorStyle, colorMod)}
      TextScaled={true}
      Font={Font ?? Enum.Font.SourceSans}
      AnchorPoint={AnchorPoint}
      AutoButtonColor={false}
      TextColor3={theme.GetColor(
        Style === ButtonStyle.Standard
          ? styleColor.ButtonText
          : Disabled
          ? styleColor.ButtonText
          : styleColor.BrightText,
        colorMod
      )}
      Event={{
        Activated: (rbx, inp, count) => {
          if (!Disabled) OnActivated(rbx, inp, count);
        },
        MouseEnter: (rbx) => {
          if (!Disabled)
            rbx.BackgroundColor3 = theme.GetColor(colorStyle, styleMod.Hover);
        },
        MouseLeave: (rbx) => {
          if (!Disabled) rbx.BackgroundColor3 = theme.GetColor(colorStyle);
        },
        MouseButton1Down: (rbx) => {
          if (!Disabled)
            rbx.BackgroundColor3 = theme.GetColor(colorStyle, styleMod.Pressed);
        },
        MouseButton1Up: (rbx) => {
          if (!Disabled) rbx.BackgroundColor3 = theme.GetColor(colorStyle);
        },
      }}
    >
      {MaxTextSize || MinTextSize ? (
        <uitextsizeconstraint
          MaxTextSize={MaxTextSize}
          MinTextSize={MinTextSize}
        />
      ) : undefined}
      {PaddingX || PaddingY ? (
        <uipadding
          PaddingTop={PaddingY}
          PaddingBottom={PaddingY}
          PaddingLeft={PaddingX}
          PaddingRight={PaddingX}
        />
      ) : undefined}
      <uicorner CornerRadius={new UDim(0, 8)} />
    </textbutton>
  );
};

export const Button = useTheme()(ButtonComponent);
