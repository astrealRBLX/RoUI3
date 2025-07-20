import React from '@rbxts/react';
import { ImageButtonElement } from './ImageButtonElement';
import { Pane } from 'components/ui/Pane';
import { TextElement } from './TextElement';
import { Tooltip } from 'components/ui/Tooltip';
import { TopbarElement } from './TopbarElement';
import { Fonts, Palette } from 'utils/styling';
import { TextboxElement } from './TextboxElement';
import { createNextOrder } from 'utils/createNextOrder';
import { DropdownOptionElement } from './DropdownOptionElement';

/*
  components/sections/Topbar

  A section used in the `EditorView` to provide
  functionality to the `Timeline`. Made up of various
  smaller control elements that are horizontally listed.
*/
export function Topbar() {
  const nextOrder = createNextOrder();

  return (
    <Pane
      key={'Topbar'}
      paddingAll={new UDim(0, 2)}
      size={new UDim2(1, 0, 0, 30)}
      color={Palette.Background2}
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
          initialText={'1.00'}
          placeholderText={'0.00 s'}
          suffix={'s'}
          asNumberInput={true}
          decimalPlaces={2}
          onTextChanged={(txt) => {
            print(`Updated scrubber text to: ${txt}`);
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
          initialText={'5.00'}
          placeholderText={'0.00 s'}
          suffix={'s'}
          asNumberInput={true}
          decimalPlaces={2}
          onTextChanged={(txt) => {
            print(`Updated max timeline text to: ${txt}`);
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
