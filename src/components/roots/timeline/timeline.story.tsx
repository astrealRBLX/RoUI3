import Roact from '@rbxts/roact';
import RoactRodux from '@rbxts/roact-rodux';
import { AppStore } from 'rodux/store';
import { Timeline } from '.';

// This story will have parts that do **NOT** work
// properly as accessing the plugin & widget is impossible
export = (preview: Instance) => {
  const tree = Roact.mount(
    <RoactRodux.StoreProvider store={AppStore}>
      <Timeline />
    </RoactRodux.StoreProvider>,
    preview
  );

  return () => {
    Roact.unmount(tree);
  };
};
