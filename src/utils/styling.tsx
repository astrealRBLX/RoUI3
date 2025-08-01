export const Palette = {
  Background0: Color3.fromRGB(23, 23, 24),
  Background1: Color3.fromRGB(31, 31, 33),
  Background2: Color3.fromRGB(36, 36, 38),
  Background3: Color3.fromRGB(46, 46, 51),
  Background4: Color3.fromRGB(54, 54, 59),

  PrimaryText: Color3.fromRGB(115, 217, 158),
  DefaultText: Color3.fromRGB(161, 161, 161),

  ButtonPrimaryBackground: Color3.fromRGB(92, 191, 222),
  ButtonPrimaryHoveringBackground: Color3.fromRGB(125, 214, 240),
  ButtonDisabledBackground: Color3.fromRGB(89, 89, 89),
  ButtonDisabledText: Color3.fromRGB(69, 69, 69),

  TreeSelectionBackground: Color3.fromRGB(41, 71, 108),
  TreeSelectionHoveringBackground: Color3.fromRGB(61, 102, 150),
  TreeSelectionUnlinkedBackground: Color3.fromRGB(163, 56, 41),
  TreeSelectionUnlinkedHoveringBackground: Color3.fromRGB(156, 79, 69),

  White: new Color3(1, 1, 1),
  Outline: Color3.fromRGB(94, 94, 98),

  Success: Color3.fromRGB(115, 217, 158),
  SuccessHex: '#73d99e',

  Error: Color3.fromRGB(235, 94, 94),
  ErrorHex: '#eb5e5e',
};

export const Fonts = {
  JosefinSans: {
    Regular: new Font(Font.fromEnum(Enum.Font.JosefinSans).Family, Enum.FontWeight.Regular),
    Medium: new Font(Font.fromEnum(Enum.Font.JosefinSans).Family, Enum.FontWeight.Medium),
    SemiBold: new Font(Font.fromEnum(Enum.Font.JosefinSans).Family, Enum.FontWeight.SemiBold),
    Bold: new Font(Font.fromEnum(Enum.Font.JosefinSans).Family, Enum.FontWeight.Bold),
  },
};
