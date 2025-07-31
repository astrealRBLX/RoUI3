import { useEffect, useMemo, useState } from '@rbxts/react';

/*
  Hook to reset the state of a child component whenever an array of
  dependencies change. Returns a key that should be set as the `key`
  attribute of the child component.
*/
export function useResetState(dependencies: React.DependencyList): [number, () => void] {
  const [key, setKey] = useState(0);

  const reset = () => {
    setKey((k) => k + 1);
  };

  useEffect(() => {
    reset();
  }, dependencies);

  // useMemo(reset, dependencies);

  return [key, reset];
}
