import Roact from '@rbxts/roact';
import RoactRodux from '@rbxts/roact-rodux';
import { IAppStore } from 'rodux/store';

export function useTheme<P>() {
  return RoactRodux.connect((state: IAppStore) => {
    return {
      theme: state.theme.theme,
    };
  });
}
