import Roact from '@rbxts/roact';
import RoactHooks from '@rbxts/roact-hooks';
import { Option } from '@rbxts/rust-classes';
import { RunService, TextService } from '@rbxts/services';
import { ShowOnTop } from 'components/show_on_top';
import { styleColor } from 'utils/studioStyleGuide';
import { useTheme } from 'utils/useTheme';

interface IStateProps {
  theme: StudioTheme;
}

interface IProps extends IStateProps {
  Text: string; // Text to render in the tooltip
  Widget: PluginGui; // The current plugin gui
  ShowDelay?: number; // How long the user should be hovering before the tooltip is shown
  MaxWidth?: number; // Maximum width of the tooltip
}

const offset = new Vector2(10, 5);

// Tooltip component that acts as a child of another component
// to display some helpful text on hover
const TooltipComponent: RoactHooks.FC<Roact.PropsWithChildren<IProps>> = (
  {
    theme,
    Text,
    Widget,
    ShowDelay = 0.3,
    MaxWidth = 200,
    [Roact.Children]: roactChildren,
  },
  { useState, useValue, useCallback, useEffect }
) => {
  const children: Roact.Element[] = [roactChildren as never];

  const [showTooltip, setShowTooltip] = useState(false);
  const mousePosition = useValue<Option<Vector2>>(Option.none());
  const hoverConn = useValue<Option<RBXScriptConnection>>(Option.none());
  const targetTime = useValue(0);

  const disconnectHover = useCallback(() => {
    hoverConn.value = hoverConn.value.andWith((conn) => {
      conn.Disconnect();
      return Option.none();
    });
  }, []);

  const connectHover = useCallback(() => {
    disconnectHover();
    hoverConn.value = Option.some(
      RunService.Heartbeat.Connect(() => {
        if (tick() >= targetTime.value) {
          disconnectHover();
          setShowTooltip(true);
        }
      })
    );
  }, []);

  useEffect(() => {
    return disconnectHover;
  }, []);

  if (showTooltip && mousePosition.value.isSome()) {
    const mousePos = mousePosition.value.unwrap();

    let { X: targetX, Y: targetY } = mousePos.add(offset);
    const { X: widgetWidth, Y: widgetHeight } = Widget.AbsoluteSize;

    const paddingSize = 10;
    const maxRequestedWidth = math.min(widgetWidth, MaxWidth);
    const maxAvailableWidth = math.max(0, maxRequestedWidth - paddingSize);
    const textBound = TextService.GetTextSize(
      Text,
      14,
      Enum.Font.SourceSans,
      new Vector2(maxAvailableWidth, math.huge)
    );
    const tooltipTargetWidth = textBound.X + paddingSize + 1;
    const tooltipTargetHeight = textBound.Y + paddingSize + 1;

    if (targetX + tooltipTargetWidth >= widgetWidth)
      targetX = widgetWidth - tooltipTargetWidth;

    if (targetY + tooltipTargetHeight >= widgetHeight)
      targetY = widgetHeight - tooltipTargetHeight;

    children.push(
      <ShowOnTop Widget={Widget}>
        {/* Tooltip */}
        <frame
          ZIndex={10000}
          Position={new UDim2(0, targetX, 0, targetY)}
          Size={new UDim2(0, tooltipTargetWidth, 0, tooltipTargetHeight)}
          BackgroundTransparency={0}
          BackgroundColor3={theme.GetColor(styleColor.Tooltip)}
          BorderColor3={theme.GetColor(styleColor.Border)}
        >
          <uicorner CornerRadius={new UDim(0, 4)} />
          <uistroke Thickness={1} Color={theme.GetColor(styleColor.Border)} />
          <textlabel
            ZIndex={10005}
            Size={new UDim2(1, 0, 1, 0)}
            Text={Text}
            Font={Enum.Font.SourceSans}
            TextSize={14}
            TextWrapped={true}
            TextXAlignment={Enum.TextXAlignment.Left}
            TextColor3={theme.GetColor(styleColor.MainText)}
            BackgroundTransparency={1}
          >
            <uipadding
              PaddingLeft={new UDim(0, paddingSize / 2)}
              PaddingTop={new UDim(0, paddingSize / 2)}
              PaddingRight={new UDim(0, paddingSize / 2)}
              PaddingBottom={new UDim(0, paddingSize / 2)}
            />
          </textlabel>
        </frame>
      </ShowOnTop>
    );
  }

  return (
    <frame
      Size={roactChildren ? UDim2.fromScale(0, 0) : UDim2.fromScale(1, 1)}
      AutomaticSize={roactChildren ? Enum.AutomaticSize.XY : undefined}
      BackgroundTransparency={1}
      Event={{
        MouseEnter: (_, xpos, ypos) => {
          targetTime.value = tick() + ShowDelay;
          mousePosition.value = Option.some(new Vector2(xpos, ypos));
          connectHover();
        },
        MouseMoved: (_, xpos, ypos) => {
          mousePosition.value = Option.some(new Vector2(xpos, ypos));
          targetTime.value = tick() + ShowDelay;
        },
        MouseLeave: () => {
          targetTime.value = 0;
          mousePosition.value = Option.none();
          disconnectHover();
          setShowTooltip(false);
        },
      }}
    >
      {...children}
    </frame>
  );
};

export const Tooltip = useTheme()(new RoactHooks(Roact)(TooltipComponent));
