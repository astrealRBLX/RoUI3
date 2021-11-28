import Roact from '@rbxts/roact';
import RoactRodux from '@rbxts/roact-rodux';
import { AppStore } from 'rodux/store';
import { Start } from '.';

// The `Continue` button on this story
// will **NOT** work as it depends on widgets
export = (preview: Instance) => {
  const tree = Roact.mount(
    <RoactRodux.StoreProvider store={AppStore}>
      <Start />
    </RoactRodux.StoreProvider>,
    preview
  );

  return () => {
    Roact.unmount(tree);
  };
};
