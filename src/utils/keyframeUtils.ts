import { KeyframeData, KeyframeValue } from 'state/editor';

const keyframeEasingStyleColorMappings = new Map<Enum.EasingStyle, Color3>([
  [Enum.EasingStyle.Linear, Color3.fromRGB(148, 10, 10)],
  [Enum.EasingStyle.Sine, Color3.fromRGB(201, 87, 10)],
  [Enum.EasingStyle.Exponential, Color3.fromRGB(184, 166, 10)],
  [Enum.EasingStyle.Cubic, Color3.fromRGB(13, 181, 41)],
  [Enum.EasingStyle.Quad, Color3.fromRGB(13, 71, 196)],
  [Enum.EasingStyle.Quint, Color3.fromRGB(77, 8, 189)],
  [Enum.EasingStyle.Quart, Color3.fromRGB(158, 3, 179)],
  [Enum.EasingStyle.Circular, Color3.fromRGB(227, 161, 41)],
  [Enum.EasingStyle.Bounce, Color3.fromRGB(199, 18, 138)],
  [Enum.EasingStyle.Back, Color3.fromRGB(0, 181, 156)],
  [Enum.EasingStyle.Elastic, Color3.fromRGB(143, 201, 5)],
]);

export function getKeyframeColorFromEasingStyle(style: Enum.EasingStyle) {
  return keyframeEasingStyleColorMappings.get(style);
}

export function matchKeyframes(kf1: KeyframeData, kf2: KeyframeData) {
  return (
    kf1.instance === kf2.instance &&
    kf1.property === kf2.property &&
    kf1.time === kf2.time &&
    kf1.value === kf2.value &&
    kf1.easingDirection === kf2.easingDirection &&
    kf1.easingStyle === kf2.easingStyle
  );
}

const quickRound = (num: number) => string.format('%.2f', num);

export function getKeyframeValuePrettified(value: KeyframeValue) {
  const dataType = typeOf(value);

  switch (dataType) {
    case 'boolean':
      value = value as boolean;
      return `Boolean(${value})`;
    case 'number':
      value = value as number;
      return `Number(${quickRound(value)})`;
    case 'string':
      value = value as string;
      return `String("${value}")`;
    case 'Vector2':
      value = value as Vector2;
      return `Vector2(${quickRound(value.X)}, ${quickRound(value.Y)})`;
    case 'UDim':
      value = value as UDim;
      return `UDim(${quickRound(value.Scale)}, ${value.Offset})`;
    case 'UDim2':
      value = value as UDim2;
      return `UDim2(${quickRound(value.X.Scale)}, ${value.X.Offset}, ${quickRound(value.Y.Scale)}, ${value.Y.Offset})`;
    default:
      return `${dataType}(${value})`;
  }
}
