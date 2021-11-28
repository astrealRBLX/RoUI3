import Roact from '@rbxts/roact';
import RoactHooks from '@rbxts/roact-hooks';
import { Container } from 'components/container';
import { styleColor, styleMod } from 'utils/studioStyleGuide';
import { useTheme } from 'utils/useTheme';
import { IRow } from '.';

interface IStateProps {
  theme: StudioTheme;
}

interface IProps extends IStateProps {
  Row: IRow;
  OnToggled: (row: IRow) => void;
  OnSelected: (row: IRow) => void;
  IsExpanded: boolean;
  IsSelected: boolean;
}

const StudioService = game.GetService('StudioService');

const TreeRowComponent: RoactHooks.FC<IProps> = (
  { theme, Row, IsSelected, IsExpanded, OnToggled, OnSelected },
  { useState }
) => {
  const [isHovering, setHovering] = useState(false);

  const hasChildren = Row.item.GetChildren().size() > 0;
  const indent = Row.depth * 10;
  const iconInfo = StudioService.GetClassIcon(Row.item.ClassName) as {
    Image: string;
    ImageRectOffset: Vector2;
    ImageRectSize: Vector2;
  };
  const padding = 5;
  const arrowSize = 12;
  const actualIconSize = 14;
  const labelOffset = indent + arrowSize + 2 * padding;
  // const textOffset = iconInfo.ImageRectSize.X + 3 * padding;
  const textOffset = actualIconSize + 2 * padding;

  return (
    <Container
      Size={new UDim2(1, -indent, 0, 18)}
      LayoutOrder={Row.index}
      ContainerTransparency={1}
    >
      {hasChildren ? (
        <imagebutton
          Image={'rbxasset://textures/StudioSharedUI/arrowSpritesheet.png'}
          ImageColor3={theme.GetColor(styleColor.MainText)}
          ImageRectSize={new Vector2(arrowSize, arrowSize)}
          ImageRectOffset={IsExpanded ? new Vector2(24, 0) : new Vector2(12, 0)}
          Position={new UDim2(0, indent + padding, 0.5, 0)}
          AnchorPoint={new Vector2(0, 0.5)}
          Size={new UDim2(0, arrowSize, 0, arrowSize)}
          BackgroundTransparency={1}
          Event={{
            Activated: () => {
              OnToggled(Row);
            },
          }}
        ></imagebutton>
      ) : undefined}
      <frame
        Event={{
          MouseEnter: () => {
            setHovering(true);
          },
          MouseLeave: () => {
            setHovering(false);
          },
          InputBegan: (_, input) => {
            if (input.UserInputType === Enum.UserInputType.MouseButton1) {
              OnSelected(Row);
            }
          },
        }}
        BackgroundTransparency={isHovering || IsSelected ? 0 : 1}
        BackgroundColor3={
          IsSelected
            ? theme.GetColor(styleColor.DialogMainButton)
            : theme.GetColor(styleColor.Button, styleMod.Hover)
        }
        BorderSizePixel={0}
        Position={UDim2.fromOffset(labelOffset, 0)}
        Size={new UDim2(1, -arrowSize, 1, 0)}
      >
        <imagelabel
          Size={UDim2.fromOffset(
            actualIconSize, // iconInfo.ImageRectSize.X / 1.2,
            actualIconSize // iconInfo.ImageRectSize.Y / 1.2
          )}
          BackgroundTransparency={1}
          Image={iconInfo.Image}
          ImageRectSize={iconInfo.ImageRectSize}
          ImageRectOffset={iconInfo.ImageRectOffset}
          Position={new UDim2(0, padding, 0.5, 0)}
          AnchorPoint={new Vector2(0, 0.5)}
        />

        <textlabel
          Text={Row.item.Name}
          TextColor3={
            IsSelected
              ? theme.GetColor(styleColor.DialogMainButtonText)
              : theme.GetColor(styleColor.MainText)
          }
          Size={new UDim2(1, -textOffset, 1, 0)}
          Position={new UDim2(0, textOffset, 0, 0)}
          TextXAlignment={Enum.TextXAlignment.Left}
          TextYAlignment={Enum.TextYAlignment.Center}
          TextSize={16}
          Font={Enum.Font.SourceSans}
          BackgroundTransparency={1}
        />
      </frame>
    </Container>
  );
};

export const TreeRow = useTheme()(new RoactHooks(Roact)(TreeRowComponent));
