/*
  Thanks for reading through
  the source! If you're interested in
  contributing feel free to do so
  over at https://www.github.com/astrealrblx/RoUI3

  ~ Astreal
*/
import Log, { Logger } from '@rbxts/log';
import React from '@rbxts/react';
import ReactRoblox, { createPortal, createRoot } from '@rbxts/react-roblox';
import { Option } from '@rbxts/rust-classes';
import { CoreGui, RunService, StarterGui } from '@rbxts/services';
import { App } from 'components/App';
import { ClipboardManager } from 'state/clipboard';
import {
  activeContextMenu,
  animationRegistry,
  internalPropertyChange,
  mutedPropertiesAtom,
  pressedKeys,
  previewKeyframesAtom,
  selectedKeyframes,
  settingAutoKeyframe,
  settingMaxTimelineLength,
  settingScrubberPosition,
  settingSyncSelections,
  startInternalPropertyChange,
} from 'state/editor';
import { animatingFolder, appPlugin, appTreeAtom, appWidget, hotkeysTreeAtom, hotkeysWidget } from 'state/globals';
import { ActionManager } from 'state/history';
import { clearCache } from 'state/properties';
import { currentRoute, Route } from 'state/routes';
import {
  currentTimestamps,
  editorWarnings,
  instanceTreeSelection,
  originalScreenGuiSelection,
  previewData,
  screenGuiSelection,
  scrubbingData,
} from 'state/timeline';
import { ToastManager } from 'state/toasts';

appPlugin(Option.some(plugin));

Log.SetLogger(Logger.configure().EnrichWithProperty('PREFIX', '[RoUI3] [2.0.0]').WriteTo(Log.RobloxOutput()).Create());

if (!RunService.IsRunning()) {
  plugin.Activate(true);

  if (animatingFolder().isNone() && CoreGui.FindFirstChild('RoUI3_Animating') === undefined) {
    const animatingFolderInst = new Instance('Folder');

    animatingFolderInst.Name = 'RoUI3_Animating';
    animatingFolderInst.Parent = CoreGui;

    animatingFolder(Option.some(animatingFolderInst));
  } else if (animatingFolder().isNone() && CoreGui.FindFirstChild('RoUI3_Animating')) {
    animatingFolder(Option.some(CoreGui.FindFirstChild('RoUI3_Animating') as Folder));
  }

  const toolbar = plugin.CreateToolbar('RoUI3');
  const animateButton = toolbar.CreateButton('roui3_edit', 'Start animating with RoUI3', 'http://www.roblox.com/asset/?id=11793434500', 'Editor');

  const widget = plugin.CreateDockWidgetPluginGui(
    'roui3-main-widget',
    new DockWidgetPluginGuiInfo(Enum.InitialDockState.Bottom, false, true, 500, 250, 500, 250)
  );
  const hotkeyWidget = plugin.CreateDockWidgetPluginGui(
    'roui3-hotkey-widget',
    new DockWidgetPluginGuiInfo(Enum.InitialDockState.Float, false, false, 250, 250, 250, 250)
  );

  appWidget(Option.some(widget));
  hotkeysWidget(Option.some(hotkeyWidget));

  // `Title` isn't found as a property of `DockWidgetPluginGui` ???
  widget['Title' as never] = 'RoUI3' as never;
  widget.Name = 'RoUI3';

  hotkeyWidget['Title' as never] = 'RoUI3 - Hotkeys' as never;
  hotkeyWidget.Name = 'RoUI3_Hotkeys';

  let cleanup = () => {
    appTreeAtom((rootOption) => {
      return rootOption.andWith((root) => {
        root.unmount();

        return Option.none();
      });
    });
    hotkeysTreeAtom((rootOption) => {
      return rootOption.andWith((root) => {
        root.unmount();

        return Option.none();
      });
    });

    appWidget().unwrap().Enabled = false;
    hotkeysWidget().unwrap().Enabled = false;

    // Clean up the cloned ScreenGui
    if (screenGuiSelection().isSome()) {
      const screenGuiClone = screenGuiSelection().unwrap();

      screenGuiSelection(Option.none());
      screenGuiClone.Destroy();
    }

    // Clean up the original ScreenGui
    if (originalScreenGuiSelection().isSome()) {
      const screenGui = originalScreenGuiSelection().unwrap();

      screenGui.Parent = StarterGui;
      screenGui.Enabled = true;
      originalScreenGuiSelection(Option.none());
    }

    // Clean up state
    currentRoute(Route.StartView);

    clearCache();

    settingMaxTimelineLength(5);
    settingScrubberPosition(1);
    settingAutoKeyframe(true);
    internalPropertyChange(new Map());
    mutedPropertiesAtom(new Map());
    settingSyncSelections(true);
    pressedKeys(new Set());
    activeContextMenu('');
    selectedKeyframes([]);
    previewKeyframesAtom([]);
    animationRegistry(new Map());

    instanceTreeSelection(Option.none());
    currentTimestamps([]);
    scrubbingData({ isScrubbing: false, mouseOffset: 0 });
    previewData({ isPreviewing: false, previewTime: 0 });
    editorWarnings(new Set());

    ActionManager.clearHistory();
    ToastManager.clearToasts();
    ClipboardManager.clearClipboard();
  };

  let cleanupHotkeys = () => {
    hotkeysTreeAtom((rootOption) => {
      return rootOption.andWith((root) => {
        root.unmount();

        return Option.none();
      });
    });

    hotkeysWidget().unwrap().Enabled = false;
  };

  (widget['BindToClose' as never] as Callback)(appWidget().unwrap(), cleanup) as never;
  (hotkeyWidget['BindToClose' as never] as Callback)(hotkeysWidget().unwrap(), cleanupHotkeys) as never;

  animateButton.Click.Connect(() => {
    if (RunService.IsRunning()) {
      return;
    }

    if (appTreeAtom().isNone()) {
      plugin.Activate(true);

      appTreeAtom(Option.some(createRoot(appWidget().unwrap())));

      appTreeAtom()
        .unwrap()
        .render(createPortal(<App />, appWidget().unwrap()));

      appWidget().unwrap().Enabled = true;
    } else {
      cleanup();
    }
  });
}
