import { HttpService, ReplicatedStorage, Selection } from '@rbxts/services';
import { animationRegistry, dispatchEditorStateUpdate, KeyframeData, KeyframeValue, settingReusable } from './editor';
import { instanceTreeSelection, originalScreenGuiSelection, screenGuiSelection } from './timeline';
import { ToastManager, ToastType } from './toasts';
import { getCachedValueOfProperty } from './properties';

export type ExportValueString = string;
export type ExportValueNumber = number;
export type ExportValueBoolean = boolean;
export type ExportValueUDim = {
  type: 'UDim';
  scale: number;
  offset: number;
};
export type ExportValueUDim2 = {
  type: 'UDim2';
  x: {
    scale: number;
    offset: number;
  };
  y: {
    scale: number;
    offset: number;
  };
};
export type ExportValueColor3 = {
  type: 'Color3';
  r: number;
  g: number;
  b: number;
};
export type ExportValueVector2 = {
  type: 'Vector2';
  x: number;
  y: number;
};

export type ExportKeyframeValue =
  | ExportValueString
  | ExportValueNumber
  | ExportValueBoolean
  | ExportValueUDim
  | ExportValueUDim2
  | ExportValueColor3
  | ExportValueVector2;

export type ExportKeyframe = {
  property: string;
  time: number;
  value: ExportKeyframeValue;
  easingStyle: number;
  easingDirection: number;
};
// export type ExportTrackData = { [index: string]: ExportKeyframe[] };
export type ExportTrackData = Map<string, ExportKeyframe[]>;

export type ExportOutput = {
  version: string;
  template: boolean;
  tracks: ExportTrackData;
};

export namespace ImportExportManager {
  export const VERSION = '2.0.0';

  export function getInstanceId(instance: Instance) {
    const id = (instance.GetAttribute('_roui3_id') as string) ?? assignInstanceId(instance);

    return id;
  }

  export function assignInstanceId(instance: Instance) {
    const guid = HttpService.GenerateGUID(false);
    instance.SetAttribute('_roui3_id', guid);

    return guid as string;
  }

  export function assignDescendantIds(instance: ScreenGui) {
    instance.GetDescendants().forEach((descendant) => {
      if (descendant.IsA('GuiObject')) {
        if (descendant.GetAttribute('_roui3_id') === undefined) {
          assignInstanceId(descendant);
        }
      }
    });
  }

  export function assignMockScreenGui(instance: ScreenGui) {
    instance.SetAttribute('_roui3_mock', true);
  }

  function serializeValue(value: KeyframeValue): ExportKeyframeValue {
    if (typeIs(value, 'UDim')) {
      return {
        type: 'UDim',
        scale: value.Scale,
        offset: value.Offset,
      } as ExportValueUDim;
    } else if (typeIs(value, 'UDim2')) {
      return {
        type: 'UDim2',
        x: {
          scale: value.X.Scale,
          offset: value.X.Offset,
        },
        y: {
          scale: value.Y.Scale,
          offset: value.Y.Offset,
        },
      } as ExportValueUDim2;
    } else if (typeIs(value, 'Color3')) {
      return {
        type: 'Color3',
        r: value.R,
        g: value.G,
        b: value.B,
      } as ExportValueColor3;
    } else if (typeIs(value, 'Vector2')) {
      return {
        type: 'Vector2',
        x: value.X,
        y: value.Y,
      } as ExportValueVector2;
    }

    return value;
  }

  function deserializeValue(value: ExportKeyframeValue): KeyframeValue {
    if (typeIs(value, 'string') || typeIs(value, 'number') || typeIs(value, 'boolean')) {
      return value;
    } else if (typeIs(value, 'table')) {
      if (value.type === 'UDim') {
        return new UDim(value.scale, value.offset);
      } else if (value.type === 'UDim2') {
        return new UDim2(value.x.scale, value.x.offset, value.y.scale, value.y.offset);
      } else if (value.type === 'Color3') {
        return new Color3(value.r, value.g, value.b);
      } else if (value.type === 'Vector2') {
        return new Vector2(value.x, value.y);
      }
    }

    return value;
  }

