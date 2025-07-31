import { KeyframeValue } from './editor';

export interface Action<T = string> {
  type: T;
}

export interface ActionAddInstanceProperty extends Action<'AddInstanceProperty'> {
  instance: Instance;
  property: string;
}

export interface ActionDeleteInstanceProperty extends Action<'DeleteInstanceProperty'> {
  instance: Instance;
  property: string;
}

export interface ActionUpdateKeyframe extends Action<'UpdateKeyframe'> {
  instance: Instance;
  property: string;
  time?: number;
  value?: KeyframeValue;
  easingDirection?: Enum.EasingDirection;
  easingStyle?: Enum.EasingStyle;
}

export interface ActionDeleteKeyframe extends Action<'DeleteKeyframe'> {
  instance: Instance;
  property: string;
  time: number;
}

export type EditorStateActions = ActionAddInstanceProperty | ActionDeleteInstanceProperty | ActionUpdateKeyframe | ActionDeleteKeyframe;
