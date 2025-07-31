import React, { useEffect, useState } from '@rbxts/react';
import { Pane } from 'components/ui/Pane';
import { TimelineTopbar } from './TimelineTopbar';
import { Fonts, Palette } from 'utils/styling';
import { Scrubber } from './Scrubber';
import { createPortal } from '@rbxts/react-roblox';
import { KeyboardListener } from 'components/ui/KeyboardListener';
import { pressedKeys, selectedKeyframes } from 'state/editor';
import { TimelineContent } from './TimelineContent';
import { useAtom } from '@rbxts/react-charm';
import { instanceTreeSelection } from 'state/timeline';

interface TimelineProps {
  timelinePaneRef: React.RefObject<Frame>;
}

export function Timeline({ timelinePaneRef }: TimelineProps) {
  const instTreeSelection = useAtom(instanceTreeSelection);

  const [timelinePaneRefReady, setTimelinePaneRefReady] = useState(false);

  useEffect(() => {
    if (timelinePaneRef.current) setTimelinePaneRefReady(true);
  }, [timelinePaneRef.current]);

  // Effect to clear selected keyframes when the instance tree selection changes
  useEffect(() => {
    selectedKeyframes([]);
  }, [instTreeSelection]);

  return (
    <Pane key={'Timeline'} padded={false} color={Palette.Background0}>
      <KeyboardListener activeKeysAtom={pressedKeys} />

      <uilistlayout
        FillDirection={Enum.FillDirection.Vertical}
        HorizontalAlignment={Enum.HorizontalAlignment.Center}
        VerticalAlignment={Enum.VerticalAlignment.Top}
        SortOrder={Enum.SortOrder.LayoutOrder}
      />

      {instTreeSelection.isSome() ? (
        <>
          <TimelineTopbar key={'TimelineTopbar'} timelinePaneRef={timelinePaneRef} />

          <TimelineContent />

          {timelinePaneRefReady ? createPortal(<Scrubber />, timelinePaneRef.current!) : undefined}
        </>
      ) : (
        <textlabel
          Size={new UDim2(1, 0, 1, 0)}
          BorderSizePixel={0}
          BackgroundColor3={Palette.Background0}
          RichText={true}
          Text={
            '<u>No Instance Selected</u>\n\n<font weight="regular" size="14" color="rgb(121,121,121)">Please select an Instance from the instance tree to start animating it.</font>'
          }
          TextColor3={Palette.PrimaryText}
          FontFace={Fonts.JosefinSans.SemiBold}
          TextSize={18}
          TextWrapped={true}
        />
      )}
    </Pane>
  );
}
