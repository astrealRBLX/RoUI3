import { peek, subscribe } from '@rbxts/charm';
import { useEffect, useRef } from '@rbxts/react';
import { RunService } from '@rbxts/services';
import { pressedKeys } from 'state/editor';
import { createNextOrder } from './createNextOrder';

export enum HotkeyIDs {
  // Scrubber contextual
  ScrubberSnapTimestamp,
  ScrubberSnapKeyframe,

  // Scrubber static
  ScrubberPreview,
  ScrubberNudgeLeftPrecise,
  ScrubberNudgeLeft,
  ScrubberNudgeLeftFast,
  ScrubberNudgeRightPrecise,
  ScrubberNudgeRight,
  ScrubberNudgeRightFast,

  // Keyframes contextual
  KeyframesSelectMultiple,
  KeyframesSelectRange,
  KeyframesDragAdditiveSelection,
  KeyframesDragInvertSelection,
  KeyframesNudgeLeft,
  KeyframesNudgeRight,

  // Keyframes static
  KeyframesInsert,
  KeyframesDeleteSelected,

  // General
  Undo,
  Redo,
  Copy,
  Paste,
  Cut,
}

const hotkeys = new Map<HotkeyIDs, Enum.KeyCode[]>([
  [HotkeyIDs.ScrubberSnapTimestamp, [Enum.KeyCode.LeftControl]],
  [HotkeyIDs.ScrubberSnapKeyframe, [Enum.KeyCode.LeftShift]],

  [HotkeyIDs.ScrubberPreview, [Enum.KeyCode.Space]],
  [HotkeyIDs.ScrubberNudgeLeftPrecise, [Enum.KeyCode.Q, Enum.KeyCode.LeftControl]],
  [HotkeyIDs.ScrubberNudgeLeft, [Enum.KeyCode.Q]],
  [HotkeyIDs.ScrubberNudgeLeftFast, [Enum.KeyCode.Q, Enum.KeyCode.LeftShift]],
  [HotkeyIDs.ScrubberNudgeRightPrecise, [Enum.KeyCode.E, Enum.KeyCode.LeftControl]],
  [HotkeyIDs.ScrubberNudgeRight, [Enum.KeyCode.E]],
  [HotkeyIDs.ScrubberNudgeRightFast, [Enum.KeyCode.E, Enum.KeyCode.LeftShift]],

  [HotkeyIDs.KeyframesSelectMultiple, [Enum.KeyCode.LeftControl]],
  [HotkeyIDs.KeyframesSelectRange, [Enum.KeyCode.LeftShift]],
  [HotkeyIDs.KeyframesDragAdditiveSelection, [Enum.KeyCode.LeftShift]],
  [HotkeyIDs.KeyframesDragInvertSelection, [Enum.KeyCode.LeftControl]],
  [HotkeyIDs.KeyframesNudgeLeft, [Enum.KeyCode.K]],
  [HotkeyIDs.KeyframesNudgeRight, [Enum.KeyCode.L]],

  [HotkeyIDs.KeyframesInsert, [Enum.KeyCode.I]],
  [HotkeyIDs.KeyframesDeleteSelected, [Enum.KeyCode.LeftAlt, Enum.KeyCode.I]],

  [HotkeyIDs.Undo, [Enum.KeyCode.LeftAlt, Enum.KeyCode.Z]],
  [HotkeyIDs.Redo, [Enum.KeyCode.LeftAlt, Enum.KeyCode.Y]],
  [HotkeyIDs.Copy, [Enum.KeyCode.LeftControl, Enum.KeyCode.LeftAlt, Enum.KeyCode.C]],
  [HotkeyIDs.Paste, [Enum.KeyCode.LeftControl, Enum.KeyCode.LeftAlt, Enum.KeyCode.V]],
  [HotkeyIDs.Cut, [Enum.KeyCode.LeftControl, Enum.KeyCode.LeftAlt, Enum.KeyCode.X]],
]);

interface HotkeyInfo {
  order: number;
  label: string;
  description: string;
  keys: string;
}

