import { atom } from '@rbxts/charm';
import { Option } from '@rbxts/rust-classes';

export const appPlugin: Charm.Atom<Option<Plugin>> = atom(Option.none());
export const appWidget: Charm.Atom<Option<DockWidgetPluginGui>> = atom(
  Option.none()
);
