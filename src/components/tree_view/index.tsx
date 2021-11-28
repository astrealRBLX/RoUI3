import Roact, { setGlobalConfig } from '@rbxts/roact';
import { Container } from 'components/container';
import { styleColor } from 'utils/studioStyleGuide';
import { useTheme } from 'utils/useTheme';
import { TreeRow } from './tree_row';

interface IStateProps {
  theme: StudioTheme;
}

interface IProps extends IStateProps {
  Size: UDim2;
  RootItem: Instance; // Root item of the tree
  Expanded: Set<Instance>; // Instances to render as expanded
  Selected?: Instance; // Instance to render as selected
  OnSelectionChange: (items: Instance) => void; // Called when selection is changed
  OnExpansionChange: (item: Instance, newState: boolean) => void; // Called when expansion is changed
  BaseClass?: keyof Instances; // Filter instances that are only this class
}

export interface IRow {
  index: number;
  depth: number;
  item: Instance;
}

interface IState {
  rows: IRow[];
}

// Nasty class component is needed here :(
class TreeViewComponent extends Roact.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.setState({
      rows: [],
    });
  }

  // Renders a row in the tree
  renderRow = (row: IRow, key: string) => {
    const isSelected = this.props.Selected === row.item;
    const isExpanded = this.props.Expanded.has(row.item);

    return (
      <TreeRow
        Key={key}
        IsSelected={isSelected}
        IsExpanded={isExpanded}
        Row={row}
        OnToggled={(latestRow) => {
          if (this.props.Expanded.has(latestRow.item)) {
            this.props.OnExpansionChange(latestRow.item, false);
          } else {
            this.props.OnExpansionChange(latestRow.item, true);
          }
        }}
        OnSelected={(latestRow) => {
          this.props.OnSelectionChange(latestRow.item);
        }}
      ></TreeRow>
    );
  };

  // Contribute an item to the tree
  contributeItem = (
    item: Instance,
    depth: number,
    existingRows: IRow[]
  ): IRow[] => {
    existingRows.push({
      index: existingRows.size() + 1,
      depth: depth,
      item: item,
    });

    if (this.props.Expanded.has(item)) {
      const children = item.GetChildren();
      children.forEach((child) => {
        if (!child.IsA(this.props.BaseClass ?? 'Instance')) return;
        this.contributeItem(child, depth + 1, existingRows);
      });
    }

    return existingRows;
  };

  // Calculate rows with an optional check for prop changes (prevent an overflow)
  calculateRows = (prevProps?: IProps) => {
    const props = this.props;
    if (prevProps) {
      if (
        props.RootItem === prevProps.RootItem &&
        props.Expanded === prevProps.Expanded &&
        props.Selected === prevProps.Selected
      ) {
        return;
      }
    }
    this.setState({
      rows: this.contributeItem(this.props.RootItem, 0, []),
    });
  };

  didMount() {
    this.calculateRows();
  }

  didUpdate(prevProps: IProps) {
    this.calculateRows(prevProps);
  }

  render() {
    const children: Roact.Element[] = [];
    this.state.rows.forEach((row, index) => {
      const key = `${row.item.Name}#${tostring(index)}`;
      children.push(this.renderRow(row, key));
    });

    // print(this.state.rows);

    return (
      <Container Padding={2} Size={this.props.Size} ContainerTransparency={1}>
        <scrollingframe
          Size={UDim2.fromScale(1, 1)}
          CanvasSize={UDim2.fromScale(0, 0)}
          ScrollingDirection={Enum.ScrollingDirection.Y}
          AutomaticCanvasSize={Enum.AutomaticSize.Y}
          BorderSizePixel={0}
          ScrollBarThickness={3}
          ScrollBarImageColor3={this.props.theme.GetColor(
            styleColor.ScrollBarBackground
          )}
          BackgroundTransparency={1}
        >
          <uilistlayout
            FillDirection={Enum.FillDirection.Vertical}
            SortOrder={Enum.SortOrder.LayoutOrder}
            Padding={new UDim(0, 4)}
          />
          {...children}
        </scrollingframe>
      </Container>
    );
  }
}

export const TreeView = useTheme()(TreeViewComponent);
