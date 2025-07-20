import React from '@rbxts/react';
import { useAtom } from '@rbxts/react-charm';
import { Workspace } from '@rbxts/services';
import { InstanceTree } from 'components/sections/InstanceTree';
import { Topbar } from 'components/sections/Topbar';
import { Pane } from 'components/ui/Pane';
import { ResizablePanes } from 'components/ui/ResizablePanes';
import { screenGuiSelection } from 'state/timeline';
import { Palette } from 'utils/styling';

/*
  components/view/EditorView

  The view seen whenever editing a `ScreenGui`. This view
  is made up of the `Topbar` and `Timeline` sections.
*/
export function EditorView() {
  const animatingScreenGui = useAtom(screenGuiSelection);

  return (
    <Pane key={'EditorView'} paddingAll={new UDim(0, 8)}>
      <uilistlayout
        FillDirection={Enum.FillDirection.Vertical}
        HorizontalAlignment={Enum.HorizontalAlignment.Center}
        VerticalAlignment={Enum.VerticalAlignment.Top}
        Padding={new UDim(0, 4)}
        SortOrder={Enum.SortOrder.LayoutOrder}
      />

      <Topbar />
      <Pane
        key={'Timeline'}
        padded={false}
        size={new UDim2(1, 0, 1, -34)}
        transparency={1}
        layoutOrder={1}
      >
        <ResizablePanes
          leftPane={
            <Pane
              key={'InstanceTreePane'}
              color={Palette.Background3}
              rounded={true}
            >
              <InstanceTree
                root={animatingScreenGui.unwrap()}
                baseClassFilter={'GuiObject'}
                selectFilter={(instance) => !instance.IsA('ScreenGui')}
              />
            </Pane>
          }
          rightPane={
            <Pane
              key={'TimelinePane'}
              color={Palette.Background4}
              rounded={true}
            />
          }
        />
      </Pane>
    </Pane>
  );
}
