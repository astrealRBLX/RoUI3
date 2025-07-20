import { Atom, atom } from '@rbxts/charm';
import { Option } from '@rbxts/rust-classes';

export const appPlugin: Atom<Option<Plugin>> = atom(Option.none());
export const appWidget: Atom<Option<DockWidgetPluginGui>> = atom(Option.none());
export const animatingFolder: Atom<Option<Folder>> = atom(Option.none());
