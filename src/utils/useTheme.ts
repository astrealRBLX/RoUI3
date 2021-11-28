import RoactRodux from '@rbxts/roact-rodux';
import { IAppStore } from 'rodux/store';

// Utility function for connecting to the AppStore's theme data
export function useTheme() {
  return RoactRodux.connect((state: IAppStore) => {
    return {
      theme: state.theme.theme,
    };
  });
}
