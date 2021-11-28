import Roact from '@rbxts/roact';
import RoactHooks from '@rbxts/roact-hooks';
import { getPlugin } from 'utils/plugin';
import { getWidgetManager } from 'utils/widgets';

interface IProps {
  ScrubberPos: number;
  OnDrag: (mouseOffset: number) => void;
  OnDragEnd: () => void;
}

const rgb = [
  Color3.fromRGB(252, 117, 117),
  Color3.fromRGB(69, 252, 161),
  Color3.fromRGB(69, 173, 245),
  Color3.fromRGB(252, 122, 209),
  Color3.fromRGB(54, 99, 255),
  Color3.fromRGB(255, 207, 43),
  Color3.fromRGB(255, 56, 56),
  Color3.fromRGB(181, 117, 252),
  Color3.fromRGB(122, 255, 117),
  Color3.fromRGB(250, 133, 36),
];

const plugin = getPlugin();
const widgetManager = getWidgetManager();

// Scrubber component that is used to move along the timeline
const ScrubberComponent: RoactHooks.FC<IProps> = (
  { OnDrag, ScrubberPos, OnDragEnd },
  { useState, useEffect }
) => {
  const [scrubberColor, setScrubberColor] = useState(new Color3(1, 1, 1));

  // Random scrubber color
  useEffect(() => {
    const RNG = new Random();
    setScrubberColor(rgb[RNG.NextInteger(0, rgb.size() - 1)]);
  }, []);

  return (
    <frame
      Position={new UDim2(ScrubberPos, 0, 0, 0)}
      Size={new UDim2(0, 14, 1, 0)}
      BackgroundTransparency={1}
      ZIndex={100}
      AnchorPoint={new Vector2(0.5, 0)}
    >
      <uilistlayout
        FillDirection={Enum.FillDirection.Vertical}
        HorizontalAlignment={Enum.HorizontalAlignment.Center}
        VerticalAlignment={Enum.VerticalAlignment.Top}
        SortOrder={Enum.SortOrder.LayoutOrder}
      />
      {/* Scrubber Head */}
      <frame
        Size={new UDim2(1, 0, 0, 14)}
        BackgroundTransparency={1}
        LayoutOrder={1}
        ZIndex={101}
      >
        <imagebutton
          ZIndex={1002}
          Size={new UDim2(1, 0, 1, 0)}
          Image={'rbxassetid://788089696'}
          Rotation={180}
          BackgroundTransparency={1}
          ImageColor3={scrubberColor}
          Event={{
            MouseEnter: () => {
              plugin.GetMouse().Icon = 'rbxasset://SystemCursors/OpenHand';
            },
            MouseLeave: () => {
              plugin.GetMouse().Icon = 'rbxasset://SystemCursors/Arrow';
            },
            InputBegan: (rbx, input) => {
              if (input.UserInputType === Enum.UserInputType.MouseButton1) {
                OnDrag(
                  widgetManager.widgets.timeline.GetRelativeMousePosition().X -
                    rbx.AbsolutePosition.X
                );

                plugin.GetMouse().Icon = 'rbxasset://SystemCursors/ClosedHand';
              }
            },
            InputEnded: (_, input) => {
              if (input.UserInputType === Enum.UserInputType.MouseButton1) {
                plugin.GetMouse().Icon = 'rbxasset://SystemCursors/Arrow';
                OnDragEnd();
              }
            },
          }}
        />
      </frame>

      {/* Scrubber Tail */}
      <frame
        LayoutOrder={2}
        Size={new UDim2(0, 1, 1, -14)}
        BackgroundColor3={scrubberColor}
        BorderSizePixel={0}
        ZIndex={101}
      ></frame>
    </frame>
  );
};
export const Scrubber = new RoactHooks(Roact)(ScrubberComponent);
