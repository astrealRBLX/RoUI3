import { getAnimatableProperties, SupportedClass } from 'utils/animatableProperties';
import { isValidAnimatableSelection } from 'utils/selectionUtils';

const instancePropertyCache = new Map<Instance, Map<string, unknown>>();
const initallyKeyedProperties = new Map<Instance, Map<string, boolean>>();

export function cacheInstanceProperties(root: Instance) {
  root.GetDescendants().forEach((descendant) => {
    if (descendant.IsA('GuiObject')) {
      instancePropertyCache.set(descendant, new Map());
      initallyKeyedProperties.set(descendant, new Map());

      getAnimatableProperties(descendant.ClassName as SupportedClass).forEach((property) => {
        instancePropertyCache.get(descendant)!.set(property, descendant[property as InstancePropertyNames<typeof descendant>]);
        initallyKeyedProperties.get(descendant)!.set(property, false);
      });
    }
  });
}

export function getCachedValueOfProperty(instance: Instance, property: string) {
  return instancePropertyCache.get(instance)?.get(property);
}

export function clearCache() {
  instancePropertyCache.clear();
  initallyKeyedProperties.clear();
}

export function setPropertyKeyed(instance: Instance, property: string) {
  initallyKeyedProperties.get(instance)!.set(property, true);
}

export function hasPropertyBeenKeyed(instance: Instance, property: string) {
  return initallyKeyedProperties.get(instance)?.get(property);
}
