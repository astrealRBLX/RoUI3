import Llama from '@rbxts/llama';
import Rodux from '@rbxts/rodux';
import { Option } from '@rbxts/rust-classes';
import {
  ActionSetCurrentRoot,
  KeyframeValue,
  ActionUpdateKeyframe,
  ActionCreateInstanceProperty,
  ActionDeleteKeyframes,
  ActionDeleteInstanceProperty,
  KeyframeKind,
} from 'rodux/actions/dataActions';

export interface IKeyframe {
  instance: Instance;
  property: string;
  position: number;
  value: KeyframeValue;
  kind: KeyframeKind;
  kindData: {
    easingStyle: Enum.EasingStyle;
    easingDirection: Enum.EasingDirection;
    dampingRatio: number;
    frequency: number;
  };
}

export interface IDataReducer {
  root: Option<Instance>;
  originalRoot: Option<Instance>;
  instances: Instance[];
  properties: Array<Set<string>>;
  keyframes: Array<IKeyframe>;
}

const initialState: IDataReducer = {
  root: Option.none(),
  originalRoot: Option.none(),
  instances: [],
  properties: [],
  keyframes: [],
};

export type DataActions =
  | ActionSetCurrentRoot
  | ActionUpdateKeyframe
  | ActionDeleteKeyframes
  | ActionCreateInstanceProperty
  | ActionDeleteInstanceProperty;

export const dataReducer = Rodux.createReducer<IDataReducer, DataActions>(
  initialState,
  {
    SetCurrentRoot: (state, action) => {
      return {
        ...state,
        root:
          action.root !== undefined ? Option.some(action.root) : Option.none(),
        originalRoot:
          action.originalRoot !== undefined
            ? Option.some(action.originalRoot)
            : Option.none(),
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
        // Simply update necessary data
        kf.value = action.value;
        kf.kind = action.kind ?? kf.kind;
        kf.kindData.easingStyle = action.easingStyle ?? kf.kindData.easingStyle;
        kf.kindData.easingDirection =
          action.easingDirection ?? kf.kindData.easingDirection;
        kf.kindData.dampingRatio =
          action.dampingRatio ?? kf.kindData.dampingRatio;
        kf.kindData.frequency = action.frequency ?? kf.kindData.frequency;
      } else {
        const kind = action.kind ?? 'Tween';

        // Otherwise push a new keyframe
        keyframes.push({
          instance: action.instance,
          property: action.property,
          position: action.position,
          value: action.value,
          kind: kind,
          kindData: {
            easingStyle: action.easingStyle ?? Enum.EasingStyle.Linear,
            easingDirection:
              action.easingDirection ?? Enum.EasingDirection.InOut,
            dampingRatio: action.dampingRatio ?? 1,
            frequency: action.frequency ?? 5,
          },
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
        keyframes: keyframes,
      };
    },

    DeleteInstanceProperty: (state, action) => {
      const properties = [...state.properties];
      const keyframes = [...state.keyframes];

      const ID = state.instances.indexOf(action.instance);

      // Delete all property keyframes
      keyframes.forEach((kf, index) => {
        if (
          kf.instance === action.instance &&
          kf.property === action.property
        ) {
          keyframes.remove(index);
        }
      });

      // Remove the property
      properties[ID].delete(action.property);

      return {
        ...state,
        properties: properties,
        keyframes: keyframes,
      };
    },
  }
);
