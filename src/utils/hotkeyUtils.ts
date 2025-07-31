import { peek, subscribe } from '@rbxts/charm';
import { useEffect, useRef } from '@rbxts/react';
import { RunService } from '@rbxts/services';
import { pressedKeys } from 'state/editor';

export enum HotkeyIDs {
  // Scrubber contextual
  ScrubberSnapTimestamp,
  ScrubberSnapKeyframe,

  // Scrubber static
  ScrubberPreview,
  ScrubberNudgeLeft,
  ScrubberNudgeLeftSlow,
  ScrubberNudgeLeftFast,
  ScrubberNudgeRight,
  ScrubberNudgeRightSlow,
  ScrubberNudgeRightFast,

  // Keyframes contextual
  KeyframesSelectMultiple,
  KeyframesSelectRange,
  KeyframesDragDeselect,
  KeyframesDragInvertSelection,

  // Keyframes static
  KeyframesInsert,
  KeyframesDeleteSelected,
}

const hotkeys = new Map<HotkeyIDs, Enum.KeyCode[]>([
  [HotkeyIDs.ScrubberSnapTimestamp, [Enum.KeyCode.LeftControl]],
  [HotkeyIDs.ScrubberSnapKeyframe, [Enum.KeyCode.LeftShift]],

  [HotkeyIDs.ScrubberPreview, [Enum.KeyCode.Space]],
  [HotkeyIDs.ScrubberNudgeLeft, [Enum.KeyCode.Q]],
  [HotkeyIDs.ScrubberNudgeLeftSlow, [Enum.KeyCode.Q, Enum.KeyCode.LeftControl]],
  [HotkeyIDs.ScrubberNudgeLeftFast, [Enum.KeyCode.Q, Enum.KeyCode.LeftShift]],
  [HotkeyIDs.ScrubberNudgeRight, [Enum.KeyCode.E]],
  [HotkeyIDs.ScrubberNudgeRightSlow, [Enum.KeyCode.E, Enum.KeyCode.LeftControl]],
  [HotkeyIDs.ScrubberNudgeRightFast, [Enum.KeyCode.E, Enum.KeyCode.LeftShift]],

  [HotkeyIDs.KeyframesSelectMultiple, [Enum.KeyCode.LeftControl]],
  [HotkeyIDs.KeyframesSelectRange, [Enum.KeyCode.LeftShift]],
  [HotkeyIDs.KeyframesDragDeselect, [Enum.KeyCode.LeftControl]],
  [HotkeyIDs.KeyframesDragInvertSelection, [Enum.KeyCode.LeftControl, Enum.KeyCode.LeftShift]],

  [HotkeyIDs.KeyframesInsert, [Enum.KeyCode.I]],
  [HotkeyIDs.KeyframesDeleteSelected, [Enum.KeyCode.Delete]],
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

export function useHotkey(
  id: HotkeyIDs,
  withContextHotkeys: HotkeyIDs[],
  callback: (contextHotkey?: HotkeyIDs) => void,
  dependencies: React.DependencyList
) {
  useEffect(() => {
    const cleanup = subscribe(pressedKeys, () => {
      if (isHotkeyPressed(id)) {
        callback();
      } else if (withContextHotkeys.size() > 0) {
        withContextHotkeys.forEach((ctxKey) => {
          if (isHotkeyPressed(ctxKey)) callback(ctxKey);
        });
      }
    });

    return cleanup;
  }, dependencies);
}

export function useHotkeyDown(
  id: HotkeyIDs,
  withContextHotkeys: HotkeyIDs[],
  callbackDelay: number,
  callback: (contextHotkey?: HotkeyIDs) => void,
  dependencies: React.DependencyList
) {
  const toNextCall = useRef(0);

  useEffect(() => {
    const conn = RunService.RenderStepped.Connect(() => {
      if (tick() >= toNextCall.current) {
        if (isHotkeyPressed(id)) {
          callback();
        } else if (withContextHotkeys.size() > 0) {
          withContextHotkeys.forEach((ctxKey) => {
            if (isHotkeyPressed(ctxKey)) callback(ctxKey);
          });
        }

        toNextCall.current = tick() + callbackDelay;
      }
    });

    return () => {
      conn.Disconnect();
    };
  }, dependencies);
}
