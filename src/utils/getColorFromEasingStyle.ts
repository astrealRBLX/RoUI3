const STYLE_COLORS = new Map<Enum.EasingStyle, Color3>([
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

export default (style: Enum.EasingStyle) => {
  return STYLE_COLORS.get(style);
};
