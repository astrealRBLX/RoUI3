import { Atom, atom } from '@rbxts/charm';
import { Option } from '@rbxts/rust-classes';

export interface TimestampData {
  time: number;
  position: number;
}

// Fake ScreenGui to animate that is used by the editor
export const screenGuiSelection: Atom<Option<ScreenGui>> = atom(Option.none());

// Original ScreenGui to animate that is hidden away to preserve state
export const originalScreenGuiSelection: Atom<Option<ScreenGui>> = atom(
  Option.none()
);

// Current selection in the InstanceTree section
export const instanceTreeSelection: Atom<Option<Instance>> = atom(
  Option.none()
);

// Currently pressed keyboard keys
export const pressedKeys: Atom<Set<Enum.KeyCode>> = atom(new Set());

// Currently generated timestamps
export const currentTimestamps = atom<TimestampData[]>([]);
