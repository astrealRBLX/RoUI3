import Roact from '@rbxts/roact';
import RoactHooks from '@rbxts/roact-hooks';
import RoactRodux from '@rbxts/roact-rodux';
import { Workspace } from '@rbxts/services';
import { AppStore } from 'rodux/store';
import { TreeView } from '.';

const TreeViewStoryComponent: RoactHooks.FC = (_, { useState }) => {
  const [selected, setSelected] = useState<Instance | undefined>(undefined);
  const [expanded, setExpanded] = useState<Set<Instance>>(new Set([]));

  return (
    <RoactRodux.StoreProvider store={AppStore}>
      <TreeView
        Expanded={expanded}
        RootItem={game.GetService('ServerScriptService')}
        Selected={selected}
        Size={new UDim2(0.2, 0, 1, 0)}
        BaseClass={'Folder'}
        OnExpansionChange={(item, newState) => {
          if (newState) {
            setExpanded(new Set([...expanded, item]));
          } else {
            const ex = new Set([...expanded]);
            ex.delete(item);
            setExpanded(ex);
          }
        }}
        OnSelectionChange={(item) => {
          if (item === selected) {
            setSelected(undefined);
          } else {
            setSelected(item);
          }
        }}
      />
    </RoactRodux.StoreProvider>
  );
};

const TreeViewStory = new RoactHooks(Roact)(TreeViewStoryComponent);

export = (preview: Instance) => {
  const tree = Roact.mount(<TreeViewStory />, preview);

  return () => {
    Roact.unmount(tree);
  };
};
