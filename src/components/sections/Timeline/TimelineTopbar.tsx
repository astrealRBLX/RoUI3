import React, { useEffect, useMemo, useState } from '@rbxts/react';
import { Pane } from 'components/ui/Pane';
import { Fonts, Palette } from 'utils/styling';
import { TextElement } from '../Topbar/TextElement';
import { useAtom } from '@rbxts/react-charm';
import { currentTimestamps, instanceTreeSelection, TimestampData } from 'state/timeline';
import { Tooltip } from 'components/ui/Tooltip';
import { settingMaxTimelineLength, settingScrubberPosition } from 'state/editor';
import { createPortal } from '@rbxts/react-roblox';
import { getRelativeMouse } from 'utils/getRelativeMouse';

enum TimestampsRenderState {
  All,
  Half,
  None,
}

interface TimelineTopbarProps {
  timelinePaneRef: React.RefObject<Frame>;
}

export function TimelineTopbar({ timelinePaneRef }: TimelineTopbarProps) {
  const selectedTreeInstance = useAtom(instanceTreeSelection);
  const maxTimelineLength = useAtom(settingMaxTimelineLength);

  const [timelinePaneRefReady, setTimelinePaneRefReady] = useState(false);
  const [timestampsRenderState, setTimestampsRenderState] = useState(TimestampsRenderState.All);

  // Effect to determine when the timelinePaneRef is set & ready for use
  useEffect(() => {
    if (timelinePaneRef.current) setTimelinePaneRefReady(true);
  }, [timelinePaneRef.current]);

  // Generate timestamp label elements
  const timestampElements: React.ReactChild[] = useMemo(() => {
    const timestamps: React.ReactChild[] = [];
    const timestampsData: TimestampData[] = [
      {
        time: 0,
        position: 0,
      },
    ];

    let timestampCount = 20;
    switch (timestampsRenderState) {
      case TimestampsRenderState.All:
        timestampCount = 20;
        break;
      case TimestampsRenderState.Half:
        timestampCount = 10;
        break;
      case TimestampsRenderState.None:
        timestampCount = 1;
        break;
    }

    const individualTimestampSize = 1 / timestampCount;

    let currentIter = 0;

    for (
      let i = maxTimelineLength / timestampCount;
      i <= maxTimelineLength + maxTimelineLength / (timestampCount * 2);
      i += maxTimelineLength / timestampCount
    ) {
      timestamps.push(
        <frame
          key={`Timestamp-${string.format('%.2f', i)}`}
          Size={new UDim2(individualTimestampSize, 0, 1, 0)}
          BackgroundTransparency={1}
          LayoutOrder={currentIter}
        >
          <frame
            key={'TimestampMarking'}
            AnchorPoint={new Vector2(1, 0)}
            Size={new UDim2(0, 1, currentIter % 2 === 0 ? 1 : 0.65, 0)}
            Position={new UDim2(1, 0, 0, 0)}
            BorderSizePixel={0}
            BackgroundColor3={Palette.DefaultText}
          />
          <textlabel
            key={'TimestampLabel'}
            Text={string.format('%.2f', i)}
            TextColor3={Palette.DefaultText}
            BackgroundTransparency={1}
            Size={new UDim2(1, -5, 1, 0)}
            FontFace={Fonts.JosefinSans.Regular}
            TextXAlignment={Enum.TextXAlignment.Right}
            TextYAlignment={Enum.TextYAlignment.Top}
            TextSize={10}
          >
            <uipadding PaddingTop={new UDim(0, 1)} />
          </textlabel>
        </frame>
      );

      timestampsData.push({
        time: tonumber(string.format('%.2f', i))!,
        position: (currentIter + 1) * individualTimestampSize,
      });

      currentIter++;
    }

    currentTimestamps(timestampsData);

    return timestamps;
  }, [maxTimelineLength, timestampsRenderState]);

  return (
    <>
      <Pane key={'TimelineTopbar'} padded={false} color={Palette.Background2} size={new UDim2(1, 0, 0, 20)} position={new UDim2(0, 0, 0, 0)}>
        <uilistlayout
          FillDirection={Enum.FillDirection.Horizontal}
          HorizontalAlignment={Enum.HorizontalAlignment.Left}
          VerticalAlignment={Enum.VerticalAlignment.Center}
        />

        <TextElement key={'PropertiesLabel'} text={'Properties'} textSize={12} textColor={Palette.DefaultText} size={new UDim2(0, 150, 1, 0)}>
          <Tooltip
            text={
              selectedTreeInstance.isSome()
                ? `Properties being animated for "${selectedTreeInstance.unwrap().Name}"`
                : 'Properties to be animated when an instance is selected.'
            }
          />
        </TextElement>
        <Pane
          key={'TimestampsList'}
          paddingVertical={new UDim(0, 1)}
          paddingHorizontal={new UDim(0, 0)}
          event={{
            InputBegan: (rbx, input) => {
              if (input.UserInputType !== Enum.UserInputType.MouseButton1) return;

              const mousePos = getRelativeMouse();
              const xScale = (mousePos.X - rbx.AbsolutePosition.X) / rbx.AbsoluteSize.X;

              settingScrubberPosition(xScale * maxTimelineLength);
            },
          }}
        >
          <uiflexitem FlexMode={Enum.UIFlexMode.Fill} />
          <uilistlayout
            FillDirection={Enum.FillDirection.Horizontal}
            HorizontalAlignment={Enum.HorizontalAlignment.Left}
            VerticalAlignment={Enum.VerticalAlignment.Center}
            SortOrder={Enum.SortOrder.LayoutOrder}
          />
          {...timestampElements}
        </Pane>
      </Pane>
      {timelinePaneRefReady
        ? createPortal(
            <frame
              key={'TimestampResizeTracker'}
              BackgroundTransparency={1}
              Size={new UDim2(1, 0, 1, 0)}
              Change={{
                AbsoluteSize: (rbx) => {
                  const { X: x } = rbx.AbsoluteSize;

                  if (x < 775 && x > 450) {
                    setTimestampsRenderState(TimestampsRenderState.Half);
                  } else if (x <= 450) {
                    setTimestampsRenderState(TimestampsRenderState.None);
                  } else {
                    setTimestampsRenderState(TimestampsRenderState.All);
                  }
                },
              }}
            />,
            timelinePaneRef.current!
          )
        : undefined}
    </>
  );
}
