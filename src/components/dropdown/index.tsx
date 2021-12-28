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
    <frame
      Active
      AutomaticSize={Enum.AutomaticSize.X}
      BorderSizePixel={0}
      BackgroundColor3={theme.GetColor(styleColor.RibbonButton, styleMod.Hover)}
      ZIndex={220}
      Size={new UDim2(0, 0, 0, Height)}
      Position={Position}
    >
      <uilistlayout
        FillDirection={Enum.FillDirection.Horizontal}
        HorizontalAlignment={Enum.HorizontalAlignment.Left}
        VerticalAlignment={Enum.VerticalAlignment.Center}
      />
      <uicorner CornerRadius={new UDim(0, 4)} />
      <uipadding PaddingLeft={new UDim(0, 4)} PaddingRight={new UDim(0, 4)} />

      <textbutton
        Active
        AutomaticSize={Enum.AutomaticSize.X}
        Size={new UDim2(0, 0, 1, 0)}
        Text={Selected}
        Font={Enum.Font.SourceSansSemibold}
        TextSize={14}
        TextColor3={theme.GetColor(styleColor.MainText)}
        BackgroundTransparency={1}
        ZIndex={225}
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
        <frame
          Active
          ZIndex={210}
          AutomaticSize={Enum.AutomaticSize.XY}
          Position={Open ? new UDim2(0, -4, 1, -10) : new UDim2(0, -4, 0, 0)}
          Size={Open ? new UDim2(1, 4, OpenScale, 0) : new UDim2(1, 0, 0, 0)}
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
          Position={Open ? new UDim2(0, -4, 1, -10) : new UDim2(0, -4, 0, 0)}
          Size={Open ? new UDim2(1, 0, OpenScale, 0) : new UDim2(1, 0, 0, 0)}
          AutomaticCanvasSize={Enum.AutomaticSize.Y}
          CanvasSize={new UDim2()}
          ScrollBarThickness={4}
          ScrollBarImageColor3={theme.GetColor(styleColor.Light)}
          ScrollBarImageTransparency={0}
          BorderSizePixel={0}
          AutomaticSize={Enum.AutomaticSize.X}
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

      <imagebutton
        Image={'rbxassetid://5279719038'}
        BackgroundTransparency={1}
        Size={new UDim2(0, 12, 0, 12)}
        ImageColor3={theme.GetColor(styleColor.BrightText)}
        ScaleType={Enum.ScaleType.Fit}
        ZIndex={225}
        Event={{
          Activated: () => {
            OnClick();
          },
        }}
      />
    </frame>
  );
};

export const Dropdown = useTheme()(DropdownComponent);
