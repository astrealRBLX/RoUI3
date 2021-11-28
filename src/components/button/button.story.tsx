import Roact from '@rbxts/roact';
import RoactRodux from '@rbxts/roact-rodux';
import { AppStore } from 'rodux/store';
import { Button, ButtonStyle } from '.';

export = (preview: Instance) => {
  const tree = Roact.mount(
    <RoactRodux.StoreProvider store={AppStore}>
      <>
        <Button
          Text={'Primary'}
          Style={ButtonStyle.Primary}
          AnchorPoint={new Vector2(0.5, 0.5)}
          Size={new UDim2(0.1, 0, 0.1, 0)}
          Position={UDim2.fromScale(0.1, 0.1)}
          PaddingY={new UDim(0, 4)}
          PaddingX={new UDim(0, 8)}
          MaxTextSize={18}
          MinTextSize={8}
          OnActivated={() => {}}
        />
        <Button
          Text={'Standard'}
          Style={ButtonStyle.Standard}
          AnchorPoint={new Vector2(0.5, 0.5)}
          Size={new UDim2(0.1, 0, 0.1, 0)}
          Position={UDim2.fromScale(0.1, 0.25)}
          PaddingY={new UDim(0, 4)}
          PaddingX={new UDim(0, 8)}
          MaxTextSize={18}
          MinTextSize={8}
          OnActivated={() => {}}
        />
        <Button
          Text={'Disabled'}
          Style={ButtonStyle.Primary}
          Disabled
          AnchorPoint={new Vector2(0.5, 0.5)}
          Size={new UDim2(0.1, 0, 0.1, 0)}
          Position={UDim2.fromScale(0.1, 0.4)}
          PaddingY={new UDim(0, 4)}
          PaddingX={new UDim(0, 8)}
          MaxTextSize={18}
          MinTextSize={8}
          OnActivated={() => {}}
        />
      </>
    </RoactRodux.StoreProvider>,
    preview
  );

  return () => {
    Roact.unmount(tree);
  };
};
