import Roact, { update } from '@rbxts/roact';
import RoactHooks from '@rbxts/roact-hooks';
import RoactRodux from '@rbxts/roact-rodux';
import { Option } from '@rbxts/rust-classes';
import { RunService, TweenService } from '@rbxts/services';
import { Container } from 'components/container';
import { Scrubber } from 'components/scrubber';
import { Topbar } from 'components/topbar';
import { TreeView } from 'components/tree_view';
import { ResizablePanels } from 'components/resizable_panels';
import { KeyframeKind, KeyframeValue } from 'rodux/actions/dataActions';
import { IAppStore, StoreDispatch } from 'rodux/store';
import { getPlugin } from 'utils/plugin';
import { styleColor, styleMod } from 'utils/studioStyleGuide';
import { getSupportedProperties } from 'utils/supportedProperties';
import { getWidgetManager } from 'utils/widgets';
import { TextBox } from 'components/textbox';
import { getNearestDistance } from 'utils/getNearestDistance';
import { Tooltip } from '../../tooltip';
import { ContextMenu } from 'components/context_menu';
import { PairedDropdown } from 'components/paired_dropdown';
import { normalizeToRange } from 'utils/normalize';
import { lerp } from 'utils/lerp';
import { getInitialProperty } from 'utils/initialProperties';
import { KeyboardListener } from 'components/keyboard_listener';
import prettyStringify from 'utils/prettyStringify';
import { IKeyframe } from 'rodux/reducers/dataReducer';
import { Dropdown } from 'components/dropdown';
import { exportAllAnimations, exportAnimation } from 'backend/animation';
import getColorFromEasingStyle from 'utils/getColorFromEasingStyle';

interface IStateProps {
  theme: StudioTheme;
  root: Instance;
  originalRoot: Instance;
  instances: Instance[];
  properties: Array<Set<string>>;
  keyframes: Array<IKeyframe>;
}

interface IDispatchProps {
  updateKeyframe: (
    instance: Instance,
    property: string,
    position: number,
    value: KeyframeValue,
    kind?: KeyframeKind,
    kindData?: {
      easingStyle?: Enum.EasingStyle;
      easingDirection?: Enum.EasingDirection;
      dampingRatio?: number;
      frequency?: number;
    }
  ) => void;
  deleteKeyframes: (
    keyframes: Array<{
      instance: Instance;
      property: string;
      position: number;
    }>
  ) => void;
  deleteProperty: (instance: Instance, property: string) => void;
}

interface IProps extends IStateProps, IDispatchProps {}

const Selection = game.GetService('Selection');

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

enum ContextMenuID {
  TimelineContent = 'TIMELINE_CONTENT',
}

