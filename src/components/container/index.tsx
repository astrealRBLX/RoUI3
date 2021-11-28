import Roact from '@rbxts/roact';

type MarginPaddingTable = {
  PaddingTop?: number;
  PaddingBottom?: number;
  PaddingLeft?: number;
  PaddingRight?: number;
};

interface IProps {
  AutomaticSize?: Enum.AutomaticSize;
  SizeConstraint?: Enum.SizeConstraint;
  ClipsDescendants?: boolean;
  BackgroundColor3?: Color3;
  ContainerTransparency?: number; // Transparency of container frame
  Active?: boolean;
  Margin?: number | MarginPaddingTable;
  Padding?: number | MarginPaddingTable;
  Size?: UDim2;
  Position?: UDim2;
  InnerBackgroundColor3?: Color3; // Inner container frame background color
  AnchorPoint?: Vector2;
  ZIndex?: number;
  LayoutOrder?: number;
  Visible?: boolean;
  ElementOverride?: Roact.Element; // Override the background container frame
  ExternalChildren?: Roact.Element[]; // External children to rendered in the outer container frame
  ContainerRef?: Roact.Ref<Instance>; // Ref to the external container
  InputBegan?: (rbx: Frame, input: InputObject) => void;
}

const computeMarginPadding = (obj?: number | MarginPaddingTable) => {
  if (!obj) {
    return {
      PaddingTop: new UDim(),
      PaddingBottom: new UDim(),
      PaddingLeft: new UDim(),
      PaddingRight: new UDim(),
    };
  }

  if (typeIs(obj, 'number')) {
    return {
      PaddingTop: new UDim(0, obj),
      PaddingBottom: new UDim(0, obj),
      PaddingLeft: new UDim(0, obj),
      PaddingRight: new UDim(0, obj),
    };
  } else {
    return {
      PaddingTop: new UDim(0, obj.PaddingTop),
      PaddingBottom: new UDim(0, obj.PaddingBottom),
      PaddingLeft: new UDim(0, obj.PaddingLeft),
      PaddingRight: new UDim(0, obj.PaddingRight),
    };
  }
};

export const Container = (props: Roact.PropsWithChildren<IProps>) => {
  const {
    Active,
    AnchorPoint,
    AutomaticSize,
    SizeConstraint,
    BackgroundColor3,
    ContainerTransparency,
    ClipsDescendants,
    ElementOverride,
    LayoutOrder,
    Position,
    Size,
    InnerBackgroundColor3,
    Visible,
    ZIndex,
    ExternalChildren,
    ContainerRef,
    InputBegan,
  } = props;

  const Margin = computeMarginPadding(props.Margin);
  const Padding = computeMarginPadding(props.Padding);

  let ContentSize = UDim2.fromScale(1, 1);
  if (AutomaticSize && Size) ContentSize = Size;

  return (
    ElementOverride ?? (
      <frame
        Ref={ContainerRef as Roact.Ref<Frame>}
        Active={Active}
        AnchorPoint={AnchorPoint}
        AutomaticSize={AutomaticSize}
        SizeConstraint={SizeConstraint}
        LayoutOrder={LayoutOrder}
        Position={Position}
        Size={Size}
        Visible={Visible}
        ZIndex={ZIndex}
        BackgroundColor3={BackgroundColor3}
        BackgroundTransparency={ContainerTransparency}
        BorderSizePixel={0}
      >
        {/* Margin */}
        <uipadding {...Margin} />

        {/* Content */}
        <frame
          BackgroundColor3={InnerBackgroundColor3}
          BackgroundTransparency={InnerBackgroundColor3 ? 0 : 1}
          ClipsDescendants={ClipsDescendants ?? false}
          Size={ContentSize}
          ZIndex={(ZIndex ?? 1) + 1}
          Event={{
            InputBegan: InputBegan,
          }}
        >
          {/* Padding */}
          <uipadding {...Padding} />

          {props[Roact.Children]}
        </frame>

        {ExternalChildren}
      </frame>
    )
  );
};
