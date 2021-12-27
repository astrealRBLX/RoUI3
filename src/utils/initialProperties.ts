import { KeyframeValue } from 'rodux/actions/dataActions';
import { getSupportedProperties, SupportedClass } from './supportedProperties';

const initial: Array<{
  instance: Instance;
  property: string;
  value: KeyframeValue;
}> = [];

export const serializeInstance = (ancestor: Instance) => {
  ancestor.GetDescendants().forEach((instance) => {
    if (!instance.IsA('GuiObject')) return;

    const supportedProperties = getSupportedProperties(
      instance.ClassName as SupportedClass
    );

    supportedProperties.forEach((prop) => {
      initial.push({
        instance: instance,
        property: prop,
        // @ts-ignore
        value: instance[prop],
      });
    });
  });
};

export const getInitialProperty = (instance: Instance, property: string) => {
  return initial.find((data) => {
    return data.instance === instance && data.property === property;
  });
};

export const clearProperties = () => {
  initial.clear();
};
