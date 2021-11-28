import Roact from '@rbxts/roact';
import RoactHooks from '@rbxts/roact-hooks';
import { styleColor, styleMod } from 'utils/studioStyleGuide';
import { useTheme } from 'utils/useTheme';

interface IStateProps {
  theme: StudioTheme;
}

interface IProps extends IStateProps {
  LabelText: string;
  Text?: string;
  TextChange?: (rbx: TextBox) => void;
}

// Textbox component for use in the timeline root topbar
const TextBoxComponent: RoactHooks.FC<IProps> = ({
  theme,
  LabelText,
  Text,
  TextChange,
}) => {
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

      <textlabel
        Text={LabelText}
        Size={new UDim2(0, 0, 0, 20)}
        BackgroundTransparency={1}
        Font={Enum.Font.SourceSansSemibold}
        TextSize={14}
        TextColor3={theme.GetColor(styleColor.MainText)}
        AutomaticSize={Enum.AutomaticSize.X}
      />

      <textbox
        AutomaticSize={Enum.AutomaticSize.X}
        BackgroundColor3={theme.GetColor(
          styleColor.RibbonButton,
          styleMod.Hover
        )}
        BorderSizePixel={0}
        Size={new UDim2(0, 40, 0, 20)}
        AnchorPoint={new Vector2(0, 0.5)}
        Position={new UDim2(0, 0, 0.5, 0)}
        TextColor3={theme.GetColor(styleColor.MainText)}
        Font={Enum.Font.SourceSans}
        TextSize={14}
        Text={Text}
        ClearTextOnFocus={false}
        Change={{
          Text: TextChange,
        }}
      >
        <uicorner CornerRadius={new UDim(0, 4)} />
      </textbox>
    </frame>
  );
};

export const TextBox = useTheme()(new RoactHooks(Roact)(TextBoxComponent));
