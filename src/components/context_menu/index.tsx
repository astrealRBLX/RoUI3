import Roact from '@rbxts/roact';
import RoactHooks from '@rbxts/roact-hooks';
import { ShowOnTop } from 'components/show_on_top';
import { Tooltip } from 'components/tooltip';
import { styleColor } from 'utils/studioStyleGuide';
import { useTheme } from 'utils/useTheme';

interface IStateProps {
  theme: StudioTheme;
}

interface IProps extends IStateProps {
  Widget: PluginGui;
  ID: string;
  RightClickCallback: (ID: string) => void;
  Visible: boolean;
  Options: Array<{
    Text: string;
    Callback: (rbx: TextButton, input: InputObject) => void;
    Tooltip?: string;
  }>;
}

const offset = new Vector2(5, 0);

// Tooltip component that acts as a child of another component
// to display some helpful text on hover
const ContextMenuComponent: RoactHooks.FC<Roact.PropsWithChildren<IProps>> = (
  {
    theme,
    Widget,
    ID,
    Visible,
    Options,
    RightClickCallback,
    [Roact.Children]: roactChildren,
  },
  { useState, useValue, useCallback, useEffect }
) => {
  const mousePos = Widget.GetRelativeMousePosition();
  const children: Roact.Element[] = [];

  if (Visible) {
    Options.forEach((opt) => {
      children.push(
        <textbutton
          Active
          ZIndex={9000}
          Size={new UDim2(0, 0, 0, 15)}
          AutomaticSize={Enum.AutomaticSize.X}
          BackgroundColor3={theme.GetColor(styleColor.Button)}
          Text={opt.Text}
          Font={Enum.Font.SourceSans}
          TextColor3={theme.GetColor(styleColor.MainText)}
          TextSize={14}
          Event={{
            InputBegan: opt.Callback,
          }}
        >
          <uicorner CornerRadius={new UDim(0, 2)} />
          <uistroke
            Thickness={1}
            Color={theme.GetColor(styleColor.ButtonBorder)}
            ApplyStrokeMode={Enum.ApplyStrokeMode.Border}
          />
          <uipadding
            PaddingBottom={new UDim(0, 2)}
            PaddingTop={new UDim(0, 2)}
            PaddingRight={new UDim(0, 4)}
            PaddingLeft={new UDim(0, 4)}
          />
          {opt.Tooltip ? (
            <Tooltip Text={opt.Tooltip} Widget={Widget} />
          ) : undefined}
        </textbutton>
      );
    });
  }

  return (
    <frame
      Active
      Size={UDim2.fromScale(1, 1)}
      BackgroundTransparency={1}
      Event={{
        InputBegan: (_, input) => {
          if (input.UserInputType !== Enum.UserInputType.MouseButton2) return;
          if (input.UserInputState === Enum.UserInputState.Begin) {
            RightClickCallback(ID);
          }
        },
      }}
    >
      {Visible ? (
        <ShowOnTop Widget={Widget}>
          <frame
            Active
            Size={new UDim2(0, 3, 0, children.size() * 18)}
            Position={
              new UDim2(
                0,
                mousePos.X + offset.X - 5,
                0,
                mousePos.Y + offset.Y + 4
              )
            }
            BackgroundColor3={theme.GetColor(styleColor.MainBackground)}
            BorderColor3={theme.GetColor(styleColor.Border)}
            ZIndex={9000}
          >
            <uicorner CornerRadius={new UDim(0, 4)} />
            <uistroke
              Thickness={1}
              Color={theme.GetColor(styleColor.ButtonBorder)}
            />
          </frame>
          <frame
            Active
            Size={new UDim2(0, 0, 0, 0)}
            AutomaticSize={Enum.AutomaticSize.XY}
            Position={
              mousePos !== undefined
                ? new UDim2(0, mousePos.X + offset.X, 0, mousePos.Y + offset.Y)
                : new UDim2(0, 0, 0, 0)
            }
            ZIndex={9000}
            BackgroundTransparency={1}
          >
            <uipadding
              PaddingBottom={new UDim(0, 0)}
              PaddingTop={new UDim(0, 4)}
              PaddingRight={new UDim(0, 4)}
              PaddingLeft={new UDim(0, 4)}
            />
            <uilistlayout
              FillDirection={Enum.FillDirection.Vertical}
              HorizontalAlignment={Enum.HorizontalAlignment.Left}
              VerticalAlignment={Enum.VerticalAlignment.Top}
              Padding={new UDim(0, 4)}
            />
            {...children}
          </frame>
        </ShowOnTop>
      ) : undefined}
    </frame>
  );
};

export const ContextMenu = useTheme()(
  new RoactHooks(Roact)(ContextMenuComponent)
);
