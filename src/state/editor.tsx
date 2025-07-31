import { atom, peek } from '@rbxts/charm';
import Immut, { produce } from '@rbxts/immut';
import { EditorStateActions } from './editorActions';

export type KeyframeValue = number | boolean | string | UDim2 | UDim | Vector2 | Color3;

export interface KeyframeData {
  instance: Instance;
  property: string;
  time: number;
  value: KeyframeValue;
  easingStyle: Enum.EasingStyle;
  easingDirection: Enum.EasingDirection;
}

interface ActionDeleteInstanceProperty
  extends Action<'DeleteInstanceProperty'> {
  instance: Instance;
  property: string;
}

export type EditorStateActions =
  | ActionAddInstanceProperty
  | ActionDeleteInstanceProperty;

// Max timeline length (in seconds) setting
export const settingMaxTimelineLength = atom(5);

// Scrubber position (in seconds) setting
export const settingScrubberPosition = atom(1);

// Currently pressed keyboard keys
export const pressedKeys = atom<Set<Enum.KeyCode>>(new Set());

// Active context menu
export const activeContextMenu = atom('');

// Currently selected keyframes
export const selectedKeyframes = atom<KeyframeData[]>([]);

// Animated instances & properties
export const animationRegistry = atom<Map<Instance, AnimationRegistryData>>(
  new Map()
);

// Helper function to fetch a flat array of currently animated instances
export function getInstancesInAnimationRegistry(
  registry: Map<Instance, AnimationRegistryData>
) {
  const instances: Instance[] = [];

  registry.forEach((_, instance) => {
    instances.push(instance);
  });

  return instances;
}

// Function to dispatch complex actions to update editor state
export function dispatchEditorStateUpdate(action: EditorStateActions) {
  switch (action.type) {
    case 'AddInstanceProperty':
      animationRegistry(
        produce(peek(animationRegistry), (draft) => {
          const instance = draft.get(action.instance);

          if (instance === undefined) {
            draft.set(action.instance, {
              properties: new Set([action.property]),
              keyframes: [],
            });
          } else {
            instance.properties.add(action.property);
          }
        })
      );

      break;
    case 'DeleteInstanceProperty':
      animationRegistry(
        produce(peek(animationRegistry), (draft) => {
          const instance = draft.get(action.instance);

          if (instance !== undefined) {
            instance.properties.delete(action.property);
          }
        })
      );

      break;
  }
}
