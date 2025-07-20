import React from '@rbxts/react';
import { Palette } from 'utils/styling';

interface TopbarElementProps {
  children?: React.ReactNode;
  visibleBackground?: boolean;
  layoutPosition?: number;
}

/*
  components/sections/Topbar/TopbarElement

  This component is wrapped around an element that
  should be added to the topbar.
*/
export function TopbarElement({
  children,
  visibleBackground = false,
  layoutPosition = 0,
}: TopbarElementProps) {
  return (
    <frame
      key={'TopbarElement'}
      Size={new UDim2(0, 0, 1, 0)}
      AutomaticSize={Enum.AutomaticSize.X}
      BackgroundTransparency={visibleBackground ? 0 : 1}
      BackgroundColor3={Palette.Background4}
      LayoutOrder={layoutPosition}
    >
      <uicorner CornerRadius={new UDim(0, 2)} />
      <uipadding PaddingLeft={new UDim(0, 2)} PaddingRight={new UDim(0, 2)} />

      {children}
    </frame>
  );
}
