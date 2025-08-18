import { Atom } from '@rbxts/charm';
import React, { useMemo } from '@rbxts/react';
import { useAtom } from '@rbxts/react-charm';
import { createPortal } from '@rbxts/react-roblox';
import { getRelativeMouse } from 'utils/getRelativeMouse';
import { Fonts, Palette } from 'utils/styling';
import { Tooltip } from './Tooltip';
import { appWidget } from 'state/globals';

interface ContextMenuOption {
  label: string;
  clicked: (rbx: TextButton, input: InputObject) => boolean;
  tooltip?: string;
}

interface ContextMenuProps {
  id: string;
  activeContextMenuAtom: Atom<string>;
  options: Array<ContextMenuOption>;
}

export function ContextMenu({ id, activeContextMenuAtom, options }: ContextMenuProps) {
  const activeContextMenu = useAtom(activeContextMenuAtom);

  const mousePos = getRelativeMouse();
  const contextMenuButtons: React.ReactChild[] = [];

  options.forEach((option, idx) => {
    contextMenuButtons.push(
      <textbutton
        Active={true}
        ZIndex={50}
        Size={new UDim2(0, 0, 0, 15)}
        AutomaticSize={Enum.AutomaticSize.X}
        BackgroundColor3={Palette.Background2}
        Text={`${idx + 1} | ${option.label}`}
        TextColor3={Palette.DefaultText}
        FontFace={Fonts.JosefinSans.Regular}
        TextSize={10}
        TextXAlignment={Enum.TextXAlignment.Left}
        Event={{
          InputBegan: (rbx, input) => {
            if (input.UserInputType !== Enum.UserInputType.MouseButton1 || input.UserInputState !== Enum.UserInputState.Begin) return;

            const closeMenu = option.clicked(rbx, input);

            if (closeMenu) activeContextMenuAtom('');
          },
        }}
      >
        <uicorner CornerRadius={new UDim(0, 2)} />
        <uistroke Thickness={1} Color={Palette.Outline} ApplyStrokeMode={Enum.ApplyStrokeMode.Border} />
        <uipadding PaddingBottom={new UDim(0, 2)} PaddingTop={new UDim(0, 2)} PaddingRight={new UDim(0, 4)} PaddingLeft={new UDim(0, 4)} />
        {option.tooltip ? <Tooltip text={option.tooltip} tooltipTextSize={10} /> : undefined}
      </textbutton>
    );
  });

  const widgetSizeY = appWidget().unwrap().AbsoluteSize.Y;
  let targetPos = mousePos;
  if (mousePos.Y + contextMenuButtons.size() * 19 >= widgetSizeY) {
    targetPos = new Vector2(mousePos.X, widgetSizeY - contextMenuButtons.size() * 19 - 10);
  }

  return (
    <>
      <frame
        Size={new UDim2(1, 0, 1, 0)}
        BackgroundTransparency={1}
        Event={{
          InputBegan: (_, input) => {
            if (input.UserInputState !== Enum.UserInputState.Begin || input.UserInputType !== Enum.UserInputType.MouseButton2) return;

            activeContextMenuAtom(id);
          },
        }}
      />
      {activeContextMenu === id
        ? createPortal(
            <frame
              Size={new UDim2(1, 0, 1, 0)}
              BackgroundTransparency={1}
              Event={{
                InputBegan: (_, input) => {
                  if (input.UserInputType !== Enum.UserInputType.MouseButton1) return;

                  activeContextMenuAtom('');
                },
              }}
            >
              <frame
                Active={true}
                Size={new UDim2(0, 0, 0, 0)}
                AutomaticSize={Enum.AutomaticSize.XY}
                Position={new UDim2(0, targetPos.X + 5, 0, targetPos.Y + 5)}
                ZIndex={49}
                BackgroundColor3={Palette.Background1}
                BackgroundTransparency={1}
              >
                <uipadding PaddingLeft={new UDim(0, 2)} PaddingBottom={new UDim(0, 2)} PaddingRight={new UDim(0, 2)} PaddingTop={new UDim(0, 2)} />
                <uicorner CornerRadius={new UDim(0, 2)} />
                <uilistlayout
                  FillDirection={Enum.FillDirection.Vertical}
                  HorizontalAlignment={Enum.HorizontalAlignment.Left}
                  VerticalAlignment={Enum.VerticalAlignment.Top}
                  Padding={new UDim(0, 4)}
                />
                {...contextMenuButtons}
              </frame>
            </frame>,
            appWidget().unwrap()
          )
        : undefined}
    </>
  );
}
