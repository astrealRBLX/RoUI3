import Roact from '@rbxts/roact';
import RoactRodux from '@rbxts/roact-rodux';
import { AppStore } from 'rodux/store';
import { Start } from '.';

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
