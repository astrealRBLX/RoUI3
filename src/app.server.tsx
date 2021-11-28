/// <reference types="@rbxts/types/plugin" />

/*
  Thanks for reading through
  the source! If you're interested in
  contributing feel free to do so
  over at https://www.github.com/astrealrblx/RoUI3

  ~ Astreal
*/

let activating = true;
plugin.Activate(true);
activating = false;

import { setPlugin } from 'utils/plugin';
import { createTreeManager } from 'utils/trees';
import { createWidgetManager } from 'utils/widgets';

const widgetManager = createWidgetManager(plugin);
const treeManager = createTreeManager();

setPlugin(plugin);

import Roact from '@rbxts/roact';
import RoactRodux from '@rbxts/roact-rodux';
import { Option } from '@rbxts/rust-classes';
import { Start } from 'components/roots/start';
import { AppStore } from 'rodux/store';
import { RunService } from '@rbxts/services';

const toolbar = plugin.CreateToolbar('RoUI3');
const animateButton = toolbar.CreateButton('Animate', '', '');
const fix = toolbar.CreateButton('Unmount Trees', '', ''); // TODO: Temporary, remove for initial release!

if (!RunService.IsRunning()) {
  // Set initial start tree
  treeManager.trees.start = Option.some(
    Roact.mount(
      <RoactRodux.StoreProvider store={AppStore}>
        <Start />
      </RoactRodux.StoreProvider>,
      widgetManager.widgets.start
    )
  );
}

const cleanupTree = (tree: Option<Roact.Tree>, cb?: () => void) => {
  if (tree.isSome()) {
    Roact.unmount(tree.unwrap());
    if (cb) cb();
  }
};

// Unmount trees when a widget closes
widgetManager.widgets.start.BindToClose(() => {
  cleanupTree(
    treeManager.trees.start,
    () => (treeManager.trees.start = Option.none())
  );
  widgetManager.widgets.start.Enabled = false;
});
widgetManager.widgets.timeline.BindToClose(() => {
  cleanupTree(
    treeManager.trees.timeline,
    () => (treeManager.trees.timeline = Option.none())
  );
  widgetManager.widgets.timeline.Enabled = false;
});

animateButton.Click.Connect(() => {
  // TODO: Will eventually mount start tree
});

fix.Click.Connect(() => {
  cleanupTree(
    treeManager.trees.start,
    () => (treeManager.trees.start = Option.none())
  );
  cleanupTree(
    treeManager.trees.timeline,
    () => (treeManager.trees.timeline = Option.none())
  );
});

plugin.Unloading.Connect(() => {
  cleanupTree(
    treeManager.trees.start,
    () => (treeManager.trees.start = Option.none())
  );
  cleanupTree(
    treeManager.trees.timeline,
    () => (treeManager.trees.timeline = Option.none())
  );
});

settings().Studio.ThemeChanged.Connect(() => {
  AppStore.dispatch({
    type: 'SetTheme',
    theme: settings().Studio.Theme,
  });
});
