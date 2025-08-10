import Log from '@rbxts/log';
import { useMotion } from '@rbxts/pretty-react-hooks';
import React, { Fragment, useCallback, useEffect, useMemo, useState } from '@rbxts/react';
import { createPortal, createRoot } from '@rbxts/react-roblox';
import { Option } from '@rbxts/rust-classes';
import { CoreGui, Selection, StarterGui } from '@rbxts/services';
import { Pane } from 'components/ui/Pane';
import { animatingFolder, appPlugin, hotkeysTreeAtom, hotkeysWidget } from 'state/globals';
import { cacheInstanceProperties } from 'state/properties';
import { currentRoute, Route } from 'state/routes';
import { originalScreenGuiSelection, screenGuiSelection } from 'state/timeline';
import { springs } from 'utils/springs';
import { Fonts, Palette } from 'utils/styling';
import { HotkeyView } from './HotkeyView';

const SelectionService = game.GetService('Selection');

enum SelectionStatus {
  Pending,
  Valid,
  InvalidTooMany,
  InvalidNotScreenGui,
}

function resolveSelectionMessage(status: SelectionStatus, selection: Instance[]) {
  switch (status) {
    case SelectionStatus.Valid:
      return `Ready to start animating "${selection[0].Name}!"`;
    case SelectionStatus.Pending:
      return `Please select a ScreenGui to begin animating.`;
    case SelectionStatus.InvalidTooMany:
      return `Please only select a single ScreenGui.`;
    case SelectionStatus.InvalidNotScreenGui:
      return `Please select a valid ScreenGui.`;
  }
}

