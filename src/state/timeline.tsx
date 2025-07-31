import { Atom, atom } from '@rbxts/charm';
import { Option } from '@rbxts/rust-classes';

export interface TimestampData {
  time: number;
  position: number;
}

export type ScrubbingData = {
  isScrubbing: boolean; // Is scrubbing
  mouseOffset: number; // Mouse offset
};

export type PreviewData = {
  isPreviewing: boolean; // Is previewing
  previewTime: number; // Start time for a preview
};

// Fake ScreenGui to animate that is used by the editor
export const screenGuiSelection = atom<Option<ScreenGui>>(Option.none());

// Original ScreenGui to animate that is hidden away to preserve state
export const originalScreenGuiSelection = atom<Option<ScreenGui>>(Option.none());

// Current selection in the InstanceTree section
export const instanceTreeSelection = atom<Option<Instance>>(Option.none());

// Currently generated timestamps
export const currentTimestamps = atom<TimestampData[]>([]);

// Data to alter scrubber
export const scrubbingData = atom<ScrubbingData>({ isScrubbing: false, mouseOffset: 0 });

// Is previewing
export const previewData = atom<PreviewData>({ isPreviewing: false, previewTime: 0 });
