import { peek } from '@rbxts/charm';
import React, { useEffect, useRef } from '@rbxts/react';
import { useAtom } from '@rbxts/react-charm';
import { Option } from '@rbxts/rust-classes';
import { Selection, Workspace } from '@rbxts/services';
import { InstanceTree } from 'components/sections/InstanceTree';
import { Timeline } from 'components/sections/Timeline';
import { Topbar } from 'components/sections/Topbar';
import { Pane } from 'components/ui/Pane';
import { ResizablePanes } from 'components/ui/ResizablePanes';
import { settingSyncSelections } from 'state/editor';
import { instanceTreeSelection, screenGuiSelection } from 'state/timeline';
import { isValidAnimatableSelection } from 'utils/selectionUtils';
import { Palette } from 'utils/styling';

/*
  components/view/EditorView

  The view seen whenever editing a `ScreenGui`. This view
  is made up of the `Topbar` and `Timeline` sections.
*/
export function EditorView() {
  const animatingScreenGui = useAtom(screenGuiSelection);

  const timelinePaneRef = useRef<Frame>();

  // Sync selections from Roblox Explorer -> RoUI3
  useEffect(() => {
    const conn = (Selection['SelectionChanged' as never] as RBXScriptSignal).Connect(() => {
      const syncSelections = peek(settingSyncSelections);
      const selections = Selection.Get();

      if (syncSelections && selections.size() === 1 && animatingScreenGui.isSome()) {
        if (isValidAnimatableSelection(selections[0])) instanceTreeSelection(Option.some(selections[0]));
      }
    });

    return () => conn.Disconnect();
  }, []);

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
      <Pane key={'Editor'} padded={false} size={new UDim2(1, 0, 1, -34)} transparency={1} layoutOrder={1}>
        <ResizablePanes
          leftPane={
            <Pane key={'InstanceTreePane'} color={Palette.Background3} rounded={true}>
              <InstanceTree
                root={animatingScreenGui.unwrap()}
                classFilter={['GuiObject', 'Folder']}
                selectFilter={(instance) => !instance.IsA('ScreenGui') && !instance.IsA('Folder')}
              />
            </Pane>
          }
          rightPane={
            <Pane key={'TimelinePane'} color={Palette.Background4} rounded={true} reference={timelinePaneRef}>
              <Timeline timelinePaneRef={timelinePaneRef} />
            </Pane>
          }
        />
      </Pane>
    </Pane>
  );
}
