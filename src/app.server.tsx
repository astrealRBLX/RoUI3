/*
  Thanks for reading through
  the source! If you're interested in
  contributing feel free to do so
  over at https://www.github.com/astrealrblx/RoUI3

  ~ Astreal
*/
plugin.Activate(true);

import React from '@rbxts/react';
import ReactRoblox, { createPortal, createRoot } from '@rbxts/react-roblox';
import { Option } from '@rbxts/rust-classes';
import { RunService } from '@rbxts/services';
import { App } from 'components/App';
import { appPlugin } from 'state/globals';

let appTree: Option<ReactRoblox.Root> = Option.none();

appPlugin(Option.some(plugin));

if (!RunService.IsRunning()) {
  const toolbar = plugin.CreateToolbar('RoUI3');
  const animateButton = toolbar.CreateButton(
    'roui3_edit',
    'Start animating with RoUI3',
    'http://www.roblox.com/asset/?id=11793434500',
    'Editor'
  );

  const mainWidget = plugin.CreateDockWidgetPluginGui(
    'roui3-main-widget',
    new DockWidgetPluginGuiInfo(
      Enum.InitialDockState.Bottom,
      false,
      true,
      500,
      250,
      500,
      250
    )
  );

  // `Title` isn't found as a property of `DockWidgetPluginGui` ???
  mainWidget['Title' as never] = 'RoUI3 - v2.0.0' as never;
  mainWidget.Name = 'RoUI3';

  animateButton.Click.Connect(() => {
    if (appTree.isNone()) {
      appTree = Option.some(createRoot(mainWidget));

      appTree.unwrap().render(createPortal(<App />, mainWidget));

      mainWidget.Enabled = true;
    } else {
      appTree.unwrap().unmount();

      appTree = Option.none();

      mainWidget.Enabled = false;
    }
  });
}

// Download RoUI3 module
if (RunService.IsEdit()) {
  // TODO: Impl module downloading
}
