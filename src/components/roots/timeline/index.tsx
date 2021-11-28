import Roact from '@rbxts/roact';
import RoactHooks from '@rbxts/roact-hooks';
import RoactRodux from '@rbxts/roact-rodux';
import { Option } from '@rbxts/rust-classes';
import { RunService } from '@rbxts/services';
import { Container } from 'components/container';
import { Dropdown } from 'components/dropdown';
import { Scrubber } from 'components/scrubber';
import { Topbar } from 'components/topbar';
import { TreeView } from 'components/tree_view';
import { ResizablePanels } from 'components/resizable_panels';
import { KeyframeValue } from 'rodux/actions/dataActions';
import { InstanceData } from 'rodux/reducers/dataReducer';
import { IAppStore, StoreDispatch } from 'rodux/store';
import { getPlugin } from 'utils/plugin';
import { styleColor, styleMod } from 'utils/studioStyleGuide';
import { getSupportedProperties } from 'utils/supportedProperties';
import { getWidgetManager } from 'utils/widgets';
import { TextBox } from 'components/textbox';

interface IStateProps {
  theme: StudioTheme;
  root: Instance;
  instances: InstanceData;
}

interface IDispatchProps {
  updateKeyframe: (
    instance: Instance,
    property: string,
    position: number,
    value: KeyframeValue
  ) => void;
}

interface IProps extends IStateProps, IDispatchProps {}

const plugin = getPlugin();
const widgetManager = getWidgetManager();
const timelineWidget = widgetManager.widgets.timeline;

/*
  TODO: Should split this component up into
  a bunch of smaller ones and just hoist state up
*/

