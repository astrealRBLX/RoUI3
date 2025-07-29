/*
  Thanks for reading through
  the source! If you're interested in
  contributing feel free to do so
  over at https://www.github.com/astrealrblx/RoUI3

  ~ Astreal
*/
plugin.Activate(true);

import Log, { Logger } from '@rbxts/log';
import React from '@rbxts/react';
import ReactRoblox, { createPortal, createRoot } from '@rbxts/react-roblox';
import { Option } from '@rbxts/rust-classes';
import { CoreGui, RunService, StarterGui } from '@rbxts/services';
import { App } from 'components/App';
import { animatingFolder, appPlugin, appWidget } from 'state/globals';
import { currentRoute, Route } from 'state/routes';
import { originalScreenGuiSelection, screenGuiSelection } from 'state/timeline';

let appTree: Option<ReactRoblox.Root> = Option.none();

appPlugin(Option.some(plugin));

Log.SetLogger(Logger.configure().EnrichWithProperty('PREFIX', '[RoUI3] 2.0.0').WriteTo(Log.RobloxOutput()).Create());

if (animatingFolder().isNone() && CoreGui.FindFirstChild('RoUI3_Animating') === undefined) {
  const animatingFolderInst = new Instance('Folder');

  animatingFolderInst.Name = 'RoUI3_Animating';
  animatingFolderInst.Parent = CoreGui;

  animatingFolder(Option.some(animatingFolderInst));
} else if (animatingFolder().isNone() && CoreGui.FindFirstChild('RoUI3_Animating')) {
  animatingFolder(Option.some(CoreGui.FindFirstChild('RoUI3_Animating') as Folder));
}

if (!RunService.IsRunning()) {
  const toolbar = plugin.CreateToolbar('RoUI3');
  const animateButton = toolbar.CreateButton('roui3_edit', 'Start animating with RoUI3', 'http://www.roblox.com/asset/?id=11793434500', 'Editor');

  appWidget(
    Option.some(
      plugin.CreateDockWidgetPluginGui(
        'roui3-main-widget',
        new DockWidgetPluginGuiInfo(Enum.InitialDockState.Bottom, false, true, 500, 250, 500, 250)
      )
    )
  );

  // `Title` isn't found as a property of `DockWidgetPluginGui` ???
  appWidget().unwrap()['Title' as never] = 'RoUI3 - v2.0.0' as never;
  appWidget().unwrap().Name = 'RoUI3';

  let cleanup = () => {
    appTree.unwrap().unmount();

    appTree = Option.none();

    appWidget().unwrap().Enabled = false;

    currentRoute(Route.StartView);

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
  };

  (appWidget().unwrap()['BindToClose' as never] as Callback)(appWidget().unwrap(), cleanup) as never;

  animateButton.Click.Connect(() => {
    if (appTree.isNone()) {
      appTree = Option.some(createRoot(appWidget().unwrap()));

      appTree.unwrap().render(createPortal(<App />, appWidget().unwrap()));

      appWidget().unwrap().Enabled = true;
    } else {
      cleanup();
    }
  });
}

// Download RoUI3 module
if (RunService.IsEdit()) {
  // TODO: Impl module downloading
}
