import { Atom, atom } from '@rbxts/charm';
import { Option } from '@rbxts/rust-classes';

export const screenGuiSelection: Atom<Option<ScreenGui>> = atom(Option.none());
export const instanceTreeSelection: Atom<Option<Instance>> = atom(
  Option.none()
);