/*
  components/view/StartView

  The initial view seen whenever the plugin is used. This
  view is used to select a `ScreenGui` to begin animating.
*/
export function StartView() {
  const [buttonSize, buttonSizeMotion] = useMotion(0);
  const [buttonSizeHotkeys, buttonSizeMotionHotkeys] = useMotion(0);
  const [buttonSizeDownload, buttonSizeMotionDownload] = useMotion(0);

  const [selection, setSelection] = useState(SelectionService.Get());

  // Updates selection as it changes
  useEffect(() => {
    const conn = (SelectionService['SelectionChanged' as never] as RBXScriptSignal).Connect(() => {
      setSelection(SelectionService.Get());
    });

    return () => conn.Disconnect();
  }, []);

  // Resolves selection status
  const resolveSelectionStatus = useCallback(() => {
    let [successSelectionSize, resultSelectionSize] = pcall(() => {
      return selection.size() === 1;
    });

    // Selection size is not equal to 1
    if (successSelectionSize && !resultSelectionSize) {
      return SelectionStatus.InvalidTooMany;
    } else if (!successSelectionSize) {
      return SelectionStatus.Pending;
    }

    let [successScreenGui, resultScreenGui] = pcall(() => {
      return selection[0].IsA('ScreenGui');
    });

    // Selection is not a ScreenGui
    if (successScreenGui && !resultScreenGui) {
      return SelectionStatus.InvalidNotScreenGui;
    } else if (!successScreenGui) {
      return SelectionStatus.Pending;
    }

    return SelectionStatus.Valid;
  }, [selection]);

  const selectionStatus = resolveSelectionStatus();

  return (
    <Pane paddingHorizontal={new UDim(0, 4)} paddingVertical={new UDim(0, 16)}>
      <uilistlayout
        FillDirection={Enum.FillDirection.Vertical}
        HorizontalAlignment={Enum.HorizontalAlignment.Center}
        VerticalAlignment={Enum.VerticalAlignment.Top}
        Padding={new UDim(0, 16)}
      />

      {/* StartView Title */}
      <textlabel
        Size={new UDim2(1, 0, 0.2, 0)}
        BackgroundTransparency={1}
        TextColor3={Palette.PrimaryText}
        Text={'RoUI3 v2.0.0'}
        FontFace={Fonts.JosefinSans.Bold}
        TextSize={24}
      />

      <Pane size={new UDim2(1, 0, 0.7, 0)} transparency={1} paddingHorizontal={new UDim(0, 16)}>
        <uilistlayout
          FillDirection={Enum.FillDirection.Horizontal}
          HorizontalAlignment={Enum.HorizontalAlignment.Center}
          VerticalAlignment={Enum.VerticalAlignment.Center}
          Padding={new UDim(0, 16)}
        />

        {/* Hotkeys Button */}
        <textbutton
          Size={buttonSizeHotkeys.map((px) => new UDim2(0.14, px, 0.3, px))}
          BackgroundColor3={Palette.ButtonPrimaryBackground}
          TextColor3={Palette.White}
          Text={'View Hotkeys'}
          FontFace={Fonts.JosefinSans.SemiBold}
          TextSize={14}
          TextWrapped={true}
          Event={{
            MouseButton1Down: () => {
              buttonSizeMotionHotkeys.spring(-5, springs.bubbly);
            },
            Activated: () => {
              const hotkeyWidgetOption = hotkeysWidget();

              if (hotkeyWidgetOption.isSome()) {
                const hotkeyWidget = hotkeyWidgetOption.unwrap();

                if (hotkeyWidget.Enabled === false) {
                  const hotkeysTreeOption = hotkeysTreeAtom();

                  if (hotkeysTreeOption.isNone()) {
                    hotkeysTreeAtom(Option.some(createRoot(hotkeyWidget)));

                    hotkeysTreeAtom()
                      .unwrap()
                      .render(createPortal(<HotkeyView />, hotkeyWidget));

                    hotkeyWidget.Enabled = true;
                  }
                }
              }
            },
            MouseEnter: () => {
              buttonSizeMotionHotkeys.spring(5, springs.responsive);
            },
            MouseLeave: () => {
              buttonSizeMotionHotkeys.spring(0, springs.responsive);
            },
          }}
        >
          <uicorner CornerRadius={new UDim(0, 4)} />
        </textbutton>

        {/* StartView Status Label & Editing Button */}
        <Pane
          size={new UDim2(0.35, 0, 1, 0)}
          color={Palette.Background3}
          rounded={true}
          paddingHorizontal={new UDim(0, 8)}
          paddingVertical={new UDim(0, 16)}
        >
          <uilistlayout
            FillDirection={Enum.FillDirection.Vertical}
            HorizontalAlignment={Enum.HorizontalAlignment.Center}
            VerticalAlignment={Enum.VerticalAlignment.Center}
            Padding={buttonSize.map((px) => new UDim(0, 16 - px))}
          />

          <textlabel
            Size={new UDim2(1, 0, 0.2, 0)}
            BackgroundTransparency={1}
            TextColor3={Palette.DefaultText}
            Text={resolveSelectionMessage(selectionStatus, selection)}
            FontFace={Fonts.JosefinSans.Regular}
            TextSize={14}
            TextWrapped={true}
          />

          <textbutton
            Size={buttonSize.map((px) => new UDim2(0.9, px, 0.6, px))}
            BackgroundColor3={selectionStatus === SelectionStatus.Valid ? Palette.ButtonPrimaryBackground : Palette.ButtonDisabledBackground}
            TextColor3={selectionStatus === SelectionStatus.Valid ? Palette.White : Palette.ButtonDisabledText}
            Text={'Begin Editing'}
            FontFace={Fonts.JosefinSans.Bold}
            TextSize={16}
            AutoButtonColor={selectionStatus === SelectionStatus.Valid}
            TextWrapped={true}
            Event={{
              MouseButton1Down: () => {
                if (selectionStatus === SelectionStatus.Valid) {
                  buttonSizeMotion.spring(-5, springs.bubbly);
                }
              },
              Activated: () => {
                if (selectionStatus === SelectionStatus.Valid) {
                  if (selection[0].GetChildren().size() === 0) {
                    Log.Warn(`{PREFIX} "${selection[0].Name}" has no children and therefore no instances to animate.`);
                  }

                  // Set the ScreenGui to animate & change to the EditorView
                  const screenGui = selection[0] as ScreenGui;
                  const screenGuiClone = selection[0].Clone() as ScreenGui;

                  screenGui.Parent = animatingFolder().unwrap();
                  screenGui.Enabled = false;
                  screenGuiClone.Parent = StarterGui;
                  screenGuiClone.Enabled = true;

                  Selection.Set([screenGuiClone]);
                  appPlugin().unwrap().GetMouse().Icon = 'rbxasset://SystemCursors/Arrow';

                  originalScreenGuiSelection(Option.some(screenGui));
                  screenGuiSelection(Option.some(screenGuiClone));
                  currentRoute(Route.EditorView);

                  cacheInstanceProperties(screenGuiClone);
                }
              },
              MouseEnter: () => {
                buttonSizeMotion.spring(5, springs.responsive);

                if (selectionStatus !== SelectionStatus.Valid) appPlugin().unwrap().GetMouse().Icon = 'rbxasset://SystemCursors/Forbidden';
              },
              MouseLeave: () => {
                buttonSizeMotion.spring(0, springs.responsive);

                appPlugin().unwrap().GetMouse().Icon = 'rbxasset://SystemCursors/Arrow';
              },
            }}
          >
            <uicorner CornerRadius={new UDim(0, 4)} />
          </textbutton>
        </Pane>

        {/* Download Button */}
        <textbutton
          Size={buttonSizeDownload.map((px) => new UDim2(0.14, px, 0.3, px))}
          BackgroundColor3={Palette.ButtonPrimaryBackground}
          TextColor3={Palette.White}
          Text={'Download RoUI3 Module'}
          FontFace={Fonts.JosefinSans.SemiBold}
          TextWrapped={true}
          TextSize={14}
          Event={{
            MouseButton1Down: () => {
              buttonSizeMotionDownload.spring(-5, springs.bubbly);
            },
            Activated: () => {},
            MouseEnter: () => {
              buttonSizeMotionDownload.spring(5, springs.responsive);
            },
            MouseLeave: () => {
              buttonSizeMotionDownload.spring(0, springs.responsive);
            },
          }}
        >
          <uicorner CornerRadius={new UDim(0, 4)} />
        </textbutton>
      </Pane>
    </Pane>
  );
}
