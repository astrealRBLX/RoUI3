export type SupportedClass =
  | 'ImageButton'
  | 'TextButton'
  | 'ScrollingFrame'
  | 'TextLabel'
  | 'ImageLabel'
  | 'Frame'
  | 'TextBox';

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

const textProperties = [
  'Text',
  'TextSize',
  'TextScaled',
  'TextColor3',
  'RichText',
  'TextStrokeColor3',
  'TextWrapped',
  'Text',
];

const imageProperties = [
  'Image',
  'ImageColor3',
  'ImageColor3',
  'ImageTransparency',
];

// Resolves supported timeline properties based on instance class
export const getSupportedProperties = (className: SupportedClass) => {
  switch (className) {
    case 'TextLabel':
      return [...sharedProperties, ...textProperties];
    case 'TextButton':
      return [...sharedProperties, ...textProperties];
    case 'TextBox':
      return [...sharedProperties, ...textProperties];
    case 'ImageButton':
      return [...sharedProperties, ...imageProperties, 'HoverImage'];
    case 'ImageLabel':
      return [...sharedProperties, ...imageProperties];
    case 'Frame':
      return [...sharedProperties];
    case 'ScrollingFrame':
      return [
        ...sharedProperties,
        'BottomImage',
        'CanvasPosition',
        'CanvasSize',
        'MidImage',
        'ScrollBarImageColor3',
        'ScrollBarImageTransparency',
        'ScrollBarThickness',
        'ScrollingEnabled',
        'TopImage',
      ];
    default:
      return [];
  }
};
