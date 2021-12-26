// restoreRoot() is a thunk that will switch to the

import { AppStore } from 'rodux/store';

// timeline widget when the app root is changed / set
export = () => {
  return (store: typeof AppStore) => {
    const state = store.getState();
    const appData = state.appData;

    // Verify a root and originalRoot already exist
    if (appData.root.isSome() && appData.originalRoot.isSome()) {
      const root = appData.root.unwrap();
      const originalRoot = appData.originalRoot.unwrap();

      originalRoot.Parent = root.Parent;
      (originalRoot as ScreenGui).Enabled = true;
      root.Destroy();

      // Dispatch the root change
      store.dispatch({
        type: 'ResetStore',
      });
    }
  };
};