  export function importAnimation() {
    const registry = animationRegistry();

    if (registry.size() > 0) {
      ToastManager.addToast({
        type: ToastType.Info,
        message: `<b>Import</b> • Animation data already exists. Importing may override your current animation.`,
        duration: 6,
      });
    }

    const selection = Selection.Get();
    const toImport: ModuleScript[] = [];

    selection.forEach((instance) => {
      if (instance.IsA('ModuleScript')) {
        toImport.push(instance);
      } else {
        ToastManager.addToast({
          type: ToastType.Error,
          message: `<b>Import</b> • Failed to import selection ${instance.Name} of class ${instance.ClassName}!`,
          duration: 6,
        });
      }
    });

    toImport.forEach((moduleInstance) => {
      const clonedInstance = moduleInstance.Clone();
      const data = require(clonedInstance);

      if (!typeIs(data, 'string')) {
        ToastManager.addToast({
          type: ToastType.Error,
          message: `<b>Import</b> • Failed to import ${moduleInstance.Name} as it is not a valid animation.`,
          duration: 6,
        });
      } else {
        const [success, info] = pcall(() => {
          return HttpService.JSONDecode(data);
        });

        if (success) {
          const decodedJsonUnknown = info as { [index: string]: unknown };

          if (decodedJsonUnknown.version !== undefined && decodedJsonUnknown.template !== undefined && decodedJsonUnknown.tracks !== undefined) {
            const decodedJson = info as ExportOutput;

            if (decodedJson.version !== ImportExportManager.VERSION) {
              ToastManager.addToast({
                type: ToastType.Info,
                message: `<b>Import</b> • ${moduleInstance.Name} is from v${decodedJson.version} but RoUI3 is on v${ImportExportManager.VERSION}.`,
                duration: 6,
              });
            }

            if (decodedJson.template) {
              const roui3SelectionOption = instanceTreeSelection();

              if (roui3SelectionOption.isSome()) {
                const roui3Selection = roui3SelectionOption.unwrap();
                const instanceData = registry.get(roui3Selection);
                const track = decodedJson.tracks.get('__template__')!;
                const properties: string[] = [];

                track.forEach((kf) => (!properties.includes(kf.property) ? properties.push(kf.property) : undefined));

                if (instanceData !== undefined) {
                  properties.forEach((property) => {
                    let hasProperty = false;

                    [...instanceData.keyframes].forEach((kf) => {
                      if (kf.property === property) {
                        hasProperty = true;
                        dispatchEditorStateUpdate({
                          type: 'DeleteKeyframe',
                          instance: roui3Selection,
                          property: property,
                          time: kf.time,
                        });
                      }
                    });

                    if (hasProperty) {
                      ToastManager.addToast({
                        type: ToastType.Info,
                        message: `<b>Import</b> • Found overlapping track between ${roui3Selection.Name} and ${moduleInstance.Name}. Replacing ${roui3Selection.Name}'s ${property} track.`,
                        duration: 6,
                      });
                    } else {
                      properties.forEach((property) => {
                        dispatchEditorStateUpdate({
                          type: 'AddInstanceProperty',
                          instance: roui3Selection,
                          property: property,
                        });
                      });
                    }
                  });
                } else {
                  properties.forEach((property) => {
                    dispatchEditorStateUpdate({
                      type: 'AddInstanceProperty',
                      instance: roui3Selection,
                      property: property,
                    });
                  });
                }

                const tracksByProperty: Map<string, ExportKeyframe[]> = new Map();

                properties.forEach((property) => {
                  tracksByProperty.set(property, []);

                  track.forEach((kf) => {
                    if (kf.property === property) {
                      tracksByProperty.set(property, [...tracksByProperty.get(property)!, kf]);
                    }
                  });
                });

                tracksByProperty.forEach((keyframes, property) => {
                  const cachedValue = getCachedValueOfProperty(roui3Selection, property) as KeyframeValue;
                  const values: KeyframeValue[] = [];

                  keyframes.sort((a, b) => {
                    return a.time < b.time;
                  });

                  keyframes.forEach((kf, index) => {
                    if (index === 0) {
                      values[0] = cachedValue;

                      dispatchEditorStateUpdate({
                        type: 'CreateKeyframe',
                        instance: roui3Selection,
                        property: property,
                        time: kf.time,
                        value: cachedValue,
                        easingStyle: Enum.EasingStyle.FromValue(kf.easingStyle)!,
                        easingDirection: Enum.EasingDirection.FromValue(kf.easingDirection)!,
                      });
                    } else {
                      const thisValueDeserialized = deserializeValue(kf.value);
                      const lastValueDeserialized = deserializeValue(keyframes[index - 1].value);
                      let delta: UDim | UDim2 | Vector2;
                      let newValue: UDim | UDim2 | Vector2;
                      let useDelta = false;

                      if (typeIs(thisValueDeserialized, 'UDim')) {
                        useDelta = true;
                        delta = thisValueDeserialized.sub(lastValueDeserialized as UDim);
                        newValue = (values[index - 1] as UDim).add(delta);
                      } else if (typeIs(thisValueDeserialized, 'UDim2')) {
                        useDelta = true;
                        delta = thisValueDeserialized.sub(lastValueDeserialized as UDim2);
                        newValue = (values[index - 1] as UDim2).add(delta);
                      } else if (typeIs(thisValueDeserialized, 'Vector2')) {
                        useDelta = true;
                        delta = thisValueDeserialized.sub(lastValueDeserialized as Vector2);
                        newValue = (values[index - 1] as Vector2).add(delta);
                      }

                      values[index] = useDelta ? newValue! : thisValueDeserialized;

                      dispatchEditorStateUpdate({
                        type: 'CreateKeyframe',
                        instance: roui3Selection,
                        property: property,
                        time: kf.time,
                        value: useDelta ? newValue! : thisValueDeserialized,
                        easingStyle: Enum.EasingStyle.FromValue(kf.easingStyle)!,
                        easingDirection: Enum.EasingDirection.FromValue(kf.easingDirection)!,
                      });
                    }
                  });
                });

                ToastManager.addToast({
                  type: ToastType.Success,
                  message: `<b>Import</b> • Imported ${moduleInstance.Name} into ${roui3Selection.Name}!`,
                  duration: 6,
                });
              } else {
                ToastManager.addToast({
                  type: ToastType.Error,
                  message: `<b>Import</b> • No instance is selected in RoUI3 to import template animation ${moduleInstance.Name} into.`,
                  duration: 6,
                });
              }
            } else {
              const screenGuiOption = screenGuiSelection();

              if (screenGuiOption.isNone()) {
                return;
              }

              const screenGui = screenGuiOption.unwrap();

              decodedJson.tracks.forEach((trackExportKeyframes, trackInstanceId) => {
                const matchedInstance = screenGui.GetDescendants().find((descendant) => descendant.GetAttribute('_roui3_id') === trackInstanceId);

                if (matchedInstance === undefined) {
                  ToastManager.addToast({
                    type: ToastType.Error,
                    message: `<b>Import</b> • Tracks for instance with ID ${trackInstanceId} were not imported as no instance matches as a descendant of the animated ScreenGui.`,
                    duration: 6,
                  });
                  return;
                }

                let instanceData = registry.get(matchedInstance);

                const properties: Set<string> = new Set();

                trackExportKeyframes.forEach((exportKeyframe) => {
                  properties.add(exportKeyframe.property);

                  // Instance hasn't been animated before
                  if (instanceData === undefined) {
                    dispatchEditorStateUpdate({
                      type: 'AddInstanceProperty',
                      instance: matchedInstance,
                      property: exportKeyframe.property,
                    });

                    instanceData = animationRegistry().get(matchedInstance)!;
                  }
                });

                properties.forEach((property) => {
                  // Imported property hasn't been animated before
                  if (!instanceData!.properties.has(property)) {
                    dispatchEditorStateUpdate({
                      type: 'AddInstanceProperty',
                      instance: matchedInstance,
                      property: property,
                    });
                  } else {
                    ToastManager.addToast({
                      type: ToastType.Info,
                      message: `<b>Import</b> • Found overlapping track between ${matchedInstance.Name} and ${moduleInstance.Name}. Replacing ${matchedInstance.Name}'s ${property} track.`,
                      duration: 6,
                    });

                    // Delete all keyframes for previously animated property
                    instanceData!.keyframes.forEach((kf) => {
                      if (kf.property === property) {
                        dispatchEditorStateUpdate({
                          type: 'DeleteKeyframe',
                          instance: matchedInstance,
                          property: kf.property,
                          time: kf.time,
                        });
                      }
                    });
                  }
                });

                // Import keyframes
                trackExportKeyframes.forEach((exportKeyframe) => {
                  dispatchEditorStateUpdate({
                    type: 'CreateKeyframe',
                    instance: matchedInstance,
                    property: exportKeyframe.property,
                    time: exportKeyframe.time,
                    value: deserializeValue(exportKeyframe.value),
                    easingStyle: Enum.EasingStyle.FromValue(exportKeyframe.easingStyle)!,
                    easingDirection: Enum.EasingDirection.FromValue(exportKeyframe.easingDirection)!,
                  });
                });
              });

              ToastManager.addToast({
                type: ToastType.Success,
                message: `<b>Import</b> • Imported ${moduleInstance.Name}!`,
                duration: 6,
              });
            }
          } else {
            ToastManager.addToast({
              type: ToastType.Error,
              message: `<b>Import</b> • Failed to import ${moduleInstance.Name} as it is either not a valid animation or missing fields.`,
              duration: 6,
            });
          }
        } else {
          ToastManager.addToast({
            type: ToastType.Error,
            message: `<b>Import</b> • Failed to import ${moduleInstance.Name}: ${info}.`,
            duration: 6,
          });
        }
      }

      clonedInstance.Destroy();
    });
  }