// Represents the timeline widget's root
const TimelineRoot: RoactHooks.FC<IProps> = (
  {
    theme,
    root,
    instances,
    properties,
    keyframes,
    updateKeyframe,
    deleteKeyframes,
    deleteProperty,
  },
  { useState, useEffect, useValue, useMemo, useCallback }
) => {
  /* Topbar */
  const [propertyDropdownValue, setPropertyDropdownValue] = useState('UNKNOWN'); // TODO: Implement a better way of doing this
  const [propertyDropdownOpen, setPropertyDropdownOpen] = useState(false);
  const [maxTime, setMaxTime] = useState(5);
  const [easingStyleDropdownOpen, setEasingStyleDropdownOpen] = useState(false);
  const [easingDirectionDropdownOpen, setEasingDirectionDropdownOpen] =
    useState(false);
  const [globalScrubber, setGlobalScrubber] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  /* Keyboard Input */
  const shiftPressed = useValue(false);
  const ctrlPressed = useValue(false);

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
  const rawTimelineTimestamps = useValue<number[]>([]);

  /* Keyframes */
  const [selectedKeyframes, setSelectedKeyframes] = useState<Array<IKeyframe>>(
    []
  );
  const internalPropertyChange = useValue(false);

  /* Context Menu */
  const [activeContextMenuID, setActiveContextMenuID] = useState('');

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
        if (shiftPressed.value) {
          const nearestTimestamp = getNearestDistance(
            newScrubberPos,
            rawTimelineTimestamps.value
          );

          if (
            ctrlPressed.value &&
            selected.isSome() &&
            instances.includes(selected.unwrap())
          ) {
            // Flatten keyframe time positions, remove duplicates, and convert to 0 to 1 scale range
            const flattenedKeyfs: Set<number> = new Set();
            keyframes.forEach((kf) => {
              flattenedKeyfs.add(kf.position / maxTime);
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
          if (instances.includes(selectedInst)) {
            const ID = instances.indexOf(selectedInst);
            sProps = sProps.filter((val) => {
              return !properties[ID].has(val);
            });
          }
          return Option.some(sProps); // Cheating but I suck with types so...
        },
        () => {
          return Option.none();
        }
      ),
    [selected, instances, properties]
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

  // Context menu right-clicked callback
  const contextMenuClicked = useCallback((ID: string) => {
    setActiveContextMenuID(ID);
  }, []);

  // Generate timeline property names & property keyframes
  const [timelineContentProperties, timelineContentKeyframes] = useMemo(() => {
    const timelineProps: Roact.Element[] = [];
    const timelineKeyfs: Roact.Element[] = [];

    if (selected.isSome() && instances.includes(selected.unwrap())) {
      const ID = instances.indexOf(selected.unwrap());
      const instanceProperties = properties[ID];

      instanceProperties.forEach((propertyName) => {
        // Timeline property label
        timelineProps.push(
          <textlabel
            Key={propertyName}
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
          >
            <uipadding PaddingLeft={new UDim(0, 4)} />
            <ContextMenu
              Widget={timelineWidget}
              ID={propertyName}
              RightClickCallback={contextMenuClicked}
              Visible={activeContextMenuID === propertyName}
              Options={[
                {
                  Text: 'Insert new keyframe',
                  Tooltip:
                    "Adds a new keyframe at the scrubber's current position",
                  Callback: (_, input) => {
                    if (input.UserInputType !== Enum.UserInputType.MouseButton1)
                      return;
                    if (input.UserInputState !== Enum.UserInputState.Begin)
                      return;

                    if (selected.isSome()) {
                      const currentSelection = selected.unwrap();
                      updateKeyframe(
                        currentSelection,
                        propertyName,
                        tonumber(string.format('%.2f', scrubberPos * maxTime))!,
                        currentSelection[
                          propertyName as InstancePropertyNames<
                            typeof currentSelection
                          >
                        ] as KeyframeValue,
                        'Tween'
                      );
                      setActiveContextMenuID('');
                    }
                  },
                },
                {
                  Text: 'Delete property',
                  Tooltip: `Delete "${propertyName}" and all its keyframes from the animation property list`,
                  Callback: (_, input) => {
                    if (input.UserInputType !== Enum.UserInputType.MouseButton1)
                      return;
                    if (input.UserInputState !== Enum.UserInputState.Begin)
                      return;

                    if (selected.isSome()) {
                      deleteProperty(selected.unwrap(), propertyName);
                      setActiveContextMenuID('');
                    }
                  },
                },
              ]}
            ></ContextMenu>
          </textlabel>
        );

        // Keyframes specifically matching this property
        const propertyKeyframes = keyframes.filter((kf) => {
          return (
            kf.instance === selected.unwrap() && kf.property === propertyName
          );
        });

        // Generate elements for each keyframe in this property
        const keyframeElements: Roact.Element[] = [];
        propertyKeyframes.forEach((kf) => {
          const kfSelected = selectedKeyframes.find((val) => {
            return (
              val.instance === selected.unwrap() &&
              val.property === propertyName &&
              val.position === kf.position &&
              val.value === kf.value
            );
          });

          keyframeElements.push(
            <frame
              AnchorPoint={new Vector2(0.5, 0.5)}
              Size={new UDim2(0, 9, 0, 9)}
              Position={new UDim2(kf.position / maxTime, 0, 0.5, 0)}
              ZIndex={95}
              Rotation={kf.kind === 'Tween' ? 45 : 0}
              BorderSizePixel={kfSelected ? 2 : 0}
              BorderColor3={
                kfSelected ? Color3.fromRGB(217, 217, 217) : new Color3()
              }
              BackgroundColor3={getColorFromEasingStyle(
                kf.kindData.easingStyle
              )}
              Event={{
                InputBegan: (_, input) => {
                  if (input.UserInputType === Enum.UserInputType.MouseButton1) {
                    const newKf: IKeyframe = {
                      instance: selected.unwrap(),
                      property: propertyName,
                      value: kf.value,
                      position: kf.position,
                      kind: kf.kind,
                      kindData: {
                        easingStyle: kf.kindData.easingStyle,
                        easingDirection: kf.kindData.easingDirection,
                        dampingRatio: kf.kindData.dampingRatio,
                        frequency: kf.kindData.frequency,
                      },
                    };

                    let shouldAdd = true;

                    // Determine if the clicked keyframe is already selected
                    selectedKeyframes.forEach((selectedKf, i) => {
                      if (selectedKf === kfSelected) {
                        shouldAdd = false;
                      }
                    });

                    let newSelected = [...selectedKeyframes];

                    // Filter keyframes that are not the clicked one
                    if (!shouldAdd) {
                      newSelected = newSelected.filter((kf, i) => {
                        return kf !== kfSelected;
                      });
                    }

                    if (ctrlPressed.value) {
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
            >
              <Tooltip
                Widget={timelineWidget}
                MaxWidth={250}
                Text={`[${kf.kind}] ${prettyStringify(kf.value)} @ ${
                  kf.position
                }s`}
              />
            </frame>
          );
        });

        // Generate the actual keyframe bar and the inner keyframes
        timelineKeyfs.push(
          <frame
            Key={propertyName}
            Size={new UDim2(1, 0, 0, 20)}
            BackgroundTransparency={1}
          >
            {/* Keyframe Line */}
            <frame
              Size={new UDim2(1, 0, 0, 1)}
              AnchorPoint={new Vector2(0, 0.5)}
              Position={new UDim2(0, 0, 0.5, 0)}
              BorderSizePixel={0}
              BackgroundColor3={theme.GetColor(styleColor.DimmedText)}
            ></frame>

            {/* Keyframes */}
            {...keyframeElements}
          </frame>
        );
      });
    }

    return [timelineProps, timelineKeyfs];
  }, [
    selected,
    instances,
    properties,
    keyframes,
    selectedKeyframes,
    activeContextMenuID,
    maxTime,
  ]);

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

  // Handle instance property changes
  useEffect(() => {
    const connections: RBXScriptConnection[] = [];

    if (selected.isSome()) {
      const selection = selected.unwrap();
      const sProps = getSupportedProperties(selection.ClassName as never);

      sProps.forEach((prop) => {
        const conn = selection
          .GetPropertyChangedSignal(prop as never)
          .Connect(() => {
            if (internalPropertyChange.value) return;

            const val = selection[
              prop as InstancePropertyNames<typeof selection>
            ] as KeyframeValue;

            updateKeyframe(
              selection,
              prop,
              tonumber(string.format('%.2f', scrubberPos * maxTime))!,
              val
            );
          });

        connections.push(conn);
      });
    }

    return () => {
      connections.forEach((conn) => {
        conn.Disconnect();
      });
    };
  }, [selected, scrubberPos, maxTime]);

  // Scrubber preview effect
  useEffect(() => {
    if (globalScrubber) {
      instances.forEach((inst) => {
        const selectedInstance = inst;
        const ID = instances.indexOf(selectedInstance);
        const instanceProperties = properties[ID];

        instanceProperties.forEach((prop) => {
          // Get keyframes only related to this property
          const propKeyframes = keyframes.filter((kf) => {
            return kf.instance === selectedInstance && kf.property === prop;
          });

          // Sort keyframes by position
          const sortedKeyframes = propKeyframes.sort((a, b) => {
            return a.position < b.position;
          });

          // Convert scrubber position to seconds
          const scrubberPosTime = tonumber(
            string.format('%.2f', scrubberPos * maxTime)
          )!;

          let firstKeyframe: IKeyframe | undefined;
          let secondKeyframe: IKeyframe | undefined;

          // Find the keyframes surrounding the scrubber
          sortedKeyframes.forEach((kf, index) => {
            if (index !== sortedKeyframes.size() - 1) {
              const nextKf = sortedKeyframes[index + 1];

              if (
                kf.position <= scrubberPosTime &&
                nextKf.position > scrubberPosTime
              ) {
                // Scrubber is between two keyframes
                firstKeyframe = kf;
                secondKeyframe = nextKf;
              }
            }
          });

          // Handle the scrubber being after the last keyframe
          if (firstKeyframe === undefined && sortedKeyframes.size() > 0) {
            const lastKf = sortedKeyframes[sortedKeyframes.size() - 1];

            if (scrubberPosTime >= lastKf.position) {
              firstKeyframe = lastKf;
              secondKeyframe = lastKf;
            }
          }

          // Handle the scrubber being before the first keyframe
          if (firstKeyframe === undefined && sortedKeyframes.size() > 0) {
            if (
              scrubberPosTime >= 0 &&
              scrubberPosTime <= sortedKeyframes[0].position
            ) {
              const changedProp = getInitialProperty(selectedInstance, prop);

              if (changedProp) {
                firstKeyframe = {
                  instance: selectedInstance,
                  property: prop,
                  position: 0,
                  value: changedProp.value,
                  kind: 'Tween',
                  kindData: {
                    easingStyle: Enum.EasingStyle.Linear,
                    easingDirection: Enum.EasingDirection.InOut,
                    dampingRatio: 0,
                    frequency: 0,
                  },
                };

                secondKeyframe = sortedKeyframes[0];
              }
            }
          }

          // Handle no keyframes
          if (sortedKeyframes.size() === 0) {
            const changedProp = getInitialProperty(selectedInstance, prop);

            if (changedProp) {
              const initialData: IKeyframe = {
                instance: selectedInstance,
                property: prop,
                position: 0,
                value: changedProp.value,
                kind: 'Tween',
                kindData: {
                  easingStyle: Enum.EasingStyle.Linear,
                  easingDirection: Enum.EasingDirection.InOut,
                  dampingRatio: 0,
                  frequency: 0,
                },
              };

              firstKeyframe = initialData;
              secondKeyframe = initialData;
            }
          }

          if (firstKeyframe !== undefined && secondKeyframe !== undefined) {
            // Generate an alpha based on the scrubber position relative to
            // its surrounding keyframes
            let normalizedAlpha = normalizeToRange(
              scrubberPosTime,
              firstKeyframe.position,
              secondKeyframe.position,
              0,
              1
            );

            // If the keyframes are the same then the scrubber is past
            // the the second keyframe and therefore you can just use
            // an alpha of 1. Alternatively, if the keyframes are both
            // at position 0 (which isn't usually possible), then the
            // first keyframe is fake and overlapping a new keyframe so
            // an alpha of 1 should be used.
            if (
              firstKeyframe === secondKeyframe ||
              (firstKeyframe.position === secondKeyframe.position &&
                firstKeyframe.position === 0)
            ) {
              normalizedAlpha = 1;
            }

            // Tween keyframes have their alpha adjusted
            if (secondKeyframe.kind === 'Tween') {
              normalizedAlpha = TweenService.GetValue(
                normalizedAlpha,
                secondKeyframe.kindData.easingStyle,
                secondKeyframe.kindData.easingDirection
              );
            }

            let newValue: KeyframeValue | undefined;

            if (typeIs(firstKeyframe.value, 'number')) {
              // Numbers can use basic lerping
              newValue = lerp(
                firstKeyframe.value,
                secondKeyframe.value as number,
                normalizedAlpha
              );
            } else if (typeIs(firstKeyframe.value, 'boolean')) {
              // Booleans are instantaneous changes
              newValue =
                normalizedAlpha === 1
                  ? secondKeyframe.value
                  : firstKeyframe.value;
            } else if (typeIs(firstKeyframe.value, 'string')) {
              // Strings are instantaneous changes
              newValue =
                normalizedAlpha === 1
                  ? secondKeyframe.value
                  : firstKeyframe.value;
            } else if (typeIs(firstKeyframe.value, 'UDim')) {
              // UDims need to have both scale and offset manually lerped
              newValue = new UDim(
                lerp(
                  firstKeyframe.value.Scale,
                  (secondKeyframe.value as UDim).Scale,
                  normalizedAlpha
                ),
                lerp(
                  firstKeyframe.value.Offset,
                  (secondKeyframe.value as UDim).Offset,
                  normalizedAlpha
                )
              );
            } else {
              // All other values have their own :Lerp() method so we can just use that
              // FIXME: Ignore because sometimes dynamic typing is difficult :(
              // @ts-ignore
              newValue = firstKeyframe.value.Lerp(
                secondKeyframe.value,
                normalizedAlpha
              );
            }

            internalPropertyChange.value = true;
            // @ts-ignore
            selectedInstance[prop] = newValue;
            internalPropertyChange.value = false;
          }
        });
      });
    } else if (
      !globalScrubber &&
      selected.isSome() &&
      instances.includes(selected.unwrap())
    ) {
      const selectedInstance = selected.unwrap();
      const ID = instances.indexOf(selectedInstance);
      const instanceProperties = properties[ID];

      instanceProperties.forEach((prop) => {
        // Get keyframes only related to this property
        const propKeyframes = keyframes.filter((kf) => {
          return kf.instance === selectedInstance && kf.property === prop;
        });

        // Sort keyframes by position
        const sortedKeyframes = propKeyframes.sort((a, b) => {
          return a.position < b.position;
        });

        // Convert scrubber position to seconds
        const scrubberPosTime = tonumber(
          string.format('%.2f', scrubberPos * maxTime)
        )!;

        let firstKeyframe: IKeyframe | undefined;
        let secondKeyframe: IKeyframe | undefined;

        // Find the keyframes surrounding the scrubber
        sortedKeyframes.forEach((kf, index) => {
          if (index !== sortedKeyframes.size() - 1) {
            const nextKf = sortedKeyframes[index + 1];

            if (
              kf.position <= scrubberPosTime &&
              nextKf.position > scrubberPosTime
            ) {
              // Scrubber is between two keyframes
              firstKeyframe = kf;
              secondKeyframe = nextKf;
            }
          }
        });

        // Handle the scrubber being after the last keyframe
        if (firstKeyframe === undefined && sortedKeyframes.size() > 0) {
          const lastKf = sortedKeyframes[sortedKeyframes.size() - 1];

          if (scrubberPosTime >= lastKf.position) {
            firstKeyframe = lastKf;
            secondKeyframe = lastKf;
          }
        }

        // Handle the scrubber being before the first keyframe
        if (firstKeyframe === undefined && sortedKeyframes.size() > 0) {
          if (
            scrubberPosTime >= 0 &&
            scrubberPosTime <= sortedKeyframes[0].position
          ) {
            const changedProp = getInitialProperty(selectedInstance, prop);

            if (changedProp) {
              firstKeyframe = {
                instance: selectedInstance,
                property: prop,
                position: 0,
                value: changedProp.value,
                kind: 'Tween',
                kindData: {
                  easingStyle: Enum.EasingStyle.Linear,
                  easingDirection: Enum.EasingDirection.InOut,
                  dampingRatio: 0,
                  frequency: 0,
                },
              };

              secondKeyframe = sortedKeyframes[0];
            }
          }
        }

        // Handle no keyframes
        if (sortedKeyframes.size() === 0) {
          const changedProp = getInitialProperty(selectedInstance, prop);

          if (changedProp) {
            const initialData: IKeyframe = {
              instance: selectedInstance,
              property: prop,
              position: 0,
              value: changedProp.value,
              kind: 'Tween',
              kindData: {
                easingStyle: Enum.EasingStyle.Linear,
                easingDirection: Enum.EasingDirection.InOut,
                dampingRatio: 0,
                frequency: 0,
              },
            };

            firstKeyframe = initialData;
            secondKeyframe = initialData;
          }
        }

        if (firstKeyframe !== undefined && secondKeyframe !== undefined) {
          // Generate an alpha based on the scrubber position relative to
          // its surrounding keyframes
          let normalizedAlpha = normalizeToRange(
            scrubberPosTime,
            firstKeyframe.position,
            secondKeyframe.position,
            0,
            1
          );

          // If the keyframes are the same then the scrubber is past
          // the the second keyframe and therefore you can just use
          // an alpha of 1. Alternatively, if the keyframes are both
          // at position 0 (which isn't usually possible), then the
          // first keyframe is fake and overlapping a new keyframe so
          // an alpha of 1 should be used.
          if (
            firstKeyframe === secondKeyframe ||
            (firstKeyframe.position === secondKeyframe.position &&
              firstKeyframe.position === 0)
          ) {
            normalizedAlpha = 1;
          }

          // Tween keyframes have their alpha adjusted
          if (secondKeyframe.kind === 'Tween') {
            normalizedAlpha = TweenService.GetValue(
              normalizedAlpha,
              secondKeyframe.kindData.easingStyle,
              secondKeyframe.kindData.easingDirection
            );
          }

          let newValue: KeyframeValue | undefined;

          if (typeIs(firstKeyframe.value, 'number')) {
            // Numbers can use basic lerping
            newValue = lerp(
              firstKeyframe.value,
              secondKeyframe.value as number,
              normalizedAlpha
            );
          } else if (typeIs(firstKeyframe.value, 'boolean')) {
            // Booleans are instantaneous changes
            newValue =
              normalizedAlpha === 1
                ? secondKeyframe.value
                : firstKeyframe.value;
          } else if (typeIs(firstKeyframe.value, 'string')) {
            // Strings are instantaneous changes
            newValue =
              normalizedAlpha === 1
                ? secondKeyframe.value
                : firstKeyframe.value;
          } else if (typeIs(firstKeyframe.value, 'UDim')) {
            // UDims need to have both scale and offset manually lerped
            newValue = new UDim(
              lerp(
                firstKeyframe.value.Scale,
                (secondKeyframe.value as UDim).Scale,
                normalizedAlpha
              ),
              lerp(
                firstKeyframe.value.Offset,
                (secondKeyframe.value as UDim).Offset,
                normalizedAlpha
              )
            );
          } else {
            // All other values have their own :Lerp() method so we can just use that
            // FIXME: Ignore because sometimes dynamic typing is difficult :(
            // @ts-ignore
            newValue = firstKeyframe.value.Lerp(
              secondKeyframe.value,
              normalizedAlpha
            );
          }

          internalPropertyChange.value = true;
          // @ts-ignore
          selectedInstance[prop] = newValue;
          internalPropertyChange.value = false;
        }
      });
    }
  }, [scrubberPos, properties, keyframes, globalScrubber, selected]);

  // Validates selected keyframes
  useEffect(() => {
    const newSelected: Array<IKeyframe> = [];

    let changed = false;

    selectedKeyframes.forEach((selectedKf, index, arr) => {
      const existingKf = keyframes.find((kf) => {
        return (
          selectedKf.instance === kf.instance &&
          selectedKf.property === kf.property &&
          selectedKf.position === kf.position
        );
      });

      // A keyframe exists with the same instance, property, and position
      if (existingKf) {
        // Validate keyframe value, kind, & kindData
        if (
          existingKf.value !== selectedKf.value ||
          existingKf.kind !== selectedKf.kind ||
          existingKf.kindData.easingStyle !== selectedKf.kindData.easingStyle ||
          existingKf.kindData.easingDirection !==
            selectedKf.kindData.easingDirection ||
          existingKf.kindData.frequency !== selectedKf.kindData.frequency ||
          existingKf.kindData.dampingRatio !== selectedKf.kindData.dampingRatio
        ) {
          changed = true;
        }

        newSelected.push(existingKf);
      } else {
        changed = true;
      }
    });

    if (changed) setSelectedKeyframes(newSelected);
  }, [keyframes, selectedKeyframes]);

  // Generate EasingStyle & EasingDirection dropdown options
  const [
    showEasingDropdowns,
    styleDropdownText,
    directionDropdownText,
    easingStyleDropdownOptions,
    easingDirectionDropdownOptions,
  ] = useMemo(() => {
    if (selectedKeyframes.size() === 0) {
      return [false, '', '', [] as string[], [] as string[]];
    }

    let selectedAreTweens = true;

    selectedKeyframes.forEach((kf) => {
      if (kf.kind !== 'Tween') {
        selectedAreTweens = false;
      }
    });

    if (!selectedAreTweens) {
      return [false, '', '', [] as string[], [] as string[]];
    } else {
      const styleOpts: string[] = [];
      const dirOpts: string[] = [];

      Enum.EasingStyle.GetEnumItems().forEach((style) => {
        styleOpts.push(style.Name);
      });

      Enum.EasingDirection.GetEnumItems().forEach((dir) => {
        dirOpts.push(dir.Name);
      });

      let usesSameStyle = true;
      const styleVal = selectedKeyframes[0].kindData.easingStyle;

      let usesSameDirection = true;
      const directionVal = selectedKeyframes[0].kindData.easingDirection;

      selectedKeyframes.forEach((kf) => {
        if (kf.kindData.easingStyle !== styleVal) {
          usesSameStyle = false;
        }

        if (kf.kindData.easingDirection !== directionVal) {
          usesSameDirection = false;
        }
      });

      return [
        true,
        usesSameStyle ? styleVal.Name : '...',
        usesSameDirection ? directionVal.Name : '...',
        styleOpts,
        dirOpts,
      ];
    }
  }, [selectedKeyframes, keyframes]);

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

                if (easingStyleDropdownOpen) {
                  setEasingStyleDropdownOpen(false);
                }

                if (easingDirectionDropdownOpen) {
                  setEasingDirectionDropdownOpen(false);
                }

                setActiveContextMenuID('');
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

      {/* Keyboard Listener */}
      <KeyboardListener
        Widget={timelineWidget}
        OnKeyPressed={(input) => {
          switch (input.KeyCode) {
            case Enum.KeyCode.LeftShift:
              shiftPressed.value = true;
              break;
            case Enum.KeyCode.LeftControl:
              ctrlPressed.value = true;
              break;
          }
        }}
        OnKeyReleased={(input) => {
          switch (input.KeyCode) {
            case Enum.KeyCode.LeftShift:
              shiftPressed.value = false;
              break;
            case Enum.KeyCode.LeftControl:
              ctrlPressed.value = false;
              break;
          }
        }}
      />

      {/* Topbar */}
      <Topbar>
        {/* Export All Button */}
        <frame
          Size={new UDim2(0, 0, 1, 0)}
          BorderSizePixel={0}
          BackgroundColor3={theme.GetColor(styleColor.Button)}
          AutomaticSize={Enum.AutomaticSize.X}
          LayoutOrder={-5}
        >
          <uipadding
            PaddingLeft={new UDim(0, 2)}
            PaddingRight={new UDim(0, 2)}
            PaddingTop={new UDim(0, 1)}
            PaddingBottom={new UDim(0, 1)}
          />
          <uicorner CornerRadius={new UDim(0, 4)} />
          <uilistlayout
            FillDirection={Enum.FillDirection.Horizontal}
            HorizontalAlignment={Enum.HorizontalAlignment.Left}
            VerticalAlignment={Enum.VerticalAlignment.Center}
            Padding={new UDim(0, 2)}
          />

          <imagebutton
            BorderSizePixel={0}
            Size={new UDim2(0, 20, 0, 20)}
            BackgroundTransparency={1}
            AnchorPoint={new Vector2(0, 0.5)}
            Position={new UDim2(0, 0, 0.5, 0)}
            Image={'http://www.roblox.com/asset/?id=11780633056'}
            ScaleType={Enum.ScaleType.Fit}
            ImageColor3={theme.GetColor(styleColor.MainText)}
            Event={{
              Activated: () => {
                exportAllAnimations();
                warn(
                  'RoUI3 | Exported all animations into ReplicatedStorage/RoUI3 Exports'
                );
              },
              MouseEnter: (rbx) => {
                rbx.ImageColor3 = theme.GetColor(styleColor.DimmedText);
              },
              MouseLeave: (rbx) => {
                rbx.ImageColor3 = theme.GetColor(styleColor.MainText);
              },
            }}
          >
            <Tooltip Text={'Export all animations'} Widget={timelineWidget} />
          </imagebutton>
        </frame>

        {/* Export Selection Button */}
        {selected.isSome() ? (
          <frame
            Size={new UDim2(0, 0, 1, 0)}
            BorderSizePixel={0}
            BackgroundColor3={theme.GetColor(styleColor.Button)}
            AutomaticSize={Enum.AutomaticSize.X}
            LayoutOrder={-4}
          >
            <uipadding
              PaddingLeft={new UDim(0, 2)}
              PaddingRight={new UDim(0, 2)}
              PaddingTop={new UDim(0, 1)}
              PaddingBottom={new UDim(0, 1)}
            />
            <uicorner CornerRadius={new UDim(0, 4)} />
            <uilistlayout
              FillDirection={Enum.FillDirection.Horizontal}
              HorizontalAlignment={Enum.HorizontalAlignment.Left}
              VerticalAlignment={Enum.VerticalAlignment.Center}
              Padding={new UDim(0, 2)}
            />

            <imagebutton
              BorderSizePixel={0}
              Size={new UDim2(0, 20, 0, 20)}
              BackgroundTransparency={1}
              AnchorPoint={new Vector2(0, 0.5)}
              Position={new UDim2(0, 0, 0.5, 0)}
              Image={'http://www.roblox.com/asset/?id=11780632458'}
              ScaleType={Enum.ScaleType.Fit}
              ImageColor3={theme.GetColor(styleColor.MainText)}
              Event={{
                Activated: () => {
                  exportAnimation(selected.unwrap());
                  warn(
                    'RoUI3 | Exported the current selection into ReplicatedStorage/RoUI3 Exports'
                  );
                },
                MouseEnter: (rbx) => {
                  rbx.ImageColor3 = theme.GetColor(styleColor.DimmedText);
                },
                MouseLeave: (rbx) => {
                  rbx.ImageColor3 = theme.GetColor(styleColor.MainText);
                },
              }}
            >
              <Tooltip Text={'Export selection'} Widget={timelineWidget} />
            </imagebutton>
          </frame>
        ) : undefined}

        {/* Toggle Global Scrubber Button */}
        <frame
          Size={new UDim2(0, 0, 1, 0)}
          BorderSizePixel={0}
          BackgroundColor3={theme.GetColor(styleColor.Button)}
          AutomaticSize={Enum.AutomaticSize.X}
          LayoutOrder={-3}
        >
          <uipadding
            PaddingLeft={new UDim(0, 2)}
            PaddingRight={new UDim(0, 2)}
            PaddingTop={new UDim(0, 1)}
            PaddingBottom={new UDim(0, 1)}
          />
          <uicorner CornerRadius={new UDim(0, 4)} />
          <uilistlayout
            FillDirection={Enum.FillDirection.Horizontal}
            HorizontalAlignment={Enum.HorizontalAlignment.Left}
            VerticalAlignment={Enum.VerticalAlignment.Center}
            Padding={new UDim(0, 2)}
          />

          <imagebutton
            BorderSizePixel={0}
            Size={new UDim2(0, 20, 0, 20)}
            BackgroundTransparency={1}
            AnchorPoint={new Vector2(0, 0.5)}
            Position={new UDim2(0, 0, 0.5, 0)}
            Image={'http://www.roblox.com/asset/?id=11788972495'}
            ScaleType={Enum.ScaleType.Fit}
            ImageColor3={theme.GetColor(
              globalScrubber ? styleColor.DialogMainButton : styleColor.MainText
            )}
            Event={{
              Activated: () => {
                setGlobalScrubber(!globalScrubber);
              },
              MouseEnter: (rbx) => {
                rbx.ImageColor3 = theme.GetColor(
                  globalScrubber
                    ? styleColor.DialogMainButton
                    : styleColor.DimmedText,
                  globalScrubber ? styleMod.Hover : undefined
                );
              },
              MouseLeave: (rbx) => {
                rbx.ImageColor3 = theme.GetColor(
                  globalScrubber
                    ? styleColor.DialogMainButton
                    : styleColor.MainText
                );
              },
            }}
          >
            <Tooltip
              Text={
                'Toggles the global scrubber so that when scrubbing it affects all instances within the ScreenGui not just the current selection'
              }
              Widget={timelineWidget}
            />
          </imagebutton>
        </frame>

        {/* Preview Button */}
        <frame
          Size={new UDim2(0, 0, 1, 0)}
          BorderSizePixel={0}
          BackgroundColor3={theme.GetColor(styleColor.Button)}
          AutomaticSize={Enum.AutomaticSize.X}
          LayoutOrder={-2}
        >
          <uipadding
            PaddingLeft={new UDim(0, 2)}
            PaddingRight={new UDim(0, 2)}
            PaddingTop={new UDim(0, 1)}
            PaddingBottom={new UDim(0, 1)}
          />
          <uicorner CornerRadius={new UDim(0, 4)} />
          <uilistlayout
            FillDirection={Enum.FillDirection.Horizontal}
            HorizontalAlignment={Enum.HorizontalAlignment.Left}
            VerticalAlignment={Enum.VerticalAlignment.Center}
            Padding={new UDim(0, 2)}
          />

          <imagebutton
            BorderSizePixel={0}
            Size={new UDim2(0, 20, 0, 20)}
            BackgroundTransparency={1}
            AnchorPoint={new Vector2(0, 0.5)}
            Position={new UDim2(0, 0, 0.5, 0)}
            Image={'http://www.roblox.com/asset/?id=11789170706'}
            ScaleType={Enum.ScaleType.Fit}
            ImageColor3={theme.GetColor(
              previewing ? styleColor.DimmedText : styleColor.MainText
            )}
            Event={{
              Activated: (rbx) => {
                if (previewing) return;

                setPreviewing(true);

                let nv = new Instance('NumberValue');
                const tweenService = game.GetService('TweenService');

                nv.GetPropertyChangedSignal('Value').Connect(() => {
                  setScrubberPos(nv.Value / maxTime);
                });

                let tween = tweenService.Create(
                  nv,
                  new TweenInfo(maxTime, Enum.EasingStyle.Linear),
                  { Value: maxTime }
                );
                tween.Completed.Connect(() => {
                  nv.Destroy();
                  setPreviewing(false);
                  rbx.ImageColor3 = theme.GetColor(styleColor.MainText);
                });
                tween.Play();
              },
              MouseEnter: (rbx) => {
                rbx.ImageColor3 = theme.GetColor(styleColor.DimmedText);
              },
              MouseLeave: (rbx) => {
                rbx.ImageColor3 = theme.GetColor(
                  previewing ? styleColor.DimmedText : styleColor.MainText
                );
              },
            }}
          >
            <Tooltip
              Text={
                previewing
                  ? 'Currently running preview...'
                  : 'Previews the current animation'
              }
              Widget={timelineWidget}
            />
          </imagebutton>
        </frame>

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
          <PairedDropdown
            Widget={timelineWidget}
            Image={'rbxassetid://3192519002'}
            ButtonTooltip={'Add property to animate to selected instance'}
            DropdownTooltip={'Select a property to add'}
            DropdownOptions={supportedProperties.unwrapOr([])}
            DropdownOpen={propertyDropdownOpen}
            DropdownSelection={propertyDropdownValue}
            ButtonCallback={() => {
              const currentSelection = selected.unwrap();
              const ID = instances.indexOf(currentSelection);

              if (ID === -1 || !properties[ID].has(propertyDropdownValue)) {
                const propValue = currentSelection[
                  propertyDropdownValue as InstancePropertyNames<
                    typeof currentSelection
                  >
                ] as KeyframeValue;

                // Create initial property keyframe
                updateKeyframe(
                  currentSelection,
                  propertyDropdownValue,
                  tonumber(string.format('%.2f', scrubberPos * maxTime))!,
                  propValue,
                  'Tween'
                );
              }
            }}
            DropdownSelectedCallback={(val) => {
              setPropertyDropdownValue(val);
              setPropertyDropdownOpen(false);
            }}
            DropdownClickCallback={() => {
              setPropertyDropdownOpen(!propertyDropdownOpen);
            }}
          />
        ) : undefined}

        {/* Easing Dropdowns */}
        {showEasingDropdowns ? (
          <frame
            Size={new UDim2(0, 0, 1, 0)}
            BorderSizePixel={0}
            BackgroundColor3={theme.GetColor(styleColor.Button)}
            AutomaticSize={Enum.AutomaticSize.X}
          >
            <uipadding
              PaddingLeft={new UDim(0, 3)}
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
            <Dropdown
              Open={easingStyleDropdownOpen}
              Options={easingStyleDropdownOptions}
              Selected={styleDropdownText}
              Height={20}
              OnOptionSelected={(newStyle) => {
                selectedKeyframes.forEach((kf) => {
                  if (kf.kindData.easingStyle.Name !== newStyle) {
                    updateKeyframe(
                      kf.instance,
                      kf.property,
                      kf.position,
                      kf.value,
                      kf.kind,
                      {
                        easingStyle: Enum.EasingStyle.GetEnumItems().find(
                          (sty) => {
                            return sty.Name === newStyle;
                          }
                        ),
                      }
                    );
                  }
                });

                setEasingStyleDropdownOpen(false);
              }}
              OnClick={() => {
                setEasingStyleDropdownOpen(!easingStyleDropdownOpen);
              }}
            >
              <Tooltip
                Widget={timelineWidget}
                Text={'Set EasingStyle of selected keyframes'}
              />
            </Dropdown>
            <Dropdown
              Open={easingDirectionDropdownOpen}
              Options={easingDirectionDropdownOptions}
              Selected={directionDropdownText}
              Height={20}
              OnOptionSelected={(newDirection) => {
                selectedKeyframes.forEach((kf) => {
                  if (kf.kindData.easingDirection.Name !== newDirection) {
                    updateKeyframe(
                      kf.instance,
                      kf.property,
                      kf.position,
                      kf.value,
                      kf.kind,
                      {
                        easingDirection:
                          Enum.EasingDirection.GetEnumItems().find((dir) => {
                            return dir.Name === newDirection;
                          }),
                      }
                    );
                  }
                });

                setEasingDirectionDropdownOpen(false);
              }}
              OnClick={() => {
                setEasingDirectionDropdownOpen(!easingDirectionDropdownOpen);
              }}
            >
              <Tooltip
                Widget={timelineWidget}
                Text={'Set EasingDirection of selected keyframes'}
              />
            </Dropdown>
            <frame Size={new UDim2(0, 2, 1, 0)} BackgroundTransparency={1} />
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
                      Selection.Set([]);
                      setSelected(Option.none());
                    } else {
                      Selection.Set([item]);
                      setSelected(Option.some(item));
                    }
                  },
                  () => {
                    Selection.Set([item]);
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
                <ContextMenu
                  Widget={timelineWidget}
                  ID={ContextMenuID.TimelineContent}
                  RightClickCallback={contextMenuClicked}
                  Visible={
                    activeContextMenuID === ContextMenuID.TimelineContent
                  }
                  Options={[
                    {
                      Text: 'Delete keyframes',
                      Tooltip: 'Deletes any currently selected keyframes',
                      Callback: (_, input) => {
                        if (
                          input.UserInputType !==
                          Enum.UserInputType.MouseButton1
                        )
                          return;
                        if (input.UserInputState !== Enum.UserInputState.Begin)
                          return;

                        deleteKeyframes(selectedKeyframes);
                        setSelectedKeyframes([]);
                        setActiveContextMenuID('');
                      },
                    },
                  ]}
                ></ContextMenu>
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
                  SortOrder={Enum.SortOrder.Name}
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
                  SortOrder={Enum.SortOrder.Name}
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
      originalRoot: state.appData.originalRoot.unwrap(),
      instances: state.appData.instances,
      properties: state.appData.properties,
      keyframes: state.appData.keyframes,
    };
  },
  (dispatch: StoreDispatch): IDispatchProps => {
    return {
      updateKeyframe: (instance, property, position, value, kind, kindData) => {
        dispatch({
          type: 'UpdateKeyframe',
          instance: instance,
          property: property,
          position: position,
          value: value,
          kind: kind,
          easingStyle: kindData?.easingStyle,
          easingDirection: kindData?.easingDirection,
          dampingRatio: kindData?.dampingRatio,
          frequency: kindData?.frequency,
        });
      },
      deleteKeyframes: (keyframes) => {
        dispatch({
          type: 'DeleteKeyframes',
          keyframes: keyframes,
        });
      },
      deleteProperty: (instance, property) => {
        dispatch({
          type: 'DeleteInstanceProperty',
          instance: instance,
          property: property,
        });
      },
    };
  }
)(new RoactHooks(Roact)(TimelineRoot));
