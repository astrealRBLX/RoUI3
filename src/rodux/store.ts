import Rodux from '@rbxts/rodux';
import { DataActions, dataReducer, IDataReducer } from './reducers/dataReducer';
import {
  IThemeReducer,
  ThemeActions,
  themeReducer,
} from './reducers/themeReducer';

export interface IAppStore {
  theme: IThemeReducer;
  appData: IDataReducer;
}

export type StoreActions = ThemeActions | DataActions;
export type StoreDispatch = Rodux.Dispatch<StoreActions>;

export const StoreReducer = Rodux.combineReducers<IAppStore, StoreActions>({
  theme: themeReducer,
  appData: dataReducer,
});

const RootReducer = (
  state: IAppStore,
  action: StoreActions | Rodux.Action<'ResetStore'>
) => {
  if (action.type === 'ResetStore') {
    return StoreReducer(undefined as never, action as never);
  }

  return StoreReducer(state, action);
};

export const AppStore = new Rodux.Store(RootReducer, undefined, [
  Rodux.thunkMiddleware,
]);
