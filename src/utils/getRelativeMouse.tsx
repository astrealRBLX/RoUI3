import { useEventListener } from '@rbxts/pretty-react-hooks';
import React, { useBinding } from '@rbxts/react';
import { useAtom } from '@rbxts/react-charm';
import { appWidget } from 'state/globals';

export function getRelativeMouse(): Vector2 {
  const widget = appWidget();

  return widget.isSome()
    ? widget.unwrap().GetRelativeMousePosition()
    : Vector2.one;
}
