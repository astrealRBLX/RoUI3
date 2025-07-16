import React from '@rbxts/react';
import { Topbar } from 'components/sections/Topbar';
import { Pane } from 'components/ui/Pane';
import { ResizablePanes } from 'components/ui/ResizablePanes';
import { Palette } from 'utils/styling';

export function EditorView() {
  return (
    <Pane key={'EditorView'} paddingAll={new UDim(0, 8)}>
      <uilistlayout
        FillDirection={Enum.FillDirection.Vertical}
        HorizontalAlignment={Enum.HorizontalAlignment.Center}
        VerticalAlignment={Enum.VerticalAlignment.Top}
        Padding={new UDim(0, 4)}
      />

      <Topbar />
      <Pane
        key={'Timeline'}
        padded={false}
        size={new UDim2(1, 0, 0.8, -4)}
        transparency={1}
      >
        <ResizablePanes
          leftPane={<Pane color={Palette.Background2} rounded={true} />}
          rightPane={<Pane color={Palette.Background3} rounded={true} />}
        />
      </Pane>
    </Pane>
  );
}
