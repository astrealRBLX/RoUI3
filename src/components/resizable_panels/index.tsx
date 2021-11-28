import Roact from '@rbxts/roact';
import RoactHooks from '@rbxts/roact-hooks';
import { RunService } from '@rbxts/services';
import { Container } from 'components/container';
import { getPlugin } from 'utils/plugin';
import { useTheme } from 'utils/useTheme';
import { getWidgetManager } from 'utils/widgets';

interface IStateProps {
  theme: StudioTheme;
}

interface IProps extends IStateProps {
  Panel1: Roact.Element;
  Panel2: Roact.Element;
  Panel1SizeX: number;
  OnResize: (panel1ScaleX: number) => void;
}

const plugin = getPlugin();
const widgetManager = getWidgetManager();

// Resizable panel component that will render two elements side by side
// with a draggable resize bar in the middle
const ResizablePanelsComponent: RoactHooks.FC<IProps> = (
  { theme, Panel1, Panel2, Panel1SizeX, OnResize },
  { useState, useEffect, useValue }
) => {
  const contentRef = Roact.createRef<Frame>();
  const mouseDiff = useValue(0);
  const draggingResize = useValue(false);

  // Update scale effect
  useEffect(() => {
    const conn = RunService.RenderStepped.Connect(() => {
      if (draggingResize.value && contentRef.getValue()) {
        const mousePos =
          widgetManager.widgets.timeline.GetRelativeMousePosition();
        const contentSize = contentRef.getValue()!.AbsoluteSize;
        const panelScaleX = (mousePos.X - mouseDiff.value) / contentSize.X;

        if (panelScaleX < 0.1 || panelScaleX > 0.5) return;

        plugin.GetMouse().Icon = 'rbxasset://SystemCursors/SplitEW';

        OnResize(panelScaleX);
      }
    });

    return () => {
      conn.Disconnect();
    };
  }, [contentRef]);

  return (
    <Container
      Size={new UDim2(1, 0, 1, -34)}
      ContainerTransparency={1}
      Margin={{}}
      ContainerRef={contentRef}
      ExternalChildren={[
        <frame
          Size={new UDim2(0, 8, 1, 0)}
          Position={new UDim2(Panel1SizeX, -4, 0, 0)}
          ZIndex={100}
          BackgroundTransparency={1}
          Event={{
            MouseEnter: () => {
              plugin.GetMouse().Icon = 'rbxasset://SystemCursors/SplitEW';
            },
            MouseLeave: () => {
              plugin.GetMouse().Icon = 'rbxasset://SystemCursors/Arrow';
            },
            InputBegan: (rbx, input) => {
              if (input.UserInputType === Enum.UserInputType.MouseButton1) {
                mouseDiff.value =
                  widgetManager.widgets.timeline.GetRelativeMousePosition().X -
                  rbx.AbsolutePosition.X;
                draggingResize.value = true;
                plugin.GetMouse().Icon = 'rbxasset://SystemCursors/SplitEW';
              }
            },
            InputEnded: (_, input) => {
              if (input.UserInputType === Enum.UserInputType.MouseButton1) {
                draggingResize.value = false;
                plugin.GetMouse().Icon = 'rbxasset://SystemCursors/Arrow';
              }
            },
          }}
        ></frame>,
      ]}
    >
      <uilistlayout
        FillDirection={Enum.FillDirection.Horizontal}
        HorizontalAlignment={Enum.HorizontalAlignment.Left}
        VerticalAlignment={Enum.VerticalAlignment.Top}
        Padding={new UDim(0, 4)}
      />

      {Panel1}
      {Panel2}
    </Container>
  );
};

export const ResizablePanels = useTheme()(
  new RoactHooks(Roact)(ResizablePanelsComponent)
);
