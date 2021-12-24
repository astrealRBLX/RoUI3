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
import { getNearestDistance } from 'utils/getNearestDistance';
import { Tooltip } from '../../tooltip';

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
  createProperty: (instance: Instance, property: string) => void;
}

interface IProps extends IStateProps, IDispatchProps {}

const plugin = getPlugin();
const widgetManager = getWidgetManager();
const timelineWidget = widgetManager.widgets.timeline;

/*
  TODO: Should split this component up into
  a bunch of smaller ones and just hoist state up
*/

enum TimestampsRenderState {
  All,
  Half,
  None,
}

// Represents the timeline widget's root
const TimelineRoot: RoactHooks.FC<IProps> = (
  { theme, root, instances, updateKeyframe, createProperty },
  { useState, useEffect, useValue, useMemo }
) => {
  /* Topbar */
  const [propertyDropdownValue, setPropertyDropdownValue] = useState('UNKNOWN'); // TODO: Implement a better way of doing this
  const [propertyDropdownOpen, setPropertyDropdownOpen] = useState(false);
  const [maxTime, setMaxTime] = useState(5);

  /* Panel */
  const [panelSizeX, setPanelSizeX] = useState(0.2);

  /* Instance Tree */
  const [selected, setSelected] = useState<Option<Instance>>(Option.none());
  const [expanded, setExpanded] = useState<Set<Instance>>(new Set([root]));

  /* Scrubber */
  const [scrubberPos, setScrubberPos] = useState(0);
  const [timestampsRenderState, setTimestampsRenderState] = useState(
    TimestampsRenderState.All
  );
  const scrubberContainerRef = Roact.createRef<Frame>();
  const scrubbing = useValue(false);
  const scrubberMouseOffset = useValue(0);
  const shouldSnap = useValue(false);
  const isKeyframeSnapEnabled = useValue(false);
  const rawTimelineTimestamps = useValue<number[]>([]);

  /* Keyframes */
  const ctrlToggled = useValue(false);
  const [selectedKeyframes, setSelectedKeyframes] = useState<
    Array<{
      property: string;
      value: KeyframeValue;
      position: number;
    }>
  >([]);

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

        // Handle scrubber snapping
        if (shouldSnap.value) {
          const nearestTimestamp = getNearestDistance(
            newScrubberPos,
            rawTimelineTimestamps.value
          );

          if (
            isKeyframeSnapEnabled.value &&
            selected.isSome() &&
            instances.get(selected.unwrap())
          ) {
            const currentProperties = instances.get(
              selected.unwrap()
            )!.properties;

            // Flatten keyframe time positions, remove duplicates, and convert to 0 to 1 scale range
            const flattenedKeyfs: Set<number> = new Set();
            currentProperties.forEach((propertyData) => {
              propertyData.keyframes.forEach((kf) => {
                flattenedKeyfs.add(kf.position / maxTime);
              });
            });

            const nearestKeyframe = getNearestDistance(newScrubberPos, [
              ...flattenedKeyfs,
            ]);

            if (nearestKeyframe.distance < nearestTimestamp.distance) {
              setScrubberPos(nearestKeyframe.position);
              return;
            }
          }

          setScrubberPos(nearestTimestamp.position);
        } else {
          setScrubberPos(newScrubberPos);
        }
      }
    });

    return () => {
      conn.Disconnect();
    };
  }, [scrubberContainerRef, instances, selected]);

  // Generate supported properties for the selected instance
  const supportedProperties: Option<string[]> = useMemo(
    () =>
      selected.match(
        (selectedInst) => {
          let sProps = getSupportedProperties(selectedInst.ClassName as never);
          if (instances.get(selectedInst)) {
            sProps = sProps.filter((val) => {
              return (
                instances.get(selectedInst)!.properties.get(val) === undefined
              );
            });
          }
          return Option.some(sProps); // Cheating but I suck with types so...
        },
        () => {
          return Option.none();
        }
      ),
    [selected, instances]
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

  // Resolve max time textbox
  useEffect(() => {
    if (maxTime < 1) {
      setMaxTime(1);
    } else if (maxTime < scrubberPos) {
      setScrubberPos(maxTime);
    }
  }, [maxTime, scrubberPos]);

  // Generate timeline property names & property keyframes
  const [timelineContentProperties, timelineContentKeyframes] = useMemo(() => {
    const timelineProps: Roact.Element[] = [];
    const timelineKeyfs: Roact.Element[] = [];

    if (selected.isSome() && instances.get(selected.unwrap())) {
      const selectedInstanceData = instances.get(selected.unwrap());

      selectedInstanceData!.properties.forEach((propertyData, propertyName) => {
        timelineProps.push(
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
          const kfSelected = selectedKeyframes.find((val) => {
            return (
              val.property === propertyName &&
              val.position === kf.position &&
              val.value === kf.value
            );
          });

          keyframes.push(
            <frame
              AnchorPoint={new Vector2(0.5, 0.5)}
              Size={new UDim2(0, 9, 0, 9)}
              Position={new UDim2(kf.position / maxTime, 0, 0.5, 0)}
              ZIndex={95}
              Rotation={45}
              BorderSizePixel={kfSelected ? 2 : 0}
              BorderColor3={
                kfSelected ? Color3.fromRGB(217, 217, 217) : new Color3()
              }
              BackgroundColor3={Color3.fromRGB(255, 0, 0)}
              Event={{
                InputBegan: (_, input) => {
                  if (input.UserInputType === Enum.UserInputType.MouseButton1) {
                    const newKf = {
                      property: propertyName,
                      value: kf.value,
                      position: kf.position,
                    };

                    let shouldAdd = true;
                    let removeIndex = -1;

                    // Determine if the clicked keyframe is already selected
                    selectedKeyframes.forEach((selectedKf, i) => {
                      if (selectedKf === kfSelected) {
                        shouldAdd = false;
                        removeIndex = i;
                      }
                    });

                    let newSelected = [...selectedKeyframes];

                    // Filter keyframes that are not the clicked one
                    if (!shouldAdd) {
                      newSelected = newSelected.filter((kf, i) => {
                        return kf !== kfSelected;
                      });
                    }

                    if (ctrlToggled.value) {
                      // Ctrl is activated (multiple selections)
                      if (shouldAdd) {
                        // Add unselected keyframe to selected
                        setSelectedKeyframes([...selectedKeyframes, newKf]);
                      } else {
                        // Remove selected keyframe from selected
                        setSelectedKeyframes(newSelected);
                      }
                    } else {
                      // Ctrl is not activated (single selection)
                      if (shouldAdd) {
                        setSelectedKeyframes([newKf]);
                      } else {
                        setSelectedKeyframes(
                          selectedKeyframes.size() > 1 ? [newKf] : []
                        );
                      }
                    }
                  }
                },
              }}
            />
          );
        });

        timelineKeyfs.push(
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

    return [timelineProps, timelineKeyfs];
  }, [selected, instances, selectedKeyframes]);

  // Generate timeline timestamps
  const [timelineTimestamps, rawTimestamps] = useMemo(() => {
    const timestamps: Roact.Element[] = [];
    const raw: number[] = [0];

    let count = 20;
    switch (timestampsRenderState) {
      case TimestampsRenderState.All:
        count = 20;
        break;
      case TimestampsRenderState.Half:
        count = 10;
        break;
      case TimestampsRenderState.None:
        count = 1;
        break;
    }

    const individualSize = 1 / count;
    let currentIter = 1;

    for (
      let i = maxTime / count;
      i <= maxTime + maxTime / (count * 2);
      i += maxTime / count
    ) {
      raw.push(individualSize * currentIter);
      timestamps.push(
        <frame
          Size={new UDim2(individualSize, 0, 1, 0)}
          BackgroundTransparency={1}
        >
          <frame
            AnchorPoint={new Vector2(1, 0)}
            Size={new UDim2(0, 1, currentIter % 2 === 0 ? 0.9 : 0.75, 0)}
            Position={new UDim2(1, 0, 0, 0)}
            BorderSizePixel={0}
            BackgroundColor3={theme.GetColor(styleColor.Light)}
          />
          <textlabel
            Text={string.format('%.2f', i)}
            TextColor3={theme.GetColor(styleColor.DimmedText)}
            BackgroundTransparency={1}
            Size={new UDim2(1, -5, 1, 0)}
            Font={Enum.Font.SourceSans}
            TextXAlignment={Enum.TextXAlignment.Right}
            TextYAlignment={Enum.TextYAlignment.Top}
            TextSize={12}
          />
        </frame>
      );
      currentIter++;
    }

    return [timestamps, raw];
  }, [maxTime, timestampsRenderState]);

  rawTimelineTimestamps.value = [...rawTimestamps];

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
          ZIndex={190}
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
      InputBegan={(_, input) => {
        if (input.UserInputType !== Enum.UserInputType.Keyboard) return;
        if (input.KeyCode === Enum.KeyCode.LeftShift) {
          shouldSnap.value = !shouldSnap.value;
        } else if (input.KeyCode === Enum.KeyCode.K) {
          isKeyframeSnapEnabled.value = !isKeyframeSnapEnabled.value;
        } else if (input.KeyCode === Enum.KeyCode.LeftControl) {
          ctrlToggled.value = !ctrlToggled.value;
        }
      }}
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
          FocusLost={(rbx) => {
            rbx.Text = rbx.Text.gsub('[^%d^.]', '')[0];
            if (tonumber(rbx.Text) !== undefined) {
              rbx.Text = string.format(
                '%.2f',
                math.clamp(tonumber(rbx.Text)!, 0, maxTime)
              );
              setScrubberPos(tonumber(rbx.Text)! / maxTime);
            } else {
              rbx.Text = '0.00';
              setScrubberPos(0);
            }
          }}
        >
          <Tooltip
            Text={'Current scrubber position on the timeline in seconds'}
            Widget={timelineWidget}
          />
        </TextBox>

        {/* Max Time Field */}
        <TextBox
          LabelText={'Max Time'}
          Text={string.format('%.2f', maxTime)}
          FocusLost={(rbx) => {
            if (tonumber(rbx.Text) !== undefined) {
              rbx.Text = string.format('%.2f', tonumber(rbx.Text)!);
              setMaxTime(tonumber(rbx.Text)!);
            } else {
              rbx.Text = '1.00';
              setMaxTime(1);
            }
          }}
        >
          <Tooltip
            Text={'Animation length in seconds'}
            Widget={timelineWidget}
          />
        </TextBox>

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
              Image={'rbxassetid://3192519002'}
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
                      tonumber(string.format('%.2f', scrubberPos * maxTime))!,
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
              <Tooltip
                Text={'Add property to animate to selected instance'}
                Widget={timelineWidget}
              />
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
            >
              <Tooltip
                Text={'Select a property to add'}
                Widget={timelineWidget}
              />
            </Dropdown>
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
              InputBegan={(_, input) => {
                // Handle clicking on the timestamp container to move the scrubber
                const container = scrubberContainerRef.getValue();
                if (
                  input.UserInputType === Enum.UserInputType.MouseButton1 &&
                  !scrubbing.value &&
                  container
                ) {
                  scrubberMouseOffset.value = 7;
                  scrubbing.value = true;
                }
              }}
              InputEnded={(_, input) => {
                if (input.UserInputType === Enum.UserInputType.MouseButton1) {
                  // Finish scrubbing after jump
                  if (scrubbing.value) {
                    scrubbing.value = false;
                  }
                }
              }}
              ExternalChildren={[
                <frame
                  BackgroundTransparency={1}
                  Size={UDim2.fromScale(1, 1)}
                  Change={{
                    AbsoluteSize: (rbx) => {
                      if (
                        rbx.AbsoluteSize.X < 750 &&
                        rbx.AbsoluteSize.X > 425
                      ) {
                        setTimestampsRenderState(TimestampsRenderState.Half);
                      } else if (rbx.AbsoluteSize.X <= 425) {
                        setTimestampsRenderState(TimestampsRenderState.None);
                      } else {
                        setTimestampsRenderState(TimestampsRenderState.All);
                      }
                    },
                  }}
                />,
              ]}
            >
              <uilistlayout
                FillDirection={Enum.FillDirection.Horizontal}
                HorizontalAlignment={Enum.HorizontalAlignment.Left}
                VerticalAlignment={Enum.VerticalAlignment.Center}
                SortOrder={Enum.SortOrder.LayoutOrder}
              />
              {...timelineTimestamps}
            </Container>

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
                  SortOrder={Enum.SortOrder.LayoutOrder}
                />
                {...timelineContentProperties}
              </frame>

              {/* Keyframes */}
              <frame
                Size={new UDim2(1, -150, 1, 0)}
                Position={new UDim2(0, 149, 0, 0)}
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
      createProperty: (instance, property) => {
        dispatch({
          type: 'CreateInstanceProperty',
          instance: instance,
          property: property,
        });
      },
    };
  }
)(new RoactHooks(Roact)(TimelineRoot));
