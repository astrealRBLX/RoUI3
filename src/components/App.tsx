import React, { Fragment } from '@rbxts/react';
import { Router } from './Router';
import { HotkeyIDs, useHotkey } from 'utils/hotkeyUtils';
import { ActionManager } from 'state/history';
import { ClipboardManager } from 'state/clipboard';

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

  useHotkey(
    HotkeyIDs.Copy,
    [],
    () => {
      ClipboardManager.copy();
    },
    []
  );

  useHotkey(
    HotkeyIDs.Cut,
    [],
    () => {
      ClipboardManager.cut();
    },
    []
  );

  useHotkey(
    HotkeyIDs.Paste,
    [],
    () => {
      ClipboardManager.paste();
    },
    []
  );

  return <Router />;
}
