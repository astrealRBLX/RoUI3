import Rodux from '@rbxts/rodux';

export interface ActionSetTheme extends Rodux.Action<'SetTheme'> {
  theme: StudioTheme;
}
