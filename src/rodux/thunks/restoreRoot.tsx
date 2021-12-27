import { AppStore } from 'rodux/store';
import { clearProperties } from 'utils/initialProperties';

// restoreRoot() is a thunk that will restore the
// original root object while also resetting the
// app's store
export = () => {
  return (store: typeof AppStore) => {
    const state = store.getState();
    const appData = state.appData;

    // Verify a root and originalRoot already exist
    if (appData.root.isSome() && appData.originalRoot.isSome()) {
      const root = appData.root.unwrap();
      const originalRoot = appData.originalRoot.unwrap() as ScreenGui;

      originalRoot.Parent = root.Parent;
      originalRoot.Enabled = true;
      root.Destroy();

      // Clear any changed properties
      clearProperties();

      // Dispatch the root change
      store.dispatch({
        type: 'ResetStore',
      });
    }
  };
};
