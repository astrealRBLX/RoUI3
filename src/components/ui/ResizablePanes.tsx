import React, { useBinding, useEffect, useRef } from '@rbxts/react';
import { createPortal } from '@rbxts/react-roblox';
import { RunService } from '@rbxts/services';
import { Pane } from 'components/ui/Pane';
import { appPlugin, appWidget } from 'state/globals';

interface ResizablePanesProps {
  leftPane: React.Element;
  rightPane: React.Element;
  leftPaneDefaultXScale?: number;
  leftPaneMinimumXScale?: number;
  leftPaneMaximumXScale?: number;
}

/*
  components/ui/ResizablePanes

  A collection of horizontal panes that can be resized
  by dragging in the middle.
*/
export function ResizablePanes({
  leftPane,
  rightPane,
  leftPaneDefaultXScale = 0.2,
  leftPaneMinimumXScale = 0.15,
  leftPaneMaximumXScale = 0.4,
}: ResizablePanesProps) {
  const dragBoxRef = useRef<Frame>();
  const [mouseDiff, setMouseDiff] = useBinding(0);
  const [isDragging, setIsDragging] = useBinding(false);
  const [resizeHandleX, setResizeHandleX] = useBinding(leftPaneDefaultXScale);

  // Resizing effect
  useEffect(() => {
    const conn = RunService.RenderStepped.Connect(() => {
      // Must be actively dragging, appWidget must exist, & a reference to the dragging hitbox must exist
      if (
        !isDragging.getValue() ||
        appWidget().isNone() ||
        dragBoxRef.current === undefined
      )
        return;

      const mousePos = appWidget().unwrap().GetRelativeMousePosition();
      const contentSize = dragBoxRef.current.AbsoluteSize;
      const leftPaneScaleX =
        (mousePos.X - mouseDiff.getValue()) / contentSize.X;

      // Resize constraints
      if (
        leftPaneScaleX < leftPaneMinimumXScale ||
        leftPaneScaleX > leftPaneMaximumXScale
      )
        return;

      appPlugin().unwrap().GetMouse().Icon = 'rbxasset://SystemCursors/SplitEW';

      setResizeHandleX(leftPaneScaleX);
    });

    return () => conn.Disconnect();
  }, []);

  return (
    <>
      {/* Resizing Hitbox */}
      <Pane
        key={'ResizeHandleBox'}
        padded={false}
        transparency={1}
        reference={dragBoxRef}
      >
        <frame
          key={'ResizeHandle'}
          Size={new UDim2(0, 8, 1, 0)}
          Position={resizeHandleX.map((x) => new UDim2(x, 0, 0, 0))}
          BackgroundTransparency={1}
          Event={{
            MouseEnter: () => {
              appPlugin().unwrap().GetMouse().Icon =
                'rbxasset://SystemCursors/SplitEW';
            },
            MouseLeave: () => {
              appPlugin().unwrap().GetMouse().Icon =
                'rbxasset://SystemCursors/Arrow';
            },
            InputBegan: (rbx, input) => {
              if (
                input.UserInputType !== Enum.UserInputType.MouseButton1 ||
                input.UserInputState !== Enum.UserInputState.Begin
              )
                return;

              appPlugin().unwrap().GetMouse().Icon =
                'rbxasset://SystemCursors/SplitEW';

              setMouseDiff(
                appWidget().unwrap().GetRelativeMousePosition().X -
                  rbx.AbsolutePosition.X
              );
              setIsDragging(true);
            },
            InputEnded: (_, input) => {
              if (
                input.UserInputType !== Enum.UserInputType.MouseButton1 ||
                input.UserInputState !== Enum.UserInputState.End
              )
                return;

              appPlugin().unwrap().GetMouse().Icon =
                'rbxasset://SystemCursors/Arrow';

              setIsDragging(false);
            },
          }}
        />
      </Pane>

      {/* Content */}
      <Pane
        key={'ResizablePanes'}
        padded={false}
        size={new UDim2(1, 0, 1, 0)}
        transparency={1}
      >
        <uilistlayout
          FillDirection={Enum.FillDirection.Horizontal}
          HorizontalAlignment={Enum.HorizontalAlignment.Left}
          VerticalAlignment={Enum.VerticalAlignment.Center}
          Padding={new UDim(0, 4)}
        />

        {/* Panes */}
        <Pane
          key={'LeftPane'}
          size={resizeHandleX.map((x) => new UDim2(x, 0, 1, 0))}
          padded={false}
        >
          {leftPane}
        </Pane>
        <Pane
          key={'RightPane'}
          size={resizeHandleX.map((x) => new UDim2(1 - x, -4, 1, 0))}
          padded={false}
        >
          {rightPane}
        </Pane>
      </Pane>
    </>
  );
}
