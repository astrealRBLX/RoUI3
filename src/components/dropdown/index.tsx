import Roact from '@rbxts/roact';
import { styleColor, styleMod } from 'utils/studioStyleGuide';
import { useTheme } from 'utils/useTheme';

/*
  TODO: Fix the design structure of this component
*/

interface IStateProps {
  theme: StudioTheme;
}

interface IProps extends IStateProps {
  Size?: UDim2;
  Position?: UDim2;
  AnchorPoint?: Vector2;
  Selected: string;
  Options: string[];
  OnOptionSelected: (option: string) => void;
  OnClick: () => void;
  Open?: boolean;
}

const DropdownComponent = ({
  theme,
  Open = false,
  Selected,
  Options,
  Size,
  AnchorPoint,
  Position,
  OnOptionSelected,
  OnClick,
  [Roact.Children]: children,
}: Roact.PropsWithChildren<IProps>) => {
  const optionsArray: Roact.Element[] = [];
  if (Open) {
    Options.forEach((val) => {
      optionsArray.push(
        <textbutton
          Active
          Text={val}
          Size={new UDim2(0, 100 - 4, 0, 25)}
          BorderSizePixel={0}
          BackgroundTransparency={1}
          Font={Enum.Font.SourceSans}
          TextSize={14}
          TextColor3={theme.GetColor(styleColor.MainText)}
          ZIndex={220}
          TextXAlignment={Enum.TextXAlignment.Left}
          Event={{
            MouseEnter: (rbx) => {
              rbx.BackgroundTransparency = 0.8;
            },
            MouseLeave: (rbx) => {
              rbx.BackgroundTransparency = 1;
            },
            Activated: (rbx) => {
              OnOptionSelected(val);
            },
          }}
        >
          <uipadding PaddingLeft={new UDim(0, 4)} />
        </textbutton>
      );
    });
  }

  return (
    <textbutton
      ZIndex={205}
      Active
      Text={Selected}
      Size={Size}
      Position={Position}
      AnchorPoint={AnchorPoint}
      BorderSizePixel={0}
      BackgroundColor3={theme.GetColor(styleColor.RibbonButton, styleMod.Hover)}
      TextColor3={theme.GetColor(styleColor.MainText)}
      Font={Enum.Font.SourceSansSemibold}
      TextSize={14}
      AutoButtonColor={false}
      AutomaticSize={Enum.AutomaticSize.X}
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
      <uipadding PaddingLeft={new UDim(0, 4)} PaddingRight={new UDim(0, 4)} />

      {Open ? (
        <>
          <frame
            Active
            AnchorPoint={new Vector2(0, 0)}
            Position={new UDim2(0, 0, 0, 0)}
            Size={
              new UDim2(
                1,
                4,
                0,
                optionsArray.size() >= 4 ? 100 : optionsArray.size() * 25
              )
            }
            BackgroundTransparency={0}
            BackgroundColor3={theme.GetColor(styleColor.Mid)}
            BorderSizePixel={0}
            ZIndex={208}
          >
            <uicorner CornerRadius={new UDim(0, 4)} />
          </frame>

          <scrollingframe
            Active
            AnchorPoint={new Vector2(0, 0)}
            Position={new UDim2(0, 0, 0, 0)}
            Size={
              new UDim2(
                0,
                100,
                0,
                optionsArray.size() >= 4 ? 100 : optionsArray.size() * 25
              )
            }
            BackgroundTransparency={1}
            AutomaticCanvasSize={Enum.AutomaticSize.Y}
            BorderSizePixel={0}
            ScrollBarThickness={4}
            ScrollBarImageColor3={theme.GetColor(styleColor.Light)}
            ScrollBarImageTransparency={0.5}
            ZIndex={210}
          >
            <uilistlayout
              FillDirection={Enum.FillDirection.Vertical}
              HorizontalAlignment={Enum.HorizontalAlignment.Left}
              VerticalAlignment={Enum.VerticalAlignment.Top}
              SortOrder={Enum.SortOrder.LayoutOrder}
            />
            {...optionsArray}
          </scrollingframe>
        </>
      ) : undefined}

      {children}
    </textbutton>
  );
};

export const Dropdown = useTheme()(DropdownComponent);
