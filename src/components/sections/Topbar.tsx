import React from '@rbxts/react';
import { Pane } from 'components/ui/Pane';
import { Palette } from 'utils/styling';

export function Topbar() {
  return (
    <Pane
      key={'Topbar'}
      paddingAll={new UDim(0, 2)}
      size={new UDim2(1, 0, 0.2, 0)}
      color={Palette.Background2}
      rounded={true}
    >
      <uilistlayout
        FillDirection={Enum.FillDirection.Horizontal}
        HorizontalAlignment={Enum.HorizontalAlignment.Left}
        VerticalAlignment={Enum.VerticalAlignment.Center}
        Padding={new UDim(0, 4)}
      />
    </Pane>
  );
}
