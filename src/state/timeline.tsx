import { Atom, atom } from '@rbxts/charm';
import { Option } from '@rbxts/rust-classes';

export interface TimestampData {
  time: number;
  position: number;
}

// Fake ScreenGui to animate that is used by the editor
export const screenGuiSelection = atom<Option<ScreenGui>>(Option.none());

// Original ScreenGui to animate that is hidden away to preserve state
export const originalScreenGuiSelection = atom<Option<ScreenGui>>(Option.none());

// Current selection in the InstanceTree section
export const instanceTreeSelection = atom<Option<Instance>>(Option.none());

// Currently generated timestamps
export const currentTimestamps = atom<TimestampData[]>([]);
