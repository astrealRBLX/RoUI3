import React from '@rbxts/react';
import { useAtom } from '@rbxts/react-charm';
import { currentRoute, Route } from 'state/routes';
import { StartView } from './views/StartView';
import { EditorView } from './views/EditorView';

/*
  components/Router

  This component is used to route to
  a different view dependent on state.
*/
export function Router() {
  const route = useAtom(currentRoute);

  switch (route) {
    case Route.StartView:
      return <StartView />;
    case Route.EditorView:
      return <EditorView />;
    default:
      return <StartView />;
  }
}
