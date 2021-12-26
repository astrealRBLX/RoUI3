import Roact from '@rbxts/roact';
import RoactRodux from '@rbxts/roact-rodux';
import { Option } from '@rbxts/rust-classes';
import { Timeline } from 'components/roots/timeline';
import { AppStore } from 'rodux/store';
import { TreeManager } from 'utils/trees';
import { WidgetsManager } from 'utils/widgets';

const CoreGui = game.GetService('CoreGui');

// changeRoot() is a thunk that will switch to the
// timeline widget when the app root is changed / set
export = (
  root: Instance,
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

      // Switch root with a fake
      const rootClone = root.Clone();
      rootClone.Parent = root.Parent;
      root.Parent = CoreGui;

      // Dispatch the root change
      store.dispatch({
        type: 'SetCurrentRoot',
        root: rootClone,
        originalRoot: root,
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
