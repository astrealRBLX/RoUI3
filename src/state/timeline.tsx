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

export enum EditorWarnings {
  AutoKeyframeOff,
}

interface EditorWarningInfo {
  name: string;
  description: string;
}

export const editorWarningsInfo = new Map<EditorWarnings, EditorWarningInfo>([
  [EditorWarnings.AutoKeyframeOff, { name: 'Auto-keyframe Off', description: 'Property changes are not being recorded.' }],
]);

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

// Set to the inverse value to force a preview update
export const previewUpdate = atom(true);

// Helper function to force a preview update
export function forceUpdatePreview() {
  previewUpdate((v) => !v);
}

// List of warnings
export const editorWarnings = atom<Set<EditorWarnings>>(new Set());
