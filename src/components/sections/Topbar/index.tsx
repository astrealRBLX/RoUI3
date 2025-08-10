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
  animationRegistry,
  KeyframeData,
  selectedKeyframes,
  settingAutoKeyframe,
  settingMaxTimelineLength,
  settingScrubberPosition,
  settingSyncSelections,
} from 'state/editor';
import { useAtom } from '@rbxts/react-charm';
import { EditorWarnings, editorWarnings, editorWarningsInfo, forceUpdatePreview, instanceTreeSelection, previewData } from 'state/timeline';
import { peek, subscribe } from '@rbxts/charm';
import { getAnimatableProperties, SupportedClass } from 'utils/animatableProperties';
import { useUpdate } from '@rbxts/pretty-react-hooks';
import { useResetState } from 'utils/hooks/useResetState';
import { HotkeyIDs, useHotkey } from 'utils/hotkeyUtils';
import { ActionBatch, ActionKeyframeMove, ActionManager, CreateKeyframeAction, DeleteKeyframeAction, makeUpdateKeyframeAction } from 'state/history';
import { ToastManager, ToastType } from 'state/toasts';
import { matchKeyframes } from 'utils/keyframeUtils';

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
  const warnings = useAtom(editorWarnings);

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

      const action = makeUpdateKeyframeAction({
        instance: instTreeSelection.unwrap(),
        property: currentPropOption,
      });

      ActionManager.execute(action);
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

  useEffect(() => {
    return subscribe(settingAutoKeyframe, (autoKeyframe) => {
      if (!autoKeyframe) {
        const newWarnings = new Set([...peek(editorWarnings)]);

        newWarnings.add(EditorWarnings.AutoKeyframeOff);

        editorWarnings(newWarnings);

        ToastManager.addToast({
          type: ToastType.Error,
          message: 'Auto-keyframe was turned off. Property changes are not being recorded!',
          duration: 5,
        });
      } else {
        const newWarnings = new Set([...peek(editorWarnings)]);

        newWarnings.delete(EditorWarnings.AutoKeyframeOff);

        editorWarnings(newWarnings);
      }
    });
  }, []);

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

  // Generate the tooltip text for warninsg
  const generateWarningsText: () => string = () => {
    let finalString = '';

    warnings.forEach((warning, idx) => {
      const warningInfo = editorWarningsInfo.get(warning)!;

      finalString += `<font weight="SemiBold" color="${Palette.ErrorHex}">${idx + 1}. ${warningInfo.name}</font><br />${warningInfo.description}${
        idx + 1 < warnings.size() ? '<br />' : ''
      }`;
    });

    return finalString;
  };

  const [easingDropdownsVisible, easingStyleOptions, easingDirectionOptions] = generateEasingInfo();
  const warningsText = generateWarningsText();

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
          <Tooltip title={'Export All'} text={'Exports the entire animation.'} />
        </ImageButtonElement>
      </TopbarElement>
      <TopbarElement key={'ExportCurrentButton'} layoutPosition={nextOrder()}>
        <ImageButtonElement image='http://www.roblox.com/asset/?id=11780632458'>
          <Tooltip title={'Export Selection'} text={'Exports the current selection.'} />
        </ImageButtonElement>
      </TopbarElement>
      <TopbarElement key={'AutoKeyframeButton'} layoutPosition={nextOrder()}>
        <ImageButtonElement
          image='rbxassetid://140257108862380'
          initialValue={true}
          asToggle={true}
          onPressed={(newState) => {
            if (newState !== undefined) {
              settingAutoKeyframe(newState);
            }
          }}
        >
          <Tooltip
            title={'Auto Keyframe'}
            text={`Keyframes are automatically added as properties change.<br /><br /><font color="${Palette.ErrorHex}" weight="Medium">It is recommended to always leave this enabled.</font>`}
          />
        </ImageButtonElement>
      </TopbarElement>
      <TopbarElement key={'SyncSelectionsButton'} layoutPosition={nextOrder()}>
        <ImageButtonElement
          image='rbxassetid://84948256301138'
          initialValue={true}
          asToggle={true}
          onPressed={(newState) => {
            if (newState !== undefined) settingSyncSelections(newState);
          }}
        >
          <Tooltip title={'Selection Syncing'} text={'Selections are synced between RoUI3&apos;s instance tree and Roblox&apos;s explorer.'} />
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
          <Tooltip title={'Preview'} text={'Click to preview the animation.'} />
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
              const action = makeUpdateKeyframeAction({
                instance: instTreeSelection.unwrap(),
                property: prop,
              });
              forceUpdatePreview();
              ActionManager.execute(action);
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

      {/* Keyframe Time Input */}
      {selectedKfs.size() === 1 ? (
        <TopbarElement key={'KeyframeTimeTextbox'} layoutPosition={nextOrder()} visibleBackground={true}>
          <TextboxElement
            labelText={'Keyframe Time'}
            initialText={string.format('%.2f', selectedKfs[0].time)}
            placeholderText={'0.00 s'}
            suffix={'s'}
            asNumberInput={true}
            decimalPlaces={2}
            valueClamper={scrubberPositionValueClamper}
            onTextChanged={(num, finishedEditing) => {
              const kf = selectedKfs[0];
              const newKf = { ...kf, time: tonumber(string.format('%.2f', num))! };

              if (finishedEditing) {
                const action = new ActionKeyframeMove();

                action.addMove(kf, newKf.time);

                ActionManager.execute(action);
                forceUpdatePreview();

                selectedKeyframes([
                  peek(animationRegistry)
                    .get(kf.instance)!
                    .keyframes.filter((k) => matchKeyframes(k, newKf))[0],
                ]);
              }
            }}
          >
            <Tooltip text={'The position of the selected keyframe in seconds.'} />
          </TextboxElement>
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
                const actionBatch = new ActionBatch();

                selectedKfs.forEach((kf) => {
                  const newKf: KeyframeData = {
                    instance: kf.instance,
                    property: kf.property,
                    time: kf.time,
                    value: kf.value,
                    easingDirection: kf.easingDirection,
                    easingStyle: Enum.EasingStyle.FromName(newStyle)!,
                  };

                  actionBatch.addAction(makeUpdateKeyframeAction({ ...newKf }));

                  newSelectedKfs.push(newKf);
                });

                ActionManager.execute(actionBatch);
                actionBatch.setActionToast(`EasingStyle changed for ${actionBatch.getActions().size()} keyframe(s)`);
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
                const actionBatch = new ActionBatch();

                selectedKfs.forEach((kf) => {
                  const newKf: KeyframeData = {
                    instance: kf.instance,
                    property: kf.property,
                    time: kf.time,
                    value: kf.value,
                    easingDirection: Enum.EasingDirection.FromName(newDirection)!,
                    easingStyle: kf.easingStyle,
                  };

                  actionBatch.addAction(makeUpdateKeyframeAction({ ...newKf }));

                  newSelectedKfs.push(newKf);
                });

                ActionManager.execute(actionBatch);
                actionBatch.setActionToast(`EasingDirection changed for ${actionBatch.getActions().size()} keyframe(s)`);
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

      {/* Warnings Label */}
      {warnings.size() > 0 ? (
        <TopbarElement key={'AutoKeyframeWarning'} layoutPosition={nextOrder()}>
          <uiflexitem FlexMode={Enum.UIFlexMode.Fill} />
          <TextElement
            anchorPoint={new Vector2(1, 0)}
            position={new UDim2(1, 0, 0, 0)}
            text={`Warnings (${warnings.size()})`}
            textColor={Palette.Error}
            textSize={12}
            font={Fonts.JosefinSans.Medium}
          >
            <Tooltip text={warningsText} />
          </TextElement>
        </TopbarElement>
      ) : undefined}
    </Pane>
  );
}
