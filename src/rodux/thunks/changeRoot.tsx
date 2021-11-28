import Roact from '@rbxts/roact';
import RoactRodux from '@rbxts/roact-rodux';
import { Option } from '@rbxts/rust-classes';
import { Button, ButtonStyle } from 'components/button';
import { Timeline } from 'components/roots/timeline';
import { AppStore } from 'rodux/store';
import { TreeManager } from 'utils/trees';
import { WidgetsManager } from 'utils/widgets';

export = (
  inst: Instance,
  widgetManager: WidgetsManager,
  treeManager: TreeManager
) => {
  return (store: typeof AppStore) => {
    const state = store.getState();

    // Verify a new instance is being set & change widgets
    if (state.appData.root.isNone()) {
      // Disable the start widget & enable the timeline widget
      widgetManager.widgets.start.Enabled = false;
      widgetManager.widgets.timeline.Enabled = true;

      // Unmount the start widget tree
      treeManager.trees.start.match(
        (tree) => {
          Roact.unmount(tree);
          treeManager.trees.start = Option.none();
        },
        () => {}
      );

      store.dispatch({
        type: 'SetCurrentRoot',
        root: inst,
      });

      // Mount the timeline widget tree
      treeManager.trees.timeline = Option.some(
        Roact.mount(
          <RoactRodux.StoreProvider store={AppStore}>
            <Timeline />
          </RoactRodux.StoreProvider>,
          widgetManager.widgets.timeline
        )
      );
    }
  };
};
