import { useCallback, useState } from '@rbxts/react';

export function useToggleState(def: boolean = false) {
  const [toggled, setToggled] = useState(def);

  const enable = useCallback(() => {
    setToggled(true);
  }, []);

  const disable = useCallback(() => {
    setToggled(false);
  }, []);

  const toggle = useCallback(() => {
    setToggled((tog) => {
      return !tog;
    });
  }, []);

  return {
    on: toggled,
    enable: enable,
    disable: disable,
    toggle: toggle,
  };
}