// Represents the timeline widget's root
const TimelineRoot: RoactHooks.FC<IProps> = (
  { theme, root, instances, updateKeyframe },
  { useState, useEffect, useValue, useCallback }
) => {
  /* Topbar */
  const [propertyDropdownValue, setPropertyDropdownValue] = useState('UNKNOWN'); // TODO: Implement a better way of doing this
  const [propertyDropdownOpen, setPropertyDropdownOpen] = useState(false);
  const [maxTime, setMaxTime] = useState(5);
  const changingTimeAutomatically = useValue(false);
  const previousTimeText = useValue('0');
  const previousMaxTimeText = useValue('5');

  /* Panel */
  const [panelSizeX, setPanelSizeX] = useState(0.2);

  /* Instance Tree */
  const [selected, setSelected] = useState<Option<Instance>>(Option.none());
  const [expanded, setExpanded] = useState<Set<Instance>>(new Set([root]));

  /* Scrubber */
  const [scrubberPos, setScrubberPos] = useState(0);
  const scrubberContainerRef = Roact.createRef<Frame>();
  const scrubbing = useValue(false);
  const scrubberMouseOffset = useValue(0);

  // Scrubber positioning effect
  useEffect(() => {
    const conn = RunService.RenderStepped.Connect(() => {
      const container = scrubberContainerRef.getValue();
      if (scrubbing.value && container) {
        let newScrubberPos =
          (timelineWidget.GetRelativeMousePosition().X -
            container.AbsolutePosition.X -
            scrubberMouseOffset.value +
            7) /
          container.AbsoluteSize.X;

        newScrubberPos = math.clamp(newScrubberPos, 0, 1);

        plugin.GetMouse().Icon = 'rbxasset://SystemCursors/ClosedHand';

        setScrubberPos(newScrubberPos);
      }
    });

    return () => {
      conn.Disconnect();
    };
  }, [scrubberContainerRef]);

  // Generate supported properties for the selected instance
  const supportedProperties: Option<string[]> = selected.match(
    (val) => {
      return Option.some(getSupportedProperties(val.ClassName as never)); // Cheating but I suck with types so...
    },
    () => {
      return Option.none();
    }
  );

  // Recalculate property dropdown value if it's invalid on the selected instance
  useEffect(() => {
    if (
      supportedProperties.isSome() &&
      !supportedProperties.unwrap().includes(propertyDropdownValue)
    ) {
      setPropertyDropdownValue(supportedProperties.unwrap()[0]);
    }
  }, [supportedProperties, propertyDropdownValue]);

  // Generate timeline property names & property keyframes
  const timelineContentProperties: Roact.Element[] = [];
  const timelineContentKeyframes: Roact.Element[] = [];
  if (selected.isSome() && instances.get(selected.unwrap())) {
    const selectedInstanceData = instances.get(selected.unwrap());
    selectedInstanceData!.properties.forEach((propertyData, propertyName) => {
      timelineContentProperties.push(
        <textlabel
          Text={propertyName}
          TextScaled={false}
          TextSize={14}
          TextColor3={theme.GetColor(styleColor.MainText)}
          Font={Enum.Font.SourceSans}
          Size={new UDim2(1, 0, 0, 20)}
          BackgroundColor3={theme.GetColor(styleColor.TabBar)}
          BorderSizePixel={1}
          BorderColor3={theme.GetColor(styleColor.ButtonBorder)}
          BorderMode={Enum.BorderMode.Inset}
          TextXAlignment={Enum.TextXAlignment.Left}
        ></textlabel>
      );

      const keyframes: Roact.Element[] = [];
      propertyData.keyframes.forEach((kf) => {
        keyframes.push(
          <imagebutton
            AnchorPoint={new Vector2(0.5, 0.5)}
            Size={new UDim2(0, 12, 0, 12)}
            Position={new UDim2(kf.position / maxTime, 0, 0.5, 0)}
            AutoButtonColor={false}
            ZIndex={150}
            Image={'rbxassetid://3141874560'}
            ImageColor3={Color3.fromRGB(41, 209, 158)}
            BackgroundTransparency={1}
          />
        );
      });

      timelineContentKeyframes.push(
        <frame Size={new UDim2(1, 0, 0, 20)} BackgroundTransparency={1}>
          {/* Keyframe Line */}
          <frame
            Size={new UDim2(1, 0, 0, 1)}
            AnchorPoint={new Vector2(0, 0.5)}
            Position={new UDim2(0, 0, 0.5, 0)}
            BorderSizePixel={0}
            BackgroundColor3={theme.GetColor(styleColor.DimmedText)}
          ></frame>

          {/* Keyframes */}
          {...keyframes}
        </frame>
      );
    });
  }

  return (
    <Container
      Size={new UDim2(1, 0, 1, 0)}
      Margin={4}
      ContainerTransparency={0}
      BackgroundColor3={theme.GetColor(styleColor.Dark)}
      ZIndex={-10}
      ExternalChildren={[
        <frame
          Active={false}
          Size={new UDim2(1, 0, 1, 0)}
          BackgroundTransparency={1}
          ZIndex={100}
          Event={{
            InputBegan: (_, input) => {
              if (input.UserInputType === Enum.UserInputType.MouseButton1) {
                if (propertyDropdownOpen) {
                  setPropertyDropdownOpen(false);
                }
              }
            },
          }}
        />,
      ]}
    >
      <uilistlayout
        FillDirection={Enum.FillDirection.Vertical}
        HorizontalAlignment={Enum.HorizontalAlignment.Center}
        VerticalAlignment={Enum.VerticalAlignment.Top}
        Padding={new UDim(0, 4)}
      />

      {/* Topbar */}
      <Topbar>
        {/* Timeline Time Field */}
        <TextBox
          LabelText={'Time'}
          Text={string.format('%.2f', scrubberPos * maxTime)}
          TextChange={(rbx) => {
            // TODO: There's definitely a better way of going about validating a textbox

            if (changingTimeAutomatically.value) return;

            // Filter out anything that isn't a decimal or digit
            changingTimeAutomatically.value = true;
            rbx.Text = rbx.Text.gsub('[^%d%.]', '')[0];
            changingTimeAutomatically.value = false;

            // Is not a valid number
            if (tonumber(rbx.Text) === undefined) {
              changingTimeAutomatically.value = true;
              rbx.Text = string.format('%.2f', previousTimeText.value);
              changingTimeAutomatically.value = false;
              // Is a negative number
            } else if (rbx.Text.sub(1, 1) === '-') {
              changingTimeAutomatically.value = true;
              rbx.Text = rbx.Text.sub(2);
              changingTimeAutomatically.value = false;
            } else {
              changingTimeAutomatically.value = true;
              rbx.Text = string.format(
                '%.2f',
                math.clamp(tonumber(rbx.Text)!, 0, maxTime)
              );
              setScrubberPos(tonumber(rbx.Text)! / maxTime);
              changingTimeAutomatically.value = false;
            }

            previousTimeText.value = rbx.Text;
          }}
        />

        {/* Max Time Field */}
        <TextBox
          LabelText={'Max Time'}
          Text={string.format('%.2f', maxTime)}
          TextChange={(rbx) => {
            if (changingTimeAutomatically.value) return;

            // Filter out anything that isn't a decimal or digit
            changingTimeAutomatically.value = true;
            rbx.Text = rbx.Text.gsub('[^%d%.]', '')[0];
            changingTimeAutomatically.value = false;

            // Is not a valid number
            if (tonumber(rbx.Text) === undefined) {
              changingTimeAutomatically.value = true;
              rbx.Text = string.format('%.2f', previousMaxTimeText.value);
              changingTimeAutomatically.value = false;
              // Is a negative number
            } else if (rbx.Text.sub(1, 1) === '-') {
              changingTimeAutomatically.value = true;
              rbx.Text = rbx.Text.sub(2);
              changingTimeAutomatically.value = false;
            } else {
              changingTimeAutomatically.value = true;
              rbx.Text = string.format('%.2f', tonumber(rbx.Text)!);
              setMaxTime(tonumber(rbx.Text)!);
              changingTimeAutomatically.value = false;
            }

            previousMaxTimeText.value = rbx.Text;
          }}
        />

        {/* Add Property Button */}
        {selected.isSome() ? (
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
              Image={'http://www.roblox.com/asset/?id=6953984741'}
              BackgroundTransparency={0}
              BackgroundColor3={theme.GetColor(
                styleColor.RibbonButton,
                styleMod.Hover
              )}
              AutoButtonColor={false}
              BorderSizePixel={0}
              Event={{
                MouseEnter: (rbx) => {
                  rbx.BackgroundColor3 = theme.GetColor(
                    styleColor.RibbonButton
                  );
                },
                MouseLeave: (rbx) => {
                  rbx.BackgroundColor3 = theme.GetColor(
                    styleColor.RibbonButton,
                    styleMod.Hover
                  );
                },
                Activated: () => {
                  const currentSelection = selected.unwrap();
                  const instanceData = instances.get(currentSelection);
                  if (
                    !instanceData ||
                    !instanceData.properties.get(propertyDropdownValue)
                  ) {
                    // Create initial keyframe at 0 position
                    updateKeyframe(
                      currentSelection,
                      propertyDropdownValue,
                      0,
                      currentSelection[
                        propertyDropdownValue as InstancePropertyNames<
                          typeof currentSelection
                        >
                      ] as KeyframeValue
                    );
                  }
                },
              }}
            >
              <uicorner CornerRadius={new UDim(0, 4)} />
            </imagebutton>
            <Dropdown
              Open={propertyDropdownOpen}
              AnchorPoint={new Vector2(0, 0.5)}
              Position={new UDim2(0, 35, 0.5, 0)}
              Size={new UDim2(0, 0, 0, 20)} // 112
              Selected={propertyDropdownValue}
              Options={supportedProperties.unwrapOr([])}
              OnOptionSelected={(val) => {
                setPropertyDropdownValue(val);
                setPropertyDropdownOpen(false);
              }}
              OnClick={() => {
                setPropertyDropdownOpen(true);
              }}
            />
          </frame>
        ) : undefined}
      </Topbar>

      {/* Resizable Content Panels */}
      <ResizablePanels
        OnResize={(newScale) => {
          setPanelSizeX(newScale);
        }}
        Panel1SizeX={panelSizeX}
        Panel1={
          // Instance Tree Panel //
          <Container
            Size={new UDim2(panelSizeX, -2, 1, 0)}
            ContainerTransparency={1}
            InnerBackgroundColor3={theme.GetColor(styleColor.MainBackground)}
            ZIndex={0}
            Padding={4}
          >
            <uicorner CornerRadius={new UDim(0, 4)} />
            <uistroke Color={theme.GetColor(styleColor.Border)} />

            <TreeView
              Size={new UDim2(1, 0, 1, 0)}
              BaseClass={'GuiObject'}
              Expanded={expanded}
              Selected={selected.isSome() ? selected.unwrap() : undefined}
              RootItem={root}
              OnExpansionChange={(item, newState) => {
                if (newState) {
                  setExpanded(new Set([...expanded, item]));
                } else {
                  const ex = new Set([...expanded]);
                  ex.delete(item);
                  setExpanded(ex);
                }
              }}
              OnSelectionChange={(item) => {
                // Handle instance tree selections to only be a GuiObject
                if (!item.IsA('GuiObject')) return;

                // Handle new selections & unselecting
                selected.match(
                  (val) => {
                    if (val === item) {
                      setSelected(Option.none());
                    } else {
                      setSelected(Option.some(item));
                    }
                  },
                  () => {
                    setSelected(Option.some(item));
                  }
                );
              }}
            />
          </Container>
        }
        Panel2={
          // Timeline Panel //
          <Container
            Size={new UDim2(1 - panelSizeX, -2, 1, 0)}
            ContainerTransparency={1}
            InnerBackgroundColor3={theme.GetColor(styleColor.MainBackground)}
            ZIndex={0}
            Padding={4}
            // ContainerRef={timelinePanelRef}
            ExternalChildren={[
              // Properties Label
              <textlabel
                Size={new UDim2(0, 149, 0, 20)}
                Position={new UDim2(0, 4, 0, 4)}
                TextColor3={theme.GetColor(styleColor.SubText)}
                Text={'Properties'}
                TextSize={14}
                Font={Enum.Font.SourceSansSemibold}
                BackgroundTransparency={0}
                BackgroundColor3={theme.GetColor(styleColor.TableItem)}
                BorderSizePixel={0}
                ZIndex={20}
              ></textlabel>,
              // Timeline Scrubber //
              <frame
                Size={new UDim2(1, -158, 1, -8)}
                Position={new UDim2(0, 153, 0, 4)}
                BackgroundTransparency={1}
                Ref={scrubberContainerRef}
              >
                <Scrubber
                  ScrubberPos={scrubberPos}
                  OnDrag={(mouseOffset) => {
                    // Update the scrubber's mouse offset & start scrubbing
                    scrubberMouseOffset.value = mouseOffset;
                    scrubbing.value = true;
                  }}
                  OnDragEnd={() => {
                    // Stop scrubbing
                    scrubbing.value = false;
                  }}
                />
              </frame>,
            ]}
          >
            <uicorner CornerRadius={new UDim(0, 4)} />
            <uistroke Color={theme.GetColor(styleColor.Border)} />
            <uilistlayout
              FillDirection={Enum.FillDirection.Vertical}
              HorizontalAlignment={Enum.HorizontalAlignment.Center}
              VerticalAlignment={Enum.VerticalAlignment.Top}
            />

            {/* Timeline Timestamps */}
            <Container
              Size={new UDim2(1, 0, 0, 20)}
              BackgroundColor3={theme.GetColor(styleColor.ViewPortBackground)}
              Padding={{
                PaddingLeft: 150,
              }}
              InputBegan={(_, input: InputObject) => {
                // Handle clicking on the timestamp container to move the scrubber
                const container = scrubberContainerRef.getValue();
                if (
                  input.UserInputType === Enum.UserInputType.MouseButton1 &&
                  !scrubbing.value &&
                  container
                ) {
                  setScrubberPos(
                    (timelineWidget.GetRelativeMousePosition().X -
                      container.AbsolutePosition.X +
                      0) /
                      container.AbsoluteSize.X
                  );
                }
              }}
            ></Container>

            {/* Timeline Content */}
            <scrollingframe
              Size={new UDim2(1, 0, 1, -20)}
              BackgroundColor3={theme.GetColor(styleColor.Mid)}
              AutomaticCanvasSize={Enum.AutomaticSize.Y}
              BorderSizePixel={0}
              ScrollBarThickness={6}
              ScrollBarImageTransparency={0.5}
              ScrollBarImageColor3={theme.GetColor(styleColor.Light)}
              CanvasSize={new UDim2(0, 0, 0, 0)}
            >
              {/* Properties */}
              <frame
                Size={new UDim2(0, 150, 1, 0)}
                BorderSizePixel={0}
                BackgroundColor3={theme.GetColor(styleColor.ViewPortBackground)}
              >
                <uilistlayout
                  FillDirection={Enum.FillDirection.Vertical}
                  HorizontalAlignment={Enum.HorizontalAlignment.Left}
                  VerticalAlignment={Enum.VerticalAlignment.Top}
                />
                {...timelineContentProperties}
              </frame>

              {/* Keyframes */}
              <frame
                Size={new UDim2(1, -150, 1, 0)}
                Position={new UDim2(0, 150, 0, 0)}
                BorderSizePixel={0}
                BackgroundTransparency={1}
              >
                <uilistlayout
                  FillDirection={Enum.FillDirection.Vertical}
                  HorizontalAlignment={Enum.HorizontalAlignment.Left}
                  VerticalAlignment={Enum.VerticalAlignment.Top}
                />
                {...timelineContentKeyframes}
              </frame>
            </scrollingframe>
          </Container>
        }
      />
    </Container>
  );
};

export const Timeline = RoactRodux.connect(
  (state: IAppStore): IStateProps => {
    return {
      theme: state.theme.theme,
      root: state.appData.root.unwrap(),
      instances: state.appData.instances,
    };
  },
  (dispatch: StoreDispatch): IDispatchProps => {
    return {
      updateKeyframe: (instance, property, position, value) => {
        dispatch({
          type: 'UpdateKeyframe',
          instance: instance,
          property: property,
          position: position,
          value: value,
        });
      },
    };
  }
)(new RoactHooks(Roact)(TimelineRoot));
