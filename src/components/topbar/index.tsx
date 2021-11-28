import Roact from '@rbxts/roact';
import { Container } from 'components/container';
import { styleColor } from 'utils/studioStyleGuide';
import { useTheme } from 'utils/useTheme';

interface IStateProps {
  theme: StudioTheme;
}

interface IProps extends IStateProps {}

// Topbar component that renders children in a horizontal list
const TopbarComponent = (props: Roact.PropsWithChildren<IProps>) => {
  const { theme } = props;

  return (
    <Container
      Size={new UDim2(1, 0, 0, 30)}
      BackgroundColor3={theme.GetColor(styleColor.TabBar)}
      Padding={3}
    >
      <uicorner CornerRadius={new UDim(0, 4)} />
      <uistroke Color={theme.GetColor(styleColor.Border)} />
      <uilistlayout
        FillDirection={Enum.FillDirection.Horizontal}
        HorizontalAlignment={Enum.HorizontalAlignment.Left}
        VerticalAlignment={Enum.VerticalAlignment.Center}
        Padding={new UDim(0, 5)}
      />
      {props[Roact.Children]}
    </Container>
  );
};

export const Topbar = useTheme()(TopbarComponent);
