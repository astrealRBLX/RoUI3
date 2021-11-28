import Roact from '@rbxts/roact';
import RoactHooks from '@rbxts/roact-hooks';
import RoactRodux from '@rbxts/roact-rodux';
import { Button, ButtonStyle } from 'components/button';
import { IAppStore, StoreDispatch } from 'rodux/store';
import changeRoot from 'rodux/thunks/changeRoot';
import { styleColor } from 'utils/studioStyleGuide';
import { getTreeManager } from 'utils/trees';
import { getWidgetManager } from 'utils/widgets';

interface IStateProps {
  theme: StudioTheme;
}

interface IDispatchProps {
  setRoot: (instance: Instance) => void;
}

interface IProps extends IStateProps, IDispatchProps {}

const SelectionService = game.GetService('Selection');

// Represents the start widget's root
const StartRoot: RoactHooks.FC<IProps> = (
  { theme, setRoot },
  { useState, useEffect, useCallback }
) => {
  const [selection, setSelection] = useState<Instance[]>(
    SelectionService.Get()
  );

  // Selection updating effect
  useEffect(() => {
    const conn = SelectionService.SelectionChanged.Connect(() => {
      setSelection(SelectionService.Get());
    });

    return () => {
      conn.Disconnect();
    };
  }, []);

  // Resolve selecting an object with an internal security level
  const resolveSelection = useCallback(() => {
    let [success, result] = pcall(() => {
      return selection.size() === 1 && selection[0].IsA('ScreenGui');
    });

    if (success) return [result as boolean, !success];
    else return [false, !success];
  }, [selection]);

  const [validSelection, illegalSelection] = resolveSelection();

  return (
    <frame
      Size={new UDim2(1, 0, 1, 0)}
      BackgroundColor3={theme.GetColor(styleColor.MainBackground)}
      BorderSizePixel={0}
    >
      <uipadding
        PaddingTop={new UDim(0, 5)}
        PaddingLeft={new UDim(0, 10)}
        PaddingBottom={new UDim(0, 5)}
        PaddingRight={new UDim(0, 10)}
      />
      <uilistlayout
        FillDirection={Enum.FillDirection.Vertical}
        HorizontalAlignment={Enum.HorizontalAlignment.Center}
        VerticalAlignment={Enum.VerticalAlignment.Top}
        Padding={new UDim(0, 5)}
      />

      {/* Title  */}
      <textlabel
        Text={'RoUI3'}
        Size={new UDim2(1, 0, 0, 40)}
        AnchorPoint={new Vector2(0.5, 0.5)}
        BackgroundTransparency={1}
        TextColor3={theme.GetColor(styleColor.MainText)}
        TextScaled={true}
        Font={Enum.Font.SourceSansBold}
      >
        <uitextsizeconstraint MaxTextSize={28} MinTextSize={24} />
      </textlabel>

      {/* Separator */}
      <frame
        Size={new UDim2(0.9, 0, 0, 2)}
        BorderSizePixel={0}
        BackgroundColor3={theme.GetColor(styleColor.Separator)}
      />

      {/* Start Text */}
      <textlabel
        Text={'Please select a ScreenGui to animate'}
        Size={new UDim2(0.6, 0, 0, 50)}
        TextScaled={true}
        BackgroundTransparency={1}
        TextColor3={theme.GetColor(styleColor.MainText)}
        Font={Enum.Font.SourceSans}
        AutomaticSize={Enum.AutomaticSize.Y}
      >
        <uipadding
          PaddingTop={new UDim(0, 4)}
          PaddingLeft={new UDim(0, 4)}
          PaddingRight={new UDim(0, 4)}
          PaddingBottom={new UDim(0, 4)}
        />
        <uitextsizeconstraint MaxTextSize={20} MinTextSize={16} />
      </textlabel>

      {/* Current Selection */}
      <frame
        Size={new UDim2(0.7, 0, 0, 40)}
        BackgroundColor3={theme.GetColor(styleColor.Mid)}
      >
        <uicorner CornerRadius={new UDim(0.2, 0)} />
        <uistroke
          Color={
            validSelection
              ? theme.GetColor(styleColor.Light)
              : theme.GetColor(styleColor.ErrorText)
          }
          Thickness={2}
        />

        <textlabel
          Text={`${
            validSelection || (!illegalSelection && selection.size() === 1)
              ? selection[0]
              : 'Invalid Selection'
          }`}
          Size={UDim2.fromScale(1, 1)}
          TextScaled={true}
          BackgroundTransparency={1}
          TextColor3={theme.GetColor(styleColor.SubText)}
          Font={Enum.Font.SourceSansItalic}
        >
          <uipadding
            PaddingTop={new UDim(0, 2)}
            PaddingBottom={new UDim(0, 2)}
            PaddingRight={new UDim(0, 2)}
            PaddingLeft={new UDim(0, 2)}
          />
          <uitextsizeconstraint MaxTextSize={18} MinTextSize={14} />
        </textlabel>

        {!validSelection && (
          <textlabel
            Text={`${
              selection.size() < 1
                ? 'Select an instance'
                : selection.size() > 1
                ? 'Multiple instances selected'
                : 'Instance is not a ScreenGui'
            }`}
            Size={new UDim2(1, 0, 0, 15)}
            Position={new UDim2(0, 0, 1, 5)}
            TextSize={14}
            BackgroundTransparency={1}
            TextColor3={theme.GetColor(styleColor.ErrorText)}
            Font={Enum.Font.SourceSansSemibold}
            TextXAlignment={Enum.TextXAlignment.Left}
            TextWrap={true}
          ></textlabel>
        )}
      </frame>

      {/* Padding */}
      <frame
        Size={
          validSelection ? UDim2.fromOffset(0, 10) : UDim2.fromOffset(0, 20)
        }
        BackgroundTransparency={1}
      />

      {/* Continue Button */}
      <Button
        Style={ButtonStyle.Primary}
        Disabled={!validSelection}
        Text={'Continue'}
        Size={new UDim2(0.8, 0, 0, 40)}
        PaddingY={new UDim(0, 4)}
        PaddingX={new UDim(0, 4)}
        MaxTextSize={20}
        MinTextSize={14}
        Font={Enum.Font.SourceSansBold}
        OnActivated={() => {
          setRoot(selection[0]);
        }}
      />
    </frame>
  );
};

export const Start = RoactRodux.connect(
  (state: IAppStore): IStateProps => {
    return {
      theme: state.theme.theme,
    };
  },
  (dispatch: StoreDispatch): IDispatchProps => {
    return {
      setRoot: (instance) => {
        dispatch(
          changeRoot(instance, getWidgetManager(), getTreeManager()) as never
        );
      },
    };
  }
)(new RoactHooks(Roact)(StartRoot));
