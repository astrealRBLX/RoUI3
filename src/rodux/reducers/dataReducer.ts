import Rodux from '@rbxts/rodux';
import { Option } from '@rbxts/rust-classes';
import {
  ActionSetCurrentRoot,
  KeyframeValue,
  ActionUpdateKeyframe,
  ActionCreateInstanceProperty,
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

export type DataActions =
  | ActionSetCurrentRoot
  | ActionUpdateKeyframe
  | ActionCreateInstanceProperty;

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

    CreateInstanceProperty: (state, action) => {
      const newState: IDataReducer = { ...state };

      newState.instances.set(action.instance, {
        ...state.instances.get(action.instance),
        properties: new Map([
          ...(state.instances.get(action.instance)
            ? state.instances.get(action.instance)!.properties
            : (new Map() as never)),
          [
            action.property,
            {
              keyframes: [],
            },
          ],
        ]),
      });

      return newState;
    },

    /*
      TODO: Find a better way of doing this...
      Immutable state is hard to work with :(
    */
    UpdateKeyframe: (state, action) => {
      const inst = state.instances.get(action.instance);
      const newState: IDataReducer = {
        ...state,
        instances: new Map([
          ...state.instances,
          [
            action.instance,
            {
              ...inst,
              properties: new Map([
                ...(inst ? inst.properties : (new Map() as never)),
                [
                  action.property,
                  {
                    ...(inst ? inst.properties.get(action.property) : []),
                    keyframes: [
                      ...(inst
                        ? inst.properties.get(action.property)
                          ? inst.properties.get(action.property)!.keyframes
                          : []
                        : []),
                      {
                        position: action.position,
                        value: action.value,
                      },
                    ],
                  },
                ],
              ]),
            },
          ],
        ]),
      };

      return newState;
    },
  }
);
