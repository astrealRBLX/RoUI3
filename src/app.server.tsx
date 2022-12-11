/// <reference types="@rbxts/types/plugin" />

/*
  Thanks for reading through
  the source! If you're interested in
  contributing feel free to do so
  over at https://www.github.com/astrealrblx/RoUI3

  ~ Astreal
*/
import { createTreeManager, TreeManager } from 'utils/trees';
import { createWidgetManager } from 'utils/widgets';
import { setPlugin } from 'utils/plugin';

plugin.Activate(true);

const widgetManager = createWidgetManager(plugin);
const treeManager = createTreeManager();

setPlugin(plugin);

import Roact from '@rbxts/roact';
import RoactRodux from '@rbxts/roact-rodux';
import { Option } from '@rbxts/rust-classes';
import { Start } from 'components/roots/start';
import { AppStore } from 'rodux/store';
import { RunService, Workspace } from '@rbxts/services';
import restoreRoot from 'rodux/thunks/restoreRoot';

let RoUI3Module: ModuleScript;

if (!RunService.IsRunning()) {
  const toolbar = plugin.CreateToolbar('RoUI3');
  const animateButton = toolbar.CreateButton(
    'roui3_animate',
    'Start animating with RoUI3',
    'http://www.roblox.com/asset/?id=11793434500',
    'Animate'
  );
  const downloadButton = toolbar.CreateButton(
    'roui3_download',
    'Download the RoUI3 animation module',
    'http://www.roblox.com/asset/?id=11793434500',
    'Download RoUI3 Module'
  );

  // Utility function for unmounting a tree wrapped in an option
  const cleanupTree = (tree: Option<Roact.Tree>, cb?: () => void) => {
    if (tree.isSome()) {
      Roact.unmount(tree.unwrap());
      if (cb) cb();
    }
  };

  // Unmount trees when a widget closes
  widgetManager.widgets.start.BindToClose(() => {
    cleanupTree(treeManager.trees.start, () => {
      treeManager.trees.start = Option.none();
      widgetManager.widgets.start.Enabled = false;
      AppStore.dispatch(restoreRoot() as never);
    });
  });
  widgetManager.widgets.timeline.BindToClose(() => {
    cleanupTree(treeManager.trees.timeline, () => {
      treeManager.trees.timeline = Option.none();
      widgetManager.widgets.timeline.Enabled = false;
      AppStore.dispatch(restoreRoot() as never);
    });
  });

  animateButton.Click.Connect(() => {
    if (treeManager.trees.start.isNone()) {
      if (treeManager.trees.timeline.isSome()) {
        cleanupTree(treeManager.trees.timeline, () => {
          treeManager.trees.timeline = Option.none();
          widgetManager.widgets.timeline.Enabled = false;
          AppStore.dispatch(restoreRoot() as never);
        });
      }

      treeManager.trees.start = Option.some(
        Roact.mount(
          <RoactRodux.StoreProvider store={AppStore}>
            <Start />
          </RoactRodux.StoreProvider>,
          widgetManager.widgets.start
        )
      );
      widgetManager.widgets.start.Enabled = true;
    } else {
      cleanupTree(treeManager.trees.start, () => {
        treeManager.trees.start = Option.none();
        widgetManager.widgets.start.Enabled = false;
        AppStore.dispatch(restoreRoot() as never);
      });
    }
  });

  downloadButton.Click.Connect(() => {
    const selection = game.GetService('Selection').Get()[0];
    const clone = RoUI3Module.Clone();
    clone.Parent =
      selection === undefined
        ? game.GetService('ReplicatedStorage')
        : selection;
  });

  // Cleanup on unload
  plugin.Unloading.Connect(() => {
    cleanupTree(
      treeManager.trees.start,
      () => (treeManager.trees.start = Option.none())
    );
    cleanupTree(
      treeManager.trees.timeline,
      () => (treeManager.trees.timeline = Option.none())
    );
    AppStore.dispatch(restoreRoot() as never);
  });

  // Update store when studio theme changes
  settings().Studio.ThemeChanged.Connect(() => {
    AppStore.dispatch({
      type: 'SetTheme',
      theme: settings().Studio.Theme,
    });
  });
}

// Download RoUI3 module
if (RunService.IsEdit()) {
  const code = game
    .GetService('HttpService')
    .GetAsync(
      'https://raw.githubusercontent.com/astrealRBLX/RoUI3/master/RoUI3.lua'
    );
  RoUI3Module = new Instance('ModuleScript');
  RoUI3Module.Name = 'RoUI3';
  RoUI3Module.Source = code;
}