const nextOrder = createNextOrder();
export const hotkeysInfo = new Map<HotkeyIDs, HotkeyInfo>([
  [
    HotkeyIDs.ScrubberPreview,
    {
      order: nextOrder(),
      label: 'Preview Animation',
      description: "Previews the animation starting from the scrubber's current position",
      keys: 'Space',
    },
  ],
  [HotkeyIDs.Undo, { order: nextOrder(), label: 'Undo', description: 'Undo the last action', keys: 'Alt+Z' }],
  [HotkeyIDs.Redo, { order: nextOrder(), label: 'Redo', description: 'Redo the last undone action', keys: 'Alt+Y' }],
  [HotkeyIDs.Copy, { order: nextOrder(), label: 'Copy', description: 'Copy the selected keyframes', keys: 'Ctrl+Alt+C' }],
  [HotkeyIDs.Cut, { order: nextOrder(), label: 'Cut', description: 'Cut the selected keyframes', keys: 'Ctrl+Alt+X' }],
  [HotkeyIDs.Paste, { order: nextOrder(), label: 'Paste', description: 'Paste the selected keyframes', keys: 'Ctrl+Alt+V' }],

  [
    HotkeyIDs.KeyframesInsert,
    {
      order: nextOrder(),
      label: 'Insert/Update Keyframe',
      description: "Insert or update a keyframe at the scrubber's position based on currently selected property",
      keys: 'I',
    },
  ],
  [
    HotkeyIDs.KeyframesDeleteSelected,
    { order: nextOrder(), label: 'Delete Selected Keyframes', description: 'Delete all selected keyframes', keys: 'Alt+I' },
  ],

  [
    HotkeyIDs.KeyframesNudgeLeft,
    { order: nextOrder(), label: 'Nudge Selected Keyframes Left', description: 'Nudge selected keyframes left', keys: 'K' },
  ],
  [
    HotkeyIDs.KeyframesNudgeRight,
    { order: nextOrder(), label: 'Nudge Selected Keyframes Right', description: 'Nudge selected keyframes right', keys: 'L' },
  ],
  [HotkeyIDs.ScrubberNudgeLeft, { order: nextOrder(), label: 'Scrubber Nudge Left', description: 'Nudge the scrubber left', keys: 'Q' }],
  [HotkeyIDs.ScrubberNudgeLeftPrecise, { order: nextOrder(), label: 'Scrubber Nudge Left (Precise)', description: '', keys: 'Ctrl+Q' }],
  [HotkeyIDs.ScrubberNudgeLeftFast, { order: nextOrder(), label: 'Scrubber Nudge Left (Fast)', description: '', keys: 'Shift+Q' }],
  [HotkeyIDs.ScrubberNudgeRight, { order: nextOrder(), label: 'Scrubber Nudge Right', description: 'Nudge the scrubber right', keys: 'E' }],
  [HotkeyIDs.ScrubberNudgeRightPrecise, { order: nextOrder(), label: 'Scrubber Nudge Right (Precise)', description: '', keys: 'Ctrl+E' }],
  [HotkeyIDs.ScrubberNudgeRightFast, { order: nextOrder(), label: 'Scrubber Nudge Right (Fast)', description: '', keys: 'Shift+E' }],
  [
    HotkeyIDs.ScrubberSnapTimestamp,
    { order: nextOrder(), label: 'Scrubber Snap (Timestamp)', description: 'While dragging scrubber: snap to nearest timestamp', keys: 'Ctrl' },
  ],
  [
    HotkeyIDs.ScrubberSnapKeyframe,
    { order: nextOrder(), label: 'Scrubber Snap (Keyframe)', description: 'While dragging scrubber: snap to nearest keyframe', keys: 'Shift' },
  ],

  [
    HotkeyIDs.KeyframesSelectMultiple,
    { order: nextOrder(), label: 'Click Select Multiple Keyframes', description: 'While click selecting: add keyframe to selection', keys: 'Ctrl' },
  ],
  [
    HotkeyIDs.KeyframesSelectRange,
    { order: nextOrder(), label: 'Click Select Keyframe Range', description: 'While click selecting: select a range of keyframes', keys: 'Shift' },
  ],
  [
    HotkeyIDs.KeyframesDragAdditiveSelection,
    { order: nextOrder(), label: 'Drag Select Keyframes (Additive)', description: 'While drag selecting: add keyframes to selection', keys: 'Shift' },
  ],
  [
    HotkeyIDs.KeyframesDragInvertSelection,
    { order: nextOrder(), label: 'Drag Select Keyframes (Invert)', description: 'While drag selecting: invert keyframe selection', keys: 'Ctrl' },
  ],
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
