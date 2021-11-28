import Rodux from '@rbxts/rodux';

export interface ActionSetCurrentRoot extends Rodux.Action<'SetCurrentRoot'> {
  root: Instance | undefined;
}

export interface ActionUpdateKeyframe extends Rodux.Action<'UpdateKeyframe'> {
  instance: Instance;
  property: string;
  position: number;
  value: KeyframeValue;
}

export type KeyframeValue = number | boolean | UDim2 | UDim | Vector2 | Color3;
