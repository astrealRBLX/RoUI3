import { Atom, atom } from '@rbxts/charm';
import ReactRoblox from '@rbxts/react-roblox';
import { Option } from '@rbxts/rust-classes';

export const appPlugin = atom<Option<Plugin>>(Option.none());
export const appWidget = atom<Option<DockWidgetPluginGui>>(Option.none());
export const hotkeysWidget = atom<Option<DockWidgetPluginGui>>(Option.none());
export const appTreeAtom = atom<Option<ReactRoblox.Root>>(Option.none());
export const hotkeysTreeAtom = atom<Option<ReactRoblox.Root>>(Option.none());
export const animatingFolder = atom<Option<Folder>>(Option.none());
