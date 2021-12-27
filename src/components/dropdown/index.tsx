import Roact from '@rbxts/roact';
import { styleColor, styleMod } from 'utils/studioStyleGuide';
import { useTheme } from 'utils/useTheme';

interface IStateProps {
  theme: StudioTheme;
}

interface IProps extends IStateProps {
  Position?: UDim2;
  AnchorPoint?: Vector2;
  Height?: number;
  Open?: boolean;
  Options: string[];
  OptionHeight?: number;
  Selected: string;
  OpenScale?: number;
  OnOptionSelected: (option: string) => void;
  OnClick: () => void;
}

const DropdownComponent = ({
  theme,
  Position,
  AnchorPoint,
  Height = 25,
  Open = false,
  Options,
  OptionHeight = 20,
  Selected,
  OpenScale = 4,
  OnOptionSelected,
  OnClick,
  [Roact.Children]: children,
}: Roact.PropsWithChildren<IProps>) => {
  const optionsElements: Roact.Element[] = [];

  Options.forEach((opt) => {
    optionsElements.push(
      <textbutton
        Active
        AnchorPoint={AnchorPoint}
        AutomaticSize={Enum.AutomaticSize.X}
        Text={opt}
        Size={new UDim2(0, 0, 0, OptionHeight)}
        BackgroundTransparency={1}
        BorderSizePixel={0}
        Font={Enum.Font.SourceSans}
        TextSize={14}
        TextColor3={theme.GetColor(styleColor.MainText)}
        ZIndex={215}
        TextXAlignment={Enum.TextXAlignment.Left}
        Event={{
          MouseEnter: (rbx) => {
            rbx.BackgroundTransparency = 0.8;
          },
          MouseLeave: (rbx) => {
            rbx.BackgroundTransparency = 1;
          },
          Activated: () => {
            OnOptionSelected(opt);
          },
        }}
      >
        <uipadding PaddingLeft={new UDim(0, 4)} PaddingRight={new UDim(0, 4)} />
      </textbutton>
    );
  });

  return (
    <textbutton
      Active
      AutomaticSize={Enum.AutomaticSize.X}
      Position={Position}
      Size={new UDim2(0, 0, 0, Height)}
      ZIndex={220}
      Text={Selected}
      Font={Enum.Font.SourceSansSemibold}
      TextSize={14}
      BorderSizePixel={0}
      BackgroundColor3={theme.GetColor(styleColor.RibbonButton, styleMod.Hover)}
      TextColor3={theme.GetColor(styleColor.MainText)}
      Event={{
        MouseEnter: (rbx) => {
          rbx.BackgroundColor3 = theme.GetColor(styleColor.RibbonButton);
        },
        MouseLeave: (rbx) => {
          rbx.BackgroundColor3 = theme.GetColor(
            styleColor.RibbonButton,
            styleMod.Hover
          );
        },
        Activated: () => {
          OnClick();
        },
      }}
    >
      <uicorner CornerRadius={new UDim(0, 4)} />

      <frame
        Active
        ZIndex={210}
        AutomaticSize={Enum.AutomaticSize.XY}
        Position={Open ? new UDim2(0, 0, 1, -10) : new UDim2()}
        Size={Open ? new UDim2(1, 0, OpenScale, 0) : new UDim2(1, 0, 0, 0)}
        BackgroundTransparency={0}
        BackgroundColor3={theme.GetColor(styleColor.Mid)}
        BorderSizePixel={0}
      >
        <uicorner CornerRadius={new UDim(0, 4)} />
      </frame>

      <scrollingframe
        Active
        ZIndex={210}
        BackgroundTransparency={1}
        Position={Open ? new UDim2(0, 0, 1, -10) : new UDim2()}
        Size={Open ? new UDim2(1, 0, OpenScale, 0) : new UDim2(1, 0, 0, 0)}
        AutomaticCanvasSize={Enum.AutomaticSize.Y}
        CanvasSize={new UDim2()}
        ScrollBarThickness={4}
        ScrollBarImageColor3={theme.GetColor(styleColor.Light)}
        ScrollBarImageTransparency={0.5}
        BorderSizePixel={0}
      >
        <uilistlayout
          FillDirection={Enum.FillDirection.Vertical}
          HorizontalAlignment={Enum.HorizontalAlignment.Left}
          VerticalAlignment={Enum.VerticalAlignment.Top}
        />
        <uipadding PaddingTop={new UDim(0, 10)} />

        {optionsElements}
      </scrollingframe>

      {children}
    </textbutton>
  );
};

export const Dropdown = useTheme()(DropdownComponent);
