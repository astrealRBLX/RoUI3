const sharedProperties = [
  'AnchorPoint',
  'BackgroundColor3',
  'BackgroundTransparency',
  'BorderColor3',
  'BorderSizePixel',
  'ClipsDescendants',
  'LayoutOrder',
  'Position',
  'Size',
  'Rotation',
  'Visible',
  'ZIndex',
];

export const getSupportedProperties = (
  className:
    | 'ImageButton'
    | 'TextButton'
    | 'ScrollingFrame'
    | 'TextLabel'
    | 'ImageLabel'
    | 'Frame'
    | 'TextBox'
) => {
  switch (className) {
    case 'ImageButton':
      return [...sharedProperties];
    case 'TextButton':
      return [...sharedProperties];
    case 'ScrollingFrame':
      return [...sharedProperties];
    case 'TextLabel':
      return [...sharedProperties];
    case 'ImageLabel':
      return [...sharedProperties];
    case 'Frame':
      return [...sharedProperties, 'Bob'];
    case 'TextBox':
      return [...sharedProperties];
    default:
      return [];
  }
};
