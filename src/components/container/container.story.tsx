import Roact from '@rbxts/roact';
import RoactRodux from '@rbxts/roact-rodux';
import { Container } from '.';

export = (preview: Instance) => {
  const tree = Roact.mount(
    <frame
      BackgroundColor3={new Color3(0.5, 0.5, 0.5)}
      Size={new UDim2(1, 0, 1, 0)}
    >
      <Container
        BackgroundColor3={new Color3(0.2, 0.8, 0.4)}
        Size={new UDim2(0.4, 0, 0.5, 0)}
        Padding={15}
        Margin={5}
      >
        <textlabel Text={'Hello world!'} Size={new UDim2(1, 0, 1, 0)} />
      </Container>
    </frame>,
    preview
  );

  return () => {
    Roact.unmount(tree);
  };
};
