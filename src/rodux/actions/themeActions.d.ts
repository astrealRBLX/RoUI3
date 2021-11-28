import Rodux from '@rbxts/rodux';

// Change the app theme
export interface ActionSetTheme extends Rodux.Action<'SetTheme'> {
  theme: StudioTheme;
}
