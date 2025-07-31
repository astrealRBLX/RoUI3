import React, { useCallback, useEffect, useMemo, useRef, useState } from '@rbxts/react';
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
  dispatchEditorStateUpdate,
  KeyframeData,
  pressedKeys,
  selectedKeyframes,
  settingMaxTimelineLength,
  settingScrubberPosition,
} from 'state/editor';
import { useAtom } from '@rbxts/react-charm';
import { instanceTreeSelection, previewData } from 'state/timeline';
import { peek, subscribe } from '@rbxts/charm';
import { getAnimatableProperties, SupportedClass } from 'utils/animatableProperties';
import { useUpdate } from '@rbxts/pretty-react-hooks';
import { useResetState } from 'utils/hooks/useResetState';
import { KeyboardListener } from 'components/ui/KeyboardListener';
import { HotkeyIDs, isHotkeyPressed, useHotkey } from 'utils/hotkeyUtils';

/*
  components/sections/Topbar

  A section used in the `EditorView` to provide
  functionality to the `Timeline`. Made up of various
  smaller control elements that are horizontally listed.
*/
export function Topbar() {
  const nextOrder = createNextOrder();

  const update = useUpdate();

  const instTreeSelection = useAtom(instanceTreeSelection);
  const scrubberPosition = useAtom(settingScrubberPosition);
  const maxTimelineLength = useAtom(settingMaxTimelineLength);
  const selectedKfs = useAtom(selectedKeyframes);

  const [easingDropdownResetKey] = useResetState([selectedKfs]);
  const [previewButtonResetKey, resetPreviewButton] = useResetState([]);

  const maxTimelineLengthRef = useRef(maxTimelineLength);
  const currentPropertyDropdownOption = useRef('');

  // Effect to reset preview button whenever preview data is no longer previewing
  useEffect(() => {
    const cleanup = subscribe(previewData, (data) => {
      if (!data.isPreviewing) {
        resetPreviewButton();
      }
    });

    return cleanup;
  }, []);

  // Hotkey to insert a keyframe
  useHotkey(
    HotkeyIDs.KeyframesInsert,
    [],
    () => {
      if (instTreeSelection.isNone() || currentPropertyDropdownOption.current === '') return;

      const currentPropOption = currentPropertyDropdownOption.current;

      dispatchEditorStateUpdate({
        type: 'AddInstanceProperty',
        instance: instTreeSelection.unwrap(),
        property: currentPropOption,
      });
      dispatchEditorStateUpdate({
        type: 'UpdateKeyframe',
        instance: instTreeSelection.unwrap(),
        property: currentPropOption,
      });
    },
    [instTreeSelection]
  );

  // Effect to keep currentPropertyDropdownOption updated
  useEffect(() => {
    if (instTreeSelection.isSome()) {
      currentPropertyDropdownOption.current = getAnimatableProperties(instTreeSelection.unwrap().ClassName as SupportedClass)[0];
    } else {
      currentPropertyDropdownOption.current = '';
    }
  }, [instTreeSelection]);

  // Effect to keep maxTimelineLengthRef updated
  useEffect(() => {
    maxTimelineLengthRef.current = maxTimelineLength;
  }, [maxTimelineLength]);

  const scrubberPositionValueClamper = useCallback((num: number) => math.clamp(num, 0, maxTimelineLengthRef.current), []);

  // Generate EasingStyle & EasingDirection dropdown options
  const generateEasingInfo: () => [boolean, string[], string[]] = () => {
    if (selectedKfs.size() === 0) return [false, [], []];

    const styleToMatch = selectedKfs[0].easingStyle;
    const directionToMatch = selectedKfs[0].easingDirection;
    const usesSameStyle = selectedKfs.every((kf) => kf.easingStyle === styleToMatch);
    const usesSameDirection = selectedKfs.every((kf) => kf.easingDirection === directionToMatch);
    const easingStyleList = Enum.EasingStyle.GetEnumItems().mapFiltered((style) =>
      usesSameStyle ? (style === styleToMatch ? undefined : style.Name) : style.Name
    );
    const easingDirectionList = Enum.EasingDirection.GetEnumItems().mapFiltered((dir) =>
      usesSameDirection ? (dir === directionToMatch ? undefined : dir.Name) : dir.Name
    );

    return [
      true,
      usesSameStyle ? [styleToMatch.Name, ...easingStyleList] : ['...', ...easingStyleList],
      usesSameDirection ? [directionToMatch.Name, ...easingDirectionList] : ['...', ...easingDirectionList],
    ];
  };

  const [easingDropdownsVisible, easingStyleOptions, easingDirectionOptions] = generateEasingInfo();

  return (
    <Pane key={'Topbar'} paddingAll={new UDim(0, 2)} size={new UDim2(1, 0, 0, 30)} color={Palette.Background3} rounded={true}>
      <uilistlayout
        FillDirection={Enum.FillDirection.Horizontal}
        HorizontalAlignment={Enum.HorizontalAlignment.Left}
        VerticalAlignment={Enum.VerticalAlignment.Center}
        Padding={new UDim(0, 4)}
        SortOrder={Enum.SortOrder.LayoutOrder}
      />

      <TopbarElement key={'RoUI3TopbarText'} layoutPosition={nextOrder()}>
        <TextElement text={'RoUI3 | v2.0.0'} textColor={Palette.PrimaryText} textSize={16} font={Fonts.JosefinSans.SemiBold}>
          <Tooltip text={'Thanks for using RoUI3! 😀'} />
        </TextElement>
      </TopbarElement>
      <TopbarElement key={'ExportAllButton'} layoutPosition={nextOrder()}>
        <ImageButtonElement image='http://www.roblox.com/asset/?id=11780633056'>
          <Tooltip text={'Exports the entire animation.'} />
        </ImageButtonElement>
      </TopbarElement>
      <TopbarElement key={'ExportCurrentButton'} layoutPosition={nextOrder()}>
        <ImageButtonElement image='http://www.roblox.com/asset/?id=11780632458'>
          <Tooltip text={'Exports the current selection.'} />
        </ImageButtonElement>
      </TopbarElement>
      <TopbarElement key={'PreviewButton'} layoutPosition={nextOrder()}>
        <ImageButtonElement
          key={`PreviewButtonElement-${previewButtonResetKey}`}
          image='http://www.roblox.com/asset/?id=11789170706'
          asToggle={true}
          onPressed={(startPreview) => {
            const previewInfo = peek(previewData);

            if (startPreview && !previewInfo.isPreviewing) {
              previewData({
                isPreviewing: true,
                previewTime: 0,
              });
            } else if (!startPreview && previewInfo.isPreviewing) {
              previewData({
                isPreviewing: false,
                previewTime: 0,
              });
            } else if (startPreview && previewInfo.isPreviewing) {
              return false; // If already previewing do not change the button's toggled state
            }
          }}
        >
          <Tooltip text={'Click to preview the animation.'} />
        </ImageButtonElement>
      </TopbarElement>
      <TopbarElement key={'ScrubberPositionTextbox'} layoutPosition={nextOrder()} visibleBackground={true}>
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
          <Tooltip text={'The position of the scrubber on the timeline in seconds.'} />
        </TextboxElement>
      </TopbarElement>
      <TopbarElement key={'MaxAnimationLengthTextbox'} layoutPosition={nextOrder()} visibleBackground={true}>
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
          <Tooltip text={'Adjusts how long the animation is by updating the maximum length of the timeline.'} />
        </TextboxElement>
      </TopbarElement>

      {/* Add Property Dropdown */}
      {instTreeSelection.isSome() ? (
        <TopbarElement key={'AddPropertyDropdown'} layoutPosition={nextOrder()} visibleBackground={true}>
          <DropdownOptionElement
            labelText={'Property'}
            buttonImage={'rbxassetid://3192519002'}
            onButtonClicked={(prop) => {
              dispatchEditorStateUpdate({
                type: 'AddInstanceProperty',
                instance: instTreeSelection.unwrap(),
                property: prop,
              });
              dispatchEditorStateUpdate({
                type: 'UpdateKeyframe',
                instance: instTreeSelection.unwrap(),
                property: prop,
              });
            }}
            options={getAnimatableProperties(instTreeSelection.unwrap().ClassName as SupportedClass)}
            onOptionChosen={(option) => {
              currentPropertyDropdownOption.current = option;
            }}
          >
            <Tooltip text={'Select a property to animate & add to the timeline.'} />
          </DropdownOptionElement>
        </TopbarElement>
      ) : undefined}

      {/* EasingStyle & EasingDirection Dropdowns */}
      {easingDropdownsVisible ? (
        <>
          <TopbarElement key={'EasingStyleDropdown'} layoutPosition={nextOrder()} visibleBackground={true}>
            <DropdownOptionElement
              key={`EasingStyleDropdown-${easingDropdownResetKey}`}
              labelText={'Easing Style'}
              usesConfirmButton={false}
              onOptionChosen={(newStyle) => {
                const newSelectedKfs: KeyframeData[] = [];

                selectedKfs.forEach((kf) => {
                  const newKf: KeyframeData = {
                    instance: kf.instance,
                    property: kf.property,
                    time: kf.time,
                    value: kf.value,
                    easingDirection: kf.easingDirection,
                    easingStyle: Enum.EasingStyle.FromName(newStyle)!,
                  };

                  dispatchEditorStateUpdate({
                    type: 'UpdateKeyframe',
                    ...newKf,
                  });

                  newSelectedKfs.push(newKf);
                });

                selectedKeyframes(newSelectedKfs);
                update();
              }}
              options={easingStyleOptions}
            >
              <Tooltip text={'Select the EasingStyle of the selected keyframe(s).'} />
            </DropdownOptionElement>
          </TopbarElement>
          <TopbarElement key={'EasingDirectionDropdown'} layoutPosition={nextOrder()} visibleBackground={true}>
            <DropdownOptionElement
              key={`EasingDirectionDropdown-${easingDropdownResetKey}`}
              labelText={'Easing Direction'}
              usesConfirmButton={false}
              onOptionChosen={(newDirection) => {
                const newSelectedKfs: KeyframeData[] = [];

                selectedKfs.forEach((kf) => {
                  const newKf: KeyframeData = {
                    instance: kf.instance,
                    property: kf.property,
                    time: kf.time,
                    value: kf.value,
                    easingDirection: Enum.EasingDirection.FromName(newDirection)!,
                    easingStyle: kf.easingStyle,
                  };

                  dispatchEditorStateUpdate({
                    type: 'UpdateKeyframe',
                    ...newKf,
                  });

                  newSelectedKfs.push(newKf);
                });

                selectedKeyframes(newSelectedKfs);
                update();
              }}
              options={easingDirectionOptions}
            >
              <Tooltip text={'Select the EasingDirection of the selected keyframe(s).'} />
            </DropdownOptionElement>
          </TopbarElement>
        </>
      ) : undefined}
    </Pane>
  );
}
