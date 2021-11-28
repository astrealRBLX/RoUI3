import Rodux from '@rbxts/rodux';
import { ActionSetTheme } from 'rodux/actions/themeActions';

export interface IThemeReducer {
  theme: StudioTheme;
}

const initialState: IThemeReducer = {
  theme: settings().Studio.Theme,
};

export type ThemeActions = ActionSetTheme;

export const themeReducer = Rodux.createReducer<IThemeReducer, ThemeActions>(
  initialState,
  {
    SetTheme: (state, action) => {
      return {
        theme: action.theme,
      };
    },
  }
);
