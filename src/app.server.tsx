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
import { RunService } from '@rbxts/services';
import restoreRoot from 'rodux/thunks/restoreRoot';

if (!RunService.IsRunning()) {
  const toolbar = plugin.CreateToolbar('RoUI3');
  const animateButton = toolbar.CreateButton('Animate', '', '');

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
