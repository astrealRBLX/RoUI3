export const Pallete = {
  Background1: new Color3(0.18, 0.18, 0.2),
  Background2: new Color3(0.21, 0.21, 0.23),

  PrimaryText: new Color3(0.45, 0.85, 0.62),
  DefaultText: new Color3(0.63, 0.63, 0.63),

  ButtonPrimaryBackground: new Color3(0.36, 0.75, 0.87),
  ButtonDisabledBackground: new Color3(0.35, 0.35, 0.35),
  ButtonDisabledText: new Color3(0.27, 0.27, 0.27),

  White: new Color3(1, 1, 1),
};

export const Fonts = {
  JosefinSans: {
    Regular: new Font(
      Font.fromEnum(Enum.Font.JosefinSans).Family,
      Enum.FontWeight.Regular
    ),
    Bold: new Font(
      Font.fromEnum(Enum.Font.JosefinSans).Family,
      Enum.FontWeight.Bold
    ),
  },
};
