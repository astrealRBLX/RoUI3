import { atom } from '@rbxts/charm';

export enum Route {
  StartView,
  EditorView,
}

export const currentRoute = atom(Route.StartView);
