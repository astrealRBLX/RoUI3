import { atom, peek } from '@rbxts/charm';
import { KeyframeData, selectedKeyframes, settingScrubberPosition, settingSyncSelections } from './editor';
import { ActionBatch, ActionManager, DeleteKeyframeAction, makeUpdateKeyframeAction } from './history';
import { forceUpdatePreview, instanceTreeSelection } from './timeline';
import { ToastManager, ToastType } from './toasts';
import { getAnimatableProperties, SupportedClass } from 'utils/animatableProperties';

export const clipboardAtom = atom<KeyframeData[]>([]);

export namespace ClipboardManager {
  export function copy() {
    const selectedKfs = peek(selectedKeyframes);

    if (selectedKfs.size() === 0) {
      ToastManager.addToast({
        type: ToastType.Info,
        message: `<b>Clipboard</b> • No keyframes selected to copy`,
      });

      return;
    }

    clipboardAtom([...selectedKfs]);

    ToastManager.addToast({
      type: ToastType.Success,
      message: `<b>Clipboard</b> • Copied ${peek(clipboardAtom).size()} keyframe(s)!`,
    });
  }

  export function cut() {
    const selectedKfs = peek(selectedKeyframes);

    if (selectedKfs.size() === 0) {
      ToastManager.addToast({
        type: ToastType.Info,
        message: `<b>Clipboard</b> • No keyframes selected to copy`,
      });

      return;
    }

    clipboardAtom([...selectedKfs]);

    const actionBatch = new ActionBatch();

    selectedKfs.forEach((kf) => {
      actionBatch.addAction(
        new DeleteKeyframeAction({
          instance: kf.instance,
          property: kf.property,
          time: kf.time,
        })
      );
    });

    ActionManager.execute(actionBatch);
    actionBatch.setActionToast(`${actionBatch.getActions().size()} keyframe(s) cut`);
    forceUpdatePreview();
    selectedKeyframes([]);

    ToastManager.addToast({
      type: ToastType.Success,
      message: `<b>Clipboard</b> • Cut ${peek(clipboardAtom).size()} keyframe(s)`,
    });
  }

  export function paste() {
    const clipboard = peek(clipboardAtom);

    if (clipboard.size() === 0) {
      ToastManager.addToast({
        type: ToastType.Info,
        message: '<b>Clipboard</b> • Clipboard is empty',
      });

      return;
    }

    const selectedInstanceOption = peek(instanceTreeSelection);

    if (selectedInstanceOption.isNone()) {
      ToastManager.addToast({
        type: ToastType.Info,
        message: '<b>Clipboard</b> • Cannot paste clipboard due to no instance being selected',
      });

      return;
    }

    const selectedInstance = selectedInstanceOption.unwrap();
    const scrubberPos = peek(settingScrubberPosition);
    const animatableProperties = getAnimatableProperties(selectedInstance.ClassName as SupportedClass);

    const minTime = math.min(...clipboard.map((kf) => kf.time));

    const actionBatch = new ActionBatch();

    clipboard.forEach((kf) => {
      if (animatableProperties.includes(kf.property)) {
        const newTime = scrubberPos + (kf.time - minTime);

        const action = makeUpdateKeyframeAction({
          instance: selectedInstance,
          property: kf.property,
          time: newTime,
          value: kf.value,
          easingDirection: kf.easingDirection,
          easingStyle: kf.easingStyle,
        });

        actionBatch.addAction(action);
      }
    });

    ActionManager.execute(actionBatch);
    actionBatch.setActionToast(`${actionBatch.getActions().size()} keyframe(s) pasted`);
    forceUpdatePreview();

    ToastManager.addToast({
      type: ToastType.Success,
      message: `<b>Clipboard</b> • Pasted ${clipboard.size()} keyframe(s)`,
    });
  }

  export function clearClipboard() {
    clipboardAtom([]);
  }
}
