import React, { Fragment } from '@rbxts/react';
import { Router } from './Router';
import { HotkeyIDs, useHotkey } from 'utils/hotkeyUtils';
import { ActionManager } from 'state/history';

/*
  components/App

  This is the core RoUI3 plugin app and
  what React directly mounts.
*/
export function App() {
  useHotkey(
    HotkeyIDs.Undo,
    [],
    () => {
      ActionManager.undo();
    },
    []
  );

  useHotkey(
    HotkeyIDs.Redo,
    [],
    () => {
      ActionManager.redo();
    },
    []
  );

  return <Router />;
}
