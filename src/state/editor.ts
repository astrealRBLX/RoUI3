import { atom, peek } from '@rbxts/charm';
import Immut, { produce } from '@rbxts/immut';
import { EditorStateActions } from './editorActions';
import { getCachedValueOfProperty, hasPropertyBeenKeyed, setPropertyKeyed } from './properties';

export type KeyframeValue = number | boolean | string | UDim2 | UDim | Vector2 | Color3;

export interface KeyframeData {
  instance: Instance;
  property: string;
  time: number;
  value: KeyframeValue;
  easingStyle: Enum.EasingStyle;
  easingDirection: Enum.EasingDirection;
}

interface AnimationRegistryData {
  properties: Set<string>;
  keyframes: Array<KeyframeData>;
}

export interface DraggingKeyframeData {
  keyframe: KeyframeData;
  oldTime: number;
  newTime: number;
}

// Max timeline length (in seconds) setting
export const settingMaxTimelineLength = atom(5);

// Scrubber position (in seconds) setting
export const settingScrubberPosition = atom(1);

// Auto keyframe setting
export const settingAutoKeyframe = atom(true);

// Internal property change map to prevent cyclical updates when auto keyframing
export const internalPropertyChange = atom<Map<Instance, Set<string>>>(new Map());

export function startInternalPropertyChange(instance: Instance, property: string) {
  const internalMap = new Map([...peek(internalPropertyChange)]);

  if (internalMap.get(instance) === undefined) {
    internalMap.set(instance, new Set([property]));
  } else {
    internalMap.get(instance)?.add(property);
  }

  internalPropertyChange(internalMap);
}

export function finishInternalPropertyChange(instance: Instance, property: string) {
  const internalMap = new Map([...peek(internalPropertyChange)]);

  if (internalMap.get(instance) !== undefined) {
    internalMap.get(instance)?.delete(property);

    if (internalMap.get(instance)?.isEmpty()) {
      internalMap.delete(instance);
    }
  }

  internalPropertyChange(internalMap);
}

// Mute property tracks from recording changes
export const mutedPropertiesAtom = atom<Map<Instance, string[]>>(new Map());

// Sync selections setting
export const settingSyncSelections = atom(true);

// Currently pressed keyboard keys
export const pressedKeys = atom<Set<Enum.KeyCode>>(new Set());

// Active context menu
export const activeContextMenu = atom('');

// Currently selected keyframes
export const selectedKeyframes = atom<KeyframeData[]>([]);

// Dragging keyframes to preview
export const previewKeyframesAtom = atom<DraggingKeyframeData[]>([]);

// Animated instances & properties
export const animationRegistry = atom<Map<Instance, AnimationRegistryData>>(new Map());

// Helper function to fetch a flat array of currently animated instances
export function getInstancesInAnimationRegistry(registry: Map<Instance, AnimationRegistryData>) {
  const instances: Instance[] = [];

  registry.forEach((_, instance) => {
    instances.push(instance);
  });

  return instances;
}

// Function to dispatch complex actions to update editor state
// Dispatching editor state is discouraged as then no history is saved.
// Actions should be executed through the `ActionManager.execute()` method from `history.ts`
// and they will dispatch editor state updates as needed.
export function dispatchEditorStateUpdate(action: EditorStateActions) {
  switch (action.type) {
    case 'AddInstanceProperty':
      animationRegistry(
        produce(peek(animationRegistry), (draft) => {
          const instanceData = draft.get(action.instance);

          if (instanceData === undefined) {
            draft.set(action.instance, {
              properties: new Set([action.property]),
              keyframes: [],
            });
          } else {
            instanceData.properties.add(action.property);
          }
        })
      );

      break;
    case 'DeleteInstanceProperty':
      animationRegistry(
        produce(peek(animationRegistry), (draft) => {
          const instanceData = draft.get(action.instance);

          if (instanceData !== undefined) {
            instanceData.properties.delete(action.property);

            setPropertyKeyed(action.instance, action.property, false);
          }
        })
      );

      break;
    case 'CreateKeyframe':
      animationRegistry(
        produce(peek(animationRegistry), (draft) => {
          const instanceData = draft.get(action.instance);

          if (instanceData !== undefined) {
            Immut.table.insert(instanceData.keyframes, {
              instance: action.instance,
              property: action.property,
              time: action.time,
              value: action.value,
              easingDirection: action.easingDirection,
              easingStyle: action.easingStyle,
            });
          }

          setPropertyKeyed(action.instance, action.property, true);
        })
      );
      break;
    case 'UpdateKeyframe':
      animationRegistry(
        produce(peek(animationRegistry), (draft) => {
          const instanceData = draft.get(action.instance);

          if (instanceData !== undefined) {
            const existingKeyframe = instanceData.keyframes.find((kf) => kf.property === action.property && kf.time === action.time);

            if (existingKeyframe !== undefined) {
              existingKeyframe.value =
                action.value ?? (action.instance[action.property as InstancePropertyNames<typeof action.instance>] as KeyframeValue);
              existingKeyframe.easingDirection = action.easingDirection ?? Enum.EasingDirection.Out;
              existingKeyframe.easingStyle = action.easingStyle ?? Enum.EasingStyle.Quad;
            }
          }
        })
      );

      break;
    case 'DeleteKeyframe':
      animationRegistry(
        produce(peek(animationRegistry), (draft) => {
          const instanceData = draft.get(action.instance);

          if (instanceData !== undefined) {
            const existingKeyframeIndex = instanceData.keyframes.findIndex((kf) => kf.property === action.property && kf.time === action.time);

            if (existingKeyframeIndex !== -1) {
              Immut.table.remove(instanceData.keyframes, existingKeyframeIndex + 1);
            }
          }
        })
      );
      break;
  }
}