  function getSerializedOutput() {
    const output: ExportOutput = {
      version: ImportExportManager.VERSION,
      template: false,
      tracks: new Map(),
    };
    const animRegistry = animationRegistry();

    animRegistry.forEach((instanceData, instance) => {
      const instanceKeyframes: ExportKeyframe[] = [];

      instanceData.keyframes.forEach((kf) => {
        instanceKeyframes.push({
          property: kf.property,
          time: kf.time,
          value: serializeValue(kf.value),
          easingStyle: kf.easingStyle.Value,
          easingDirection: kf.easingDirection.Value,
        });
      });

      output.tracks.set(getInstanceId(instance), instanceKeyframes);
    });

    return output;
  }

  function getSerializedOutputsReusable() {
    const animRegistry = animationRegistry();
    const outputs: ExportOutput[] = [];

    animRegistry.forEach((instanceData) => {
      const output: ExportOutput = {
        version: '2.0.0',
        template: true,
        tracks: new Map(),
      };

      const instanceKeyframes: ExportKeyframe[] = [];

      instanceData.keyframes.forEach((kf) => {
        instanceKeyframes.push({
          property: kf.property,
          time: kf.time,
          value: serializeValue(kf.value),
          easingStyle: kf.easingStyle.Value,
          easingDirection: kf.easingDirection.Value,
        });
      });

      output.tracks.set('__template__', instanceKeyframes);
      outputs.push(output);
    });

    return outputs;
  }

  export function exportAll() {
    const isReusable = settingReusable();

    const outputs = isReusable ? getSerializedOutputsReusable() : [getSerializedOutput()];
    const exportModules: ModuleScript[] = [];

    outputs.forEach((output) => {
      const outputJson = HttpService.JSONEncode(output);

      const exportModule = new Instance('ModuleScript');
      exportModule.Name = `${originalScreenGuiSelection().isSome() ? originalScreenGuiSelection().unwrap().Name : ''}RoUI3Animation`;
      exportModule.Source = `--[[\n\tThis is an animation file exported by RoUI3.\n\tFor more information visit our GitHub: https://github.com/astrealRBLX/RoUI3\n\n\tYou can rename this file to whatever you like.\n]]--\n\nreturn '${outputJson}'`;
      exportModule.Parent = ReplicatedStorage;

      exportModules.push(exportModule);
    });

    Selection.Set(exportModules);
  }
}
