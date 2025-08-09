import { Atom, atom } from '@rbxts/charm';
import { Option } from '@rbxts/rust-classes';

export const appPlugin = atom<Option<Plugin>>(Option.none());
export const appWidget = atom<Option<DockWidgetPluginGui>>(Option.none());
export const animatingFolder = atom<Option<Folder>>(Option.none());
