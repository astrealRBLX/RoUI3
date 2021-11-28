import Rodux from '@rbxts/rodux';
import { Option } from '@rbxts/rust-classes';
import {
  ActionSetCurrentRoot,
  KeyframeValue,
  ActionUpdateKeyframe,
} from 'rodux/actions/dataActions';

export type InstanceData = Map<
  Instance,
  {
    properties: Map<
      string,
      {
        keyframes: Array<{
          position: number;
          value: KeyframeValue;
        }>;
      }
    >;
  }
>;

export interface IDataReducer {
  root: Option<Instance>;
  instances: InstanceData;
}

const initialState: IDataReducer = {
  root: Option.none(),
  instances: new Map(),
};

export type DataActions = ActionSetCurrentRoot | ActionUpdateKeyframe;

export const dataReducer = Rodux.createReducer<IDataReducer, DataActions>(
  initialState,
  {
    SetCurrentRoot: (state, action) => {
      return {
        ...state,
        root:
          action.root !== undefined ? Option.some(action.root) : Option.none(),
      };
    },
    /*
      TODO: Find a better way of doing this...
      Immutable state is hard to work with :(
    */
    UpdateKeyframe: (state, action) => {
      const newState: IDataReducer = {
        ...state,
        instances: new Map([
          ...state.instances,
          [
            action.instance,
            {
              ...state.instances.get(action.instance),
              properties: new Map(),
            },
          ],
        ]),
      };

      const existingInstance = state.instances.get(action.instance);
      if (existingInstance) {
        newState.instances.get(action.instance)!.properties = new Map([
          ...existingInstance.properties,
          [
            action.property,
            {
              keyframes: [],
            },
          ],
        ]);

        const existingProperty = existingInstance.properties.get(
          action.property
        );
        if (existingProperty) {
          newState.instances
            .get(action.instance)!
            .properties.set(action.property, {
              ...existingProperty,
              keyframes: [...existingProperty.keyframes],
            });

          const keyframeIndex = existingProperty.keyframes.findIndex(
            (keyframe) => {
              return keyframe.position === action.position;
            }
          );

          if (keyframeIndex !== -1) {
            newState.instances
              .get(action.instance)!
              .properties.get(action.property)!.keyframes[keyframeIndex] = {
              position: action.position,
              value: action.value,
            };
          } else {
            newState.instances
              .get(action.instance)!
              .properties.get(action.property)!
              .keyframes.push({
                position: action.position,
                value: action.value,
              });
          }
        } else {
          newState.instances
            .get(action.instance)!
            .properties.set(action.property, {
              keyframes: [
                {
                  position: action.position,
                  value: action.value,
                },
              ],
            });
        }
      } else {
        newState.instances.set(action.instance, {
          properties: new Map([
            [
              action.property,
              {
                keyframes: [
                  {
                    position: action.position,
                    value: action.value,
                  },
                ],
              },
            ],
          ]),
        });
      }

      return newState;
    },
  }
);
