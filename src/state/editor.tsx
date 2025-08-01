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

interface AnimationRegistryData {
  properties: Set<string>;
  keyframes: Array<KeyframeData>;
}

// Max timeline length (in seconds) setting
export const settingMaxTimelineLength = atom(5);

// Scrubber position (in seconds) setting
export const settingScrubberPosition = atom(1);

// Sync selections setting
export const settingSyncSelections = atom(true);

// Currently pressed keyboard keys
export const pressedKeys = atom<Set<Enum.KeyCode>>(new Set());

// Active context menu
export const activeContextMenu = atom('');

// Currently selected keyframes
export const selectedKeyframes = atom<KeyframeData[]>([]);

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

            const newKeyframes = instanceData.keyframes.filter((kf) => kf.property !== action.property);

            instanceData.keyframes = newKeyframes;
          }
        })
      );

      break;
    case 'UpdateKeyframe':
      animationRegistry(
        produce(peek(animationRegistry), (draft) => {
          const instanceData = draft.get(action.instance);
          const scrubberPositionUnformatted = peek(settingScrubberPosition);
          const scrubberPosition = tonumber(string.format('%.2f', scrubberPositionUnformatted))!;

          if (instanceData !== undefined) {
            const existingKeyframe = instanceData.keyframes.find(
              (kf) => kf.property === action.property && kf.time === (action.time ?? scrubberPosition)
            );

            if (existingKeyframe === undefined) {
              // Add keyframe at position 0 of initial property's value if it doesn't exist
              if (!hasPropertyBeenKeyed(action.instance, action.property)) {
                Immut.table.insert(instanceData.keyframes, {
                  instance: action.instance,
                  property: action.property,
                  time: 0,
                  value: getCachedValueOfProperty(action.instance, action.property) as KeyframeValue,
                  easingDirection: Enum.EasingDirection.Out,
                  easingStyle: Enum.EasingStyle.Quad,
                });

                setPropertyKeyed(action.instance, action.property);
              }

              Immut.table.insert(instanceData.keyframes, {
                instance: action.instance,
                property: action.property,
                time: action.time ?? scrubberPosition,
                value: action.value ?? (action.instance[action.property as never] as KeyframeValue),
                easingDirection: action.easingDirection ?? Enum.EasingDirection.Out,
                easingStyle: action.easingStyle ?? Enum.EasingStyle.Quad,
              });
            } else {
              existingKeyframe.value = action.instance[action.property as never] as KeyframeValue;
              existingKeyframe.easingDirection = action.easingDirection ?? existingKeyframe.easingDirection;
              existingKeyframe.easingStyle = action.easingStyle ?? existingKeyframe.easingStyle;
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
