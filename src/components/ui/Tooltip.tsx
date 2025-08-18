import React, { useBinding, useCallback, useEffect, useState } from '@rbxts/react';
import { createPortal } from '@rbxts/react-roblox';
import { Option } from '@rbxts/rust-classes';
import { RunService, TextService } from '@rbxts/services';
import { appWidget } from 'state/globals';
import { Fonts, Palette } from 'utils/styling';

interface TooltipProps {
  title?: string;
  text: string;
  tooltipDelay?: number;
  tooltipTextSize?: number;
  widgetOption?: Option<DockWidgetPluginGui>;
}

/*
  components/ui/Tooltip

  This component can be added as a child to anything
  and provide a top-level tooltip displaying information
  when that element is hovered over long enough.
*/
export function Tooltip({ title, text, tooltipDelay = 0.3, tooltipTextSize = 12, widgetOption = appWidget() }: TooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [hoveringMousePosition, setHoveringMousePosition] = useBinding<Option<Vector2>>(Option.none());
  const [targetHoverTime, setTargetHoverTime] = useBinding(0);
  const [hoveringConnection, setHoveringConnection] = useBinding<Option<RBXScriptConnection>>(Option.none());

  // End hovering & clean up
  const endHovering = useCallback(() => {
    hoveringConnection.getValue().andWith((conn) => {
      conn.Disconnect();
      return Option.none();
    });
  }, []);

  // Start hovering waiting to see if the tooltip delay is reached
  const startHovering = useCallback(() => {
    endHovering();

    setHoveringConnection(
      Option.some(
        RunService.Heartbeat.Connect(() => {
          if (tick() >= targetHoverTime.getValue()) {
            endHovering();
            setShowTooltip(true);
          }
        })
      )
    );
  }, []);

  // Clean up upon unmount
  useEffect(() => {
    return endHovering;
  }, []);

  let tooltipElement: React.ReactNode;

  if (showTooltip && hoveringMousePosition.getValue().isSome() && appWidget().isSome()) {
    const mousePos = hoveringMousePosition.getValue().unwrap();

    let { X: targetX, Y: targetY } = mousePos.add(new Vector2(10, 5));
    const { X: widgetWidth, Y: widgetHeight } = appWidget().unwrap().AbsoluteSize;

    const finalText = title === undefined ? text : `<font weight="Heavy">${title}</font><br />${text}`;

    // Calculate the tooltip's target size based on text
    const paddingSize = 8;
    const maxRequestedWidth = math.min(widgetWidth, 250);
    const maxAvailableWidth = math.max(0, maxRequestedWidth - paddingSize);

    const tParams = new Instance('GetTextBoundsParams');
    tParams.Font = Fonts.JosefinSans.Regular;
    tParams.RichText = true;
    tParams.Size = tooltipTextSize;
    tParams.Width = maxAvailableWidth;
    tParams.Text = finalText;

    const textBound = TextService.GetTextBoundsAsync(tParams);
    const tooltipTargetWidth = textBound.X + paddingSize + 1;
    const tooltipTargetHeight = textBound.Y + paddingSize + 1;

    // Adjust the tooltip's position depending on if it is off screen
    if (targetX + tooltipTargetWidth >= widgetWidth) targetX = widgetWidth - tooltipTargetWidth - 5;
    if (targetY + tooltipTargetHeight >= widgetHeight) targetY = widgetHeight - tooltipTargetHeight - 5;

    // The actual tooltip that pops up
    tooltipElement = createPortal(
      <frame
        ZIndex={100}
        Position={new UDim2(0, targetX, 0, targetY)}
        Size={new UDim2(0, tooltipTargetWidth, 0, tooltipTargetHeight)}
        BackgroundColor3={Palette.Background1}
        BackgroundTransparency={0.1}
      >
        <uicorner CornerRadius={new UDim(0, 2)} />
        <uistroke Thickness={1} Color={Palette.PrimaryText} ApplyStrokeMode={Enum.ApplyStrokeMode.Border} />
        <textlabel
          ZIndex={1001}
          Size={new UDim2(1, 0, 1, 0)}
          RichText={true}
          Text={finalText}
          FontFace={Fonts.JosefinSans.Regular}
          TextSize={tooltipTextSize}
          TextWrapped={true}
          TextXAlignment={Enum.TextXAlignment.Left}
          TextColor3={Palette.DefaultText}
          BackgroundTransparency={1}
        >
          <uipadding
            PaddingBottom={new UDim(0, paddingSize / 2)}
            PaddingLeft={new UDim(0, paddingSize / 2)}
            PaddingRight={new UDim(0, paddingSize / 2)}
            PaddingTop={new UDim(0, paddingSize / 2)}
          />
        </textlabel>
      </frame>,
      widgetOption.unwrap()
    );
  }

  return (
    <frame
      Size={new UDim2(1, 0, 1, 0)}
      BackgroundTransparency={1}
      Event={{
        MouseEnter: (_, xpos, ypos) => {
          setTargetHoverTime(tick() + tooltipDelay);
          setHoveringMousePosition(Option.some(new Vector2(xpos, ypos)));
          startHovering();
        },
        MouseMoved: (_, xpos, ypos) => {
          setHoveringMousePosition(Option.some(new Vector2(xpos, ypos)));
          setTargetHoverTime(tick() + tooltipDelay);
        },
        MouseLeave: () => {
          setTargetHoverTime(0);
          setHoveringMousePosition(Option.none());
          endHovering();
          setShowTooltip(false);
        },
      }}
    >
      {tooltipElement}
    </frame>
  );
}
