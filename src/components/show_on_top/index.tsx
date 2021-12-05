import Roact from '@rbxts/roact';

interface IProps {
  Widget: PluginGui;
  ZIndex?: number;
}

// Component that shows its children at a certain ZIndex
// as a direct child of a PluginGui
export const ShowOnTop: Roact.FunctionComponent<
  Roact.PropsWithChildren<IProps>
> = ({ Widget, ZIndex = 10000, [Roact.Children]: children }) => {
  return (
    <Roact.Portal target={Widget}>
      <frame
        ZIndex={ZIndex}
        Size={UDim2.fromScale(1, 1)}
        BackgroundTransparency={1}
      >
        {children}
      </frame>
    </Roact.Portal>
  );
};
