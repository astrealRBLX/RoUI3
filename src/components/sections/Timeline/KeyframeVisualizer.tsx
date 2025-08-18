import React, { useRef } from '@rbxts/react';
import { useAtom } from '@rbxts/react-charm';
import { DraggingKeyframeData, KeyframeData, previewKeyframesAtom, settingMaxTimelineLength } from 'state/editor';
import { getKeyframeColorFromEasingStyle } from 'utils/keyframeUtils';
import { Palette } from 'utils/styling';

interface KeyframeRefData {
  kf: KeyframeData;
  ref: React.RefObject<Frame>;
}

interface KeyframeVisualizerProps {
  keyframeRefData: KeyframeRefData[];
}

export function KeyframeVisualizer({ keyframeRefData }: KeyframeVisualizerProps) {
  const maxTimelineLength = useAtom(settingMaxTimelineLength);
  const previewKeyframes = useAtom(previewKeyframesAtom);

  const visualizerRef = useRef<Frame>();

  const keyframesToPreview: { previewData: DraggingKeyframeData; ref: React.RefObject<Frame> }[] = [];
  const previewKeyframeElements: React.ReactChild[] = [];

  if (previewKeyframes.size() > 0) {
    keyframeRefData.forEach((data) => {
      const exists = previewKeyframes.find(
        (previewKfData) =>
          previewKfData.keyframe.instance === data.kf.instance &&
          previewKfData.keyframe.property === data.kf.property &&
          previewKfData.keyframe.time === data.kf.time
      );

      if (exists !== undefined) {
        keyframesToPreview.push({
          previewData: exists,
          ref: data.ref,
        });
      }
    });

    keyframesToPreview.forEach((kfToPreview) => {
      if (kfToPreview.ref.current && visualizerRef.current) {
        let isOverlapping = false;

        keyframeRefData.forEach((data) => {
          if (
            data.kf.instance === kfToPreview.previewData.keyframe.instance &&
            data.kf.property === kfToPreview.previewData.keyframe.property &&
            data.kf.time === kfToPreview.previewData.newTime
          ) {
            isOverlapping = true;
          }
        });

        previewKeyframeElements.push(
          <frame
            Active={true}
            BackgroundTransparency={0.6}
            AnchorPoint={new Vector2(0.5, 0.5)}
            Size={new UDim2(0, 9, 0, 9)}
            Position={
              new UDim2(
                kfToPreview.previewData.newTime / maxTimelineLength,
                0,
                0,
                kfToPreview.ref.current.AbsolutePosition.Y - visualizerRef.current.AbsolutePosition.Y + 4
              )
            }
            ZIndex={15}
            Rotation={45}
            BackgroundColor3={isOverlapping ? Palette.Error : getKeyframeColorFromEasingStyle(kfToPreview.previewData.keyframe.easingStyle)}
          >
            <imagebutton
              key={'InputSink'}
              ZIndex={14}
              Size={new UDim2(1, 0, 1, 0)}
              Position={new UDim2(0, 0, 0, 0)}
              BackgroundTransparency={1}
              ImageTransparency={1}
            />
          </frame>
        );
      }
    });
  }

  return (
    <frame key={'KeyframeVisualizerContainer'} ref={visualizerRef} Size={new UDim2(1, 0, 1, 0)} BackgroundTransparency={1}>
      {...previewKeyframeElements}
    </frame>
  );
}
