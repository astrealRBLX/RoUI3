import Roact from '@rbxts/roact';
import RoactHooks from '@rbxts/roact-hooks';
import { Dropdown } from 'components/dropdown';
import { Tooltip } from 'components/tooltip';
import { styleColor, styleMod } from 'utils/studioStyleGuide';
import { useTheme } from 'utils/useTheme';

interface IStateProps {
  theme: StudioTheme;
}

interface IProps extends IStateProps {
  Widget: PluginGui;
  Image: string;
  ButtonCallback: () => void;
  ButtonTooltip: string;
  DropdownOpen: boolean;
  DropdownSelection: string;
  DropdownTooltip: string;
  DropdownOptions: string[];
  DropdownSelectedCallback: (option: string) => void;
  DropdownClickCallback: () => void;
}

// Tooltip component that acts as a child of another component
// to display some helpful text on hover
const PairedDropdownComponent: RoactHooks.FC<Roact.PropsWithChildren<IProps>> =
  (
    {
      theme,
      Widget,
      Image,
      ButtonCallback,
      ButtonTooltip,
      DropdownOpen,
      DropdownSelection,
      DropdownTooltip,
      DropdownOptions,
      DropdownSelectedCallback,
      DropdownClickCallback,
    },
    { useState, useValue, useCallback, useEffect }
  ) => {
    return (
      <frame
        Size={new UDim2(0, 0, 1, 0)}
        BorderSizePixel={0}
        BackgroundColor3={theme.GetColor(styleColor.Button)}
        AutomaticSize={Enum.AutomaticSize.X}
      >
        <uipadding
          PaddingLeft={new UDim(0, 4)}
          PaddingRight={new UDim(0, 4)}
          PaddingTop={new UDim(0, 1)}
          PaddingBottom={new UDim(0, 1)}
        />
        <uicorner CornerRadius={new UDim(0, 4)} />
        <uilistlayout
          FillDirection={Enum.FillDirection.Horizontal}
          HorizontalAlignment={Enum.HorizontalAlignment.Left}
          VerticalAlignment={Enum.VerticalAlignment.Center}
          Padding={new UDim(0, 4)}
        />

        <imagebutton
          AnchorPoint={new Vector2(0, 0.5)}
          Position={new UDim2(0, 0, 0.5, 0)}
          Size={new UDim2(0, 20, 0, 20)}
          Image={Image}
          BackgroundTransparency={0}
          BackgroundColor3={theme.GetColor(
            styleColor.RibbonButton,
            styleMod.Hover
          )}
          AutoButtonColor={false}
          BorderSizePixel={0}
          Event={{
            MouseEnter: (rbx) => {
              rbx.BackgroundColor3 = theme.GetColor(styleColor.RibbonButton);
            },
            MouseLeave: (rbx) => {
              rbx.BackgroundColor3 = theme.GetColor(
                styleColor.RibbonButton,
                styleMod.Hover
              );
            },
            Activated: ButtonCallback,
          }}
        >
          <uicorner CornerRadius={new UDim(0, 4)} />
          <Tooltip Text={ButtonTooltip} Widget={Widget} />
        </imagebutton>
        <Dropdown
          Open={DropdownOpen}
          AnchorPoint={new Vector2(0, 0.5)}
          Position={new UDim2(0, 35, 0.5, 0)}
          Selected={DropdownSelection}
          Options={DropdownOptions}
          Height={20}
          OnOptionSelected={DropdownSelectedCallback}
          OnClick={DropdownClickCallback}
        >
          <Tooltip Text={DropdownTooltip} Widget={Widget} />
        </Dropdown>
      </frame>
    );
  };

export const PairedDropdown = useTheme()(
  new RoactHooks(Roact)(PairedDropdownComponent)
);
