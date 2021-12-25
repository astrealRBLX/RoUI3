import Llama from '@rbxts/llama';
import Rodux from '@rbxts/rodux';
import { Option } from '@rbxts/rust-classes';
import {
  ActionSetCurrentRoot,
  KeyframeValue,
  ActionUpdateKeyframe,
  ActionCreateInstanceProperty,
  ActionDeleteKeyframes,
} from 'rodux/actions/dataActions';

export interface IDataReducer {
  root: Option<Instance>;
  instances: Instance[];
  properties: Array<Set<string>>;
  keyframes: Array<{
    instance: Instance;
    property: string;
    position: number;
    value: KeyframeValue;
  }>;
}

const initialState: IDataReducer = {
  root: Option.none(),
  instances: [],
  properties: [],
  keyframes: [],
};

export type DataActions =
  | ActionSetCurrentRoot
  | ActionUpdateKeyframe
  | ActionDeleteKeyframes
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
      const instances = [...state.instances];
      const properties = [...state.properties];

      if (!instances.includes(action.instance)) {
        // Add new instance to state & define its properties set
        instances.push(action.instance);
        properties.push(new Set([action.property]));
      } else {
        // Locate existing instance and merge new property into its property set
        const ID = instances.indexOf(action.instance);
        properties[ID] = Llama.Set.union(
          properties[ID],
          new Set([action.property])
        );
      }

      return {
        ...state,
        instances: instances,
        properties: properties,
      };
    },

    UpdateKeyframe: (state, action) => {
      const instances = [...state.instances];
      const properties = [...state.properties];
      const keyframes = [...state.keyframes];

      if (!instances.includes(action.instance)) {
        // Add new instance to state & define its properties set
        instances.push(action.instance);
        properties.push(new Set([action.property]));
      } else {
        // Locate existing instance and merge new property into its property set
        const ID = instances.indexOf(action.instance);
        properties[ID] = Llama.Set.union(
          properties[ID],
          new Set([action.property])
        );
      }

      // Find if a keyframe for the instance's property exists at the same position
      const kf = keyframes.find((value) => {
        return (
          value.instance === action.instance &&
          value.property === action.property &&
          value.position === action.position
        );
      });

      if (kf) {
        // Simply update the value (duplicate positions not allowed)
        kf.value = action.value;
      } else {
        // Otherwise push a new keyframe
        keyframes.push({
          instance: action.instance,
          property: action.property,
          position: action.position,
          value: action.value,
        });
      }

      return {
        ...state,
        instances: instances,
        properties: properties,
        keyframes: keyframes,
      };
    },

    DeleteKeyframes: (state, action) => {
      const instances = [...state.instances];
      const properties = [...state.properties];
      const keyframes = [...state.keyframes];

      // Loop through keyframes deleting them
      action.keyframes.forEach((kfToDelete) => {
        const index = keyframes.findIndex((value) => {
          return (
            value.instance === kfToDelete.instance &&
            value.property === kfToDelete.property &&
            value.position === kfToDelete.position
          );
        });

        if (index !== -1) {
          keyframes.remove(index);
        }
      });

      return {
        ...state,
        instances: instances,
        properties: properties,
        keyframes: keyframes,
      };
    },
  }
);
