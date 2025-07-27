import React, { useCallback, useEffect, useRef } from '@rbxts/react';
import { ImageButtonElement } from './ImageButtonElement';
import { Pane } from 'components/ui/Pane';
import { TextElement } from './TextElement';
import { Tooltip } from 'components/ui/Tooltip';
import { TopbarElement } from './TopbarElement';
import { Fonts, Palette } from 'utils/styling';
import { TextboxElement } from './TextboxElement';
import { createNextOrder } from 'utils/createNextOrder';
import { DropdownOptionElement } from './DropdownOptionElement';
import {
  settingMaxTimelineLength,
  settingScrubberPosition,
} from 'state/editor';
import { useAtom } from '@rbxts/react-charm';

/*
  components/sections/Topbar

  A section used in the `EditorView` to provide
  functionality to the `Timeline`. Made up of various
  smaller control elements that are horizontally listed.
*/
export function Topbar() {
  const nextOrder = createNextOrder();

  const scrubberPosition = useAtom(settingScrubberPosition);
  const maxTimelineLength = useAtom(settingMaxTimelineLength);
  const maxTimelineLengthRef = useRef(maxTimelineLength);

  // Effect to keep maxTimelineLengthRef updated
  useEffect(() => {
    maxTimelineLengthRef.current = maxTimelineLength;
  }, [maxTimelineLength]);

  const scrubberPositionValueClamper = useCallback(
    (num: number) => math.clamp(num, 0, maxTimelineLengthRef.current),
    []
  );

  return (
    <Pane
      key={'Topbar'}
      paddingAll={new UDim(0, 2)}
      size={new UDim2(1, 0, 0, 30)}
      color={Palette.Background3}
      rounded={true}
    >
      <uilistlayout
        FillDirection={Enum.FillDirection.Horizontal}
        HorizontalAlignment={Enum.HorizontalAlignment.Left}
        VerticalAlignment={Enum.VerticalAlignment.Center}
        Padding={new UDim(0, 4)}
        SortOrder={Enum.SortOrder.LayoutOrder}
      />

      <TopbarElement layoutPosition={nextOrder()}>
        <TextElement
          text={'RoUI3 | v2.0.0'}
          textColor={Palette.PrimaryText}
          textSize={16}
          font={Fonts.JosefinSans.SemiBold}
        >
          <Tooltip text={'Thanks for using RoUI3! 😀'} />
        </TextElement>
      </TopbarElement>
      <TopbarElement layoutPosition={nextOrder()}>
        <ImageButtonElement
          image='http://www.roblox.com/asset/?id=11780633056'
          asToggle={true}
        >
          <Tooltip text={'Exports the entire animation.'} />
        </ImageButtonElement>
      </TopbarElement>
      <TopbarElement layoutPosition={nextOrder()}>
        <ImageButtonElement image='http://www.roblox.com/asset/?id=11780632458'>
          <Tooltip text={'Exports the current selection.'} />
        </ImageButtonElement>
      </TopbarElement>
      <TopbarElement layoutPosition={nextOrder()}>
        <ImageButtonElement image='http://www.roblox.com/asset/?id=11789170706'>
          <Tooltip text={'Click to preview the animation.'} />
        </ImageButtonElement>
      </TopbarElement>
      <TopbarElement layoutPosition={nextOrder()} visibleBackground={true}>
        <TextboxElement
          labelText={'Scrubber'}
          initialText={string.format('%.2f', scrubberPosition)}
          placeholderText={'0.00 s'}
          suffix={'s'}
          asNumberInput={true}
          decimalPlaces={2}
          valueClamper={scrubberPositionValueClamper}
          onTextChanged={(num, finishedEditing) => {
            if (finishedEditing) settingScrubberPosition(tonumber(num)!);
          }}
        >
          <Tooltip
            text={'The position of the scrubber on the timeline in seconds.'}
          />
        </TextboxElement>
      </TopbarElement>
      <TopbarElement layoutPosition={nextOrder()} visibleBackground={true}>
        <TextboxElement
          labelText={'Animation Length'}
          initialText={string.format('%.2f', maxTimelineLength)}
          placeholderText={'0.00 s'}
          suffix={'s'}
          asNumberInput={true}
          decimalPlaces={2}
          valueClamper={(num) => math.clamp(num, 1, math.huge)}
          onTextChanged={(num, finishedEditing) => {
            if (finishedEditing) settingMaxTimelineLength(tonumber(num)!);
          }}
        >
          <Tooltip
            text={
              'Adjusts how long the animation is by updating the maximum length of the timeline.'
            }
          />
        </TextboxElement>
      </TopbarElement>
      <TopbarElement layoutPosition={nextOrder()} visibleBackground={true}>
        <DropdownOptionElement
          labelText={'Property'}
          buttonImage={'rbxassetid://3192519002'}
          onButtonClicked={(prop) => {
            print(`Prop:${prop}`);
          }}
          options={[
            'BackgroundTransparency',
            'BackgroundColor3',
            'Size',
            'Position',
            'Text',
          ]}
        >
          <Tooltip
            text={'Select a property to animate & add to the timeline.'}
          />
        </DropdownOptionElement>
      </TopbarElement>
    </Pane>
  );
}
