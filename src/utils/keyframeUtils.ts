import { KeyframeData, KeyframeValue } from 'state/editor';

const keyframeEasingStyleColorMappings = new Map<Enum.EasingStyle, Color3>([
  [Enum.EasingStyle.Linear, Color3.fromRGB(232, 148, 148)],
  [Enum.EasingStyle.Sine, Color3.fromRGB(230, 176, 143)],
  [Enum.EasingStyle.Exponential, Color3.fromRGB(232, 222, 135)],
  [Enum.EasingStyle.Cubic, Color3.fromRGB(102, 232, 122)],
  [Enum.EasingStyle.Quad, Color3.fromRGB(122, 158, 230)],
  [Enum.EasingStyle.Quint, Color3.fromRGB(161, 122, 219)],
  [Enum.EasingStyle.Quart, Color3.fromRGB(214, 112, 227)],
  [Enum.EasingStyle.Circular, Color3.fromRGB(227, 179, 87)],
  [Enum.EasingStyle.Bounce, Color3.fromRGB(217, 107, 181)],
  [Enum.EasingStyle.Back, Color3.fromRGB(120, 235, 219)],
  [Enum.EasingStyle.Elastic, Color3.fromRGB(207, 242, 122)],
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
