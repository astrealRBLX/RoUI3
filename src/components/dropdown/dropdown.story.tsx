import Roact from '@rbxts/roact';
import RoactRodux from '@rbxts/roact-rodux';
import { AppStore } from 'rodux/store';
import { Dropdown } from '.';

// The dropdown for this story will not properly display
// as a result of it requiring a parent component to manage state
export = (preview: Instance) => {
  const tree = Roact.mount(
    <RoactRodux.StoreProvider store={AppStore}>
      <Dropdown
        Open={true}
        Selected={'Test'}
        Options={['Test', 'Thing', 'Wow']}
        Height={20}
        OnOptionSelected={(x) => {
          print(x);
        }}
        OnClick={() => {
          print('Click');
        }}
      ></Dropdown>
    </RoactRodux.StoreProvider>,
    preview
  );

  return () => {
    Roact.unmount(tree);
  };
};
