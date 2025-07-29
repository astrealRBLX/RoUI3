import { peek } from '@rbxts/charm';
import { pressedKeys } from 'state/editor';

export enum HotkeyIDs {
  ScrubberSnapTimestamp,
  ScrubberSnapKeyframe,
  KeyframesSelectMultiple,
  KeyframesDragInvertSelection,
}

const hotkeys = new Map<HotkeyIDs, Enum.KeyCode[]>([
  [HotkeyIDs.ScrubberSnapTimestamp, [Enum.KeyCode.LeftControl]],
  [
    HotkeyIDs.ScrubberSnapKeyframe,
    [Enum.KeyCode.LeftControl, Enum.KeyCode.LeftShift],
  ],
  [HotkeyIDs.KeyframesSelectMultiple, [Enum.KeyCode.LeftControl]],
  [HotkeyIDs.KeyframesDragInvertSelection, [Enum.KeyCode.LeftControl]],
]);

export function isHotkeyPressed(id: HotkeyIDs) {
  const pressed = peek(pressedKeys);
  const keys = hotkeys.get(id);

  if (keys === undefined) return false;

  if (keys.size() !== pressed.size()) return false;

  let matchedKeys = 0;

  keys.forEach((key) => {
    if (pressed.has(key)) matchedKeys += 1;
  });

  if (matchedKeys !== keys.size()) return false;

  return true;
}
