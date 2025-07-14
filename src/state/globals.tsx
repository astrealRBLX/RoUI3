import { atom } from '@rbxts/charm';
import { Option } from '@rbxts/rust-classes';

export const appPlugin: Charm.Atom<Option<Plugin>> = atom(Option.none());
