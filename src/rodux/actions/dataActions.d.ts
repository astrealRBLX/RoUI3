import Rodux from '@rbxts/rodux';

// Changes the root of the app's instance tree
export interface ActionSetCurrentRoot extends Rodux.Action<'SetCurrentRoot'> {
  root: Instance | undefined;
}

// Creates a new property on an instance or overrides an existing one
export interface ActionCreateInstanceProperty
  extends Rodux.Action<'CreateInstanceProperty'> {
  instance: Instance;
  property: string;
}

// Updates a keyframe's data in the store
// Creates a new keyframe if none exists or overwrites an existing one
export interface ActionUpdateKeyframe extends Rodux.Action<'UpdateKeyframe'> {
  instance: Instance;
  property: string;
  position: number;
  value: KeyframeValue;
}

export type KeyframeValue = number | boolean | UDim2 | UDim | Vector2 | Color3;
