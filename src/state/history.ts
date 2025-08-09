import { peek } from '@rbxts/charm';
import { animationRegistry, dispatchEditorStateUpdate, KeyframeData, KeyframeValue, selectedKeyframes, settingScrubberPosition } from './editor';
import { Action, ActionCreateKeyframe, ActionDeleteInstanceProperty, ActionDeleteKeyframe, ActionUpdateKeyframe } from './editorActions';
import { getCachedValueOfProperty, hasPropertyBeenKeyed, setPropertyKeyed } from './properties';
import { forceUpdatePreview } from './timeline';
import { ToastManager, ToastType } from './toasts';
import { getKeyframeValuePrettified } from 'utils/keyframeUtils';

export interface HistoryAction {
  actionName: string;
  do(): void;
  undo(): void;
}

interface MergeableAction {
  lastModified: number;
}

type ActionPayload<A extends Action> = Omit<A, 'type'>;

export class ActionBatch implements HistoryAction {
  public actionName = 'ActionBatch';

  constructor(private allActions: HistoryAction[] = []) {}

  addAction(action: HistoryAction) {
    this.allActions.push(action);
  }

  getActions() {
    return this.allActions;
  }

  do() {
    this.allActions.forEach((action) => action.do());
  }

  undo() {
    for (let i = this.allActions.size() - 1; i >= 0; i--) {
      this.allActions[i].undo();
    }
  }
}

export class DeleteInstancePropertyAction extends ActionBatch {
  public actionName = 'DeleteInstancePropertyAction';
  public instance: Instance;
  public property: string;

  constructor(payload: ActionPayload<ActionDeleteInstanceProperty>) {
    super();

    this.instance = payload.instance;
    this.property = payload.property;

    const instanceData = peek(animationRegistry).get(this.instance);

    if (instanceData !== undefined) {
      instanceData.keyframes.forEach((kf) => {
        this.addAction(new DeleteKeyframeAction({ ...kf }));
      });
    }
  }

  do() {
    // Delete all keyframes
    super.do();

    // Actually delete the property
    dispatchEditorStateUpdate({
      type: 'DeleteInstanceProperty',
      instance: this.instance,
      property: this.property,
    });
  }

  undo() {
    // Recreate the property
    dispatchEditorStateUpdate({
      type: 'AddInstanceProperty',
      instance: this.instance,
      property: this.property,
    });

    // Recreate all keyframes
    super.undo();
  }
}

export class DeleteKeyframeAction implements HistoryAction {
  public actionName = 'DeleteKeyframeAction';

  private keyframe?: KeyframeData;

  constructor(payload: ActionPayload<ActionDeleteKeyframe>) {
    this.keyframe = { ...findKeyframe(payload) } as KeyframeData;
  }

  getKeyframe() {
    return this.keyframe;
  }

  do() {
    if (this.keyframe !== undefined) {
      dispatchEditorStateUpdate({
        type: 'DeleteKeyframe',
        ...this.keyframe,
      });
    }
  }

  undo() {
    if (this.keyframe !== undefined) {
      dispatchEditorStateUpdate({
        type: 'CreateKeyframe',
        ...this.keyframe,
      });
    }
  }
}

export class CreateKeyframeAction implements HistoryAction {
  public actionName = 'CreateKeyframeAction';

  constructor(private payload: ActionPayload<ActionCreateKeyframe>) {}

  getKeyframe() {
    return this.payload;
  }

  do() {
    dispatchEditorStateUpdate({
      type: 'CreateKeyframe',
      ...this.payload,
    });
  }

  undo() {
    dispatchEditorStateUpdate({
      type: 'DeleteKeyframe',
      ...this.payload,
    });

    const instanceData = peek(animationRegistry).get(this.payload.instance);

    if (instanceData !== undefined) {
      const propertyKeyframes = instanceData.keyframes.filter((kf) => kf.property === this.payload.property);

      setPropertyKeyed(this.payload.instance, this.payload.property, propertyKeyframes.size() > 0);
    }
  }
}

export class UpdateKeyframeAction implements HistoryAction, MergeableAction {
  public actionName = 'UpdateKeyframeAction';
  public lastModified: number;

  constructor(private fromKeyframeData: KeyframeData, private toKeyframeData: KeyframeData, public autoKeyed: boolean = false) {
    this.lastModified = tick();
  }

  do() {
    dispatchEditorStateUpdate({
      type: 'UpdateKeyframe',
      ...this.toKeyframeData,
    });
  }

  undo() {
    dispatchEditorStateUpdate({
      type: 'UpdateKeyframe',
      ...this.fromKeyframeData,
    });
  }

  isKeyframeTimeChanging() {
    return this.fromKeyframeData.time !== this.toKeyframeData.time;
  }

  getFromKeyframe() {
    return this.fromKeyframeData;
  }

  getToKeyframe() {
    return this.toKeyframeData;
  }

  canMerge(withAction: UpdateKeyframeAction) {
    return this.toKeyframeData.instance === withAction.toKeyframeData.instance && this.toKeyframeData.property === withAction.toKeyframeData.property;
  }

  merge(withAction: UpdateKeyframeAction) {
    this.toKeyframeData = { ...withAction.toKeyframeData };
  }
}

// Used for when a baseline keyframe is created alongside a new keyframe
class BaselineKeyframeAction extends ActionBatch implements MergeableAction {
  public actionName = 'BaselineKeyframeAction';
  public lastModified: number;

  constructor(public baselineCreateAction: CreateKeyframeAction, public newKeyframeAction: AutoKeyframeWithUpdateAction) {
    super([baselineCreateAction, newKeyframeAction]);

    this.lastModified = tick();
  }

  canBatch(withAction: UpdateKeyframeAction) {
    return this.newKeyframeAction.canBatch(withAction);
  }

  batchAutokeyUpdate(withAction: UpdateKeyframeAction) {
    this.newKeyframeAction.batchAutokeyUpdate(withAction);
  }
}

// Used for when a keyframe is auto-keyed to listen for continuous updates
class AutoKeyframeWithUpdateAction extends ActionBatch implements MergeableAction {
  public actionName = 'AutoKeyframeWithUpdateAction';
  public lastModified: number;

  constructor(public createAction: CreateKeyframeAction, public updateAction: UpdateKeyframeAction) {
    super([createAction, updateAction]);

    this.lastModified = tick();
  }

  canBatch(withAction: UpdateKeyframeAction) {
    const createdKeyframe = this.createAction.getKeyframe();

    if (withAction.isKeyframeTimeChanging()) return false;

    // Determine if we can batch based on instance & property
    const toKeyframe = withAction.getToKeyframe();
    if (createdKeyframe.instance !== toKeyframe.instance || createdKeyframe.property !== toKeyframe.property) return false;

    // Determine if we already included an updated keyframe
    if (this.getActions().size() === 2) {
      const updateAction = this.getActions()[1] as UpdateKeyframeAction;

      return updateAction.canMerge(withAction);
    }

    return true;
  }

  batchAutokeyUpdate(withAction: UpdateKeyframeAction) {
    if (this.getActions().size() === 2) {
      const updateAction = this.getActions()[1] as UpdateKeyframeAction;

      updateAction.merge(withAction);
    } else if (this.getActions().size() === 1) {
      super.addAction(withAction);
    }
  }
}

type KeyframeSearchPayload = {
  instance: Instance;
  property: string;
  time: number;
};

// Helper function to locate a keyframe
function findKeyframe(payload: KeyframeSearchPayload) {
  let instanceData = peek(animationRegistry).get(payload.instance);

  if (instanceData === undefined) return undefined;

  instanceData = peek(animationRegistry).get(payload.instance)!;

  const existingKeyframe = instanceData.keyframes.find((kf) => kf.property === payload.property && kf.time === payload.time);

  return existingKeyframe;
}

type KeyframeDefaultsPayload = ActionPayload<ActionUpdateKeyframe>;

// Helper function to create a keyframe using defaults
function makeKeyframeFromPayload(payload: KeyframeDefaultsPayload) {
  const scrubberPositionUnformatted = peek(settingScrubberPosition);
  const scrubberPosition = tonumber(string.format('%.2f', scrubberPositionUnformatted))!;
  const timeToUse = payload.time ?? scrubberPosition;

  const newKeyframe = {
    instance: payload.instance,
    property: payload.property,
    time: timeToUse,
    value: payload.value ?? payload.instance[payload.property as InstancePropertyNames<typeof payload.instance>],
    easingDirection: payload.easingDirection ?? Enum.EasingDirection.Out,
    easingStyle: payload.easingStyle ?? Enum.EasingStyle.Quad,
  } as KeyframeData;

  return newKeyframe;
}

// Special function to determine if a single action or batch is needed for keyframe updates
export function makeUpdateKeyframeAction(payload: ActionPayload<ActionUpdateKeyframe>, autoKeyed: boolean = false): HistoryAction {
  dispatchEditorStateUpdate({
    type: 'AddInstanceProperty',
    instance: payload.instance,
    property: payload.property,
  });

  const newKeyframe = makeKeyframeFromPayload(payload);
  const existingKeyframe = findKeyframe({ ...payload, time: newKeyframe.time } as ActionPayload<ActionDeleteKeyframe>);
  const alreadyKeyed = hasPropertyBeenKeyed(payload.instance, payload.property);

  // 1. Existing keyframe to be updated
  if (existingKeyframe) {
    return new UpdateKeyframeAction(
      {
        ...existingKeyframe,
      },
      { ...newKeyframe },
      autoKeyed
    );
  }

  // 2. First keyframe ever for this property -> batch a baseline keyframe & new keyframe
  if (!alreadyKeyed) {
    return new BaselineKeyframeAction(
      new CreateKeyframeAction({
        instance: payload.instance,
        property: payload.property,
        time: 0,
        value: getCachedValueOfProperty(payload.instance, payload.property) as KeyframeValue,
        easingDirection: Enum.EasingDirection.Out,
        easingStyle: Enum.EasingStyle.Quad,
      }),
      new AutoKeyframeWithUpdateAction(new CreateKeyframeAction(newKeyframe), new UpdateKeyframeAction({ ...newKeyframe }, { ...newKeyframe }, true))
    );
  }

  // 3. Auto-keyed so use an AutoKeyframeWithUpdateAction
  if (autoKeyed) {
    const autoKeyframe = new CreateKeyframeAction(newKeyframe);
    const updateKeyframe = new UpdateKeyframeAction({ ...newKeyframe }, { ...newKeyframe }, true);

    return new AutoKeyframeWithUpdateAction(autoKeyframe, updateKeyframe);
  }

  // 4. Property already keyed & not auto-keyed & not existing -> only a new keyframe
  return new CreateKeyframeAction(newKeyframe);
}

const MERGE_TIMEOUT = 0.25; // Seconds after which an action merge is still possible
const UNDO_LIMIT = 100; // Limit to number of undo actions

export namespace ActionManager {
  const undoStack: HistoryAction[] = [];
  const redoStack: HistoryAction[] = [];

  export function execute(action: HistoryAction, tryMerge?: boolean) {
    if (tryMerge && undoStack.size() > 0) {
      const now = tick();
      const lastActionIndex = undoStack.size() - 1;
      const lastAction = undoStack[lastActionIndex] as HistoryAction & MergeableAction;

      if (lastAction.lastModified !== undefined && now - lastAction.lastModified <= MERGE_TIMEOUT) {
        if (lastAction instanceof BaselineKeyframeAction && action instanceof UpdateKeyframeAction) {
          if (action.autoKeyed && lastAction.canBatch(action)) {
            lastAction.batchAutokeyUpdate(action);
            lastAction.lastModified = now;
            action.do();
            redoStack.clear();

            return;
          }
        } else if (lastAction instanceof AutoKeyframeWithUpdateAction && action instanceof UpdateKeyframeAction) {
          if (action.autoKeyed && lastAction.canBatch(action)) {
            lastAction.batchAutokeyUpdate(action);
            lastAction.lastModified = now;
            action.do();
            redoStack.clear();

            return;
          }
        } else if (lastAction instanceof UpdateKeyframeAction && action instanceof UpdateKeyframeAction) {
          if (action.autoKeyed && lastAction.canMerge(action)) {
            lastAction.merge(action);
            lastAction.lastModified = now;
            lastAction.do();
            redoStack.clear();

            return;
          }
        }
      }
    }

    action.do();
    undoStack.push(action);
    redoStack.clear();

    if (undoStack.size() > UNDO_LIMIT) {
      undoStack.remove(0);
    }
  }

  function formatToastMessage(action: HistoryAction, actionType: 'undo' | 'redo') {
    const prefix = actionType === 'undo' ? 'UNDO' : 'REDO';

    let message: string = `<b>${prefix}</b> Action ${actionType === 'undo' ? 'undone' : 'redone'}!`;

    switch (true) {
      case action instanceof CreateKeyframeAction:
        const createKeyframe = action.getKeyframe();
        message = `<b>${prefix}</b> • Keyframe created ${createKeyframe.instance.Name} (${createKeyframe.property}) @ ${string.format(
          '%.2f',
          createKeyframe.time
        )} s`;
        break;
      case action instanceof DeleteKeyframeAction:
        const deleteKeyfame = action.getKeyframe();
        if (deleteKeyfame !== undefined)
          message = `<b>${prefix}</b> • Keyframe deleted ${deleteKeyfame.instance.Name} (${deleteKeyfame.property}) @ ${string.format(
            '%.2f',
            deleteKeyfame.time
          )} s`;
        break;
      case action instanceof UpdateKeyframeAction:
        const toKeyframe = action.getToKeyframe();
        message = `<b>${prefix}</b> • Keyframe updated ${toKeyframe.instance.Name} (${toKeyframe.property}) @ ${string.format(
          '%.2f',
          toKeyframe.time
        )} s`;
        break;
      case action instanceof AutoKeyframeWithUpdateAction:
        const actions = action.getActions();
        if (actions.size() > 1) {
          const updateKeyframeAction = actions[1] as UpdateKeyframeAction;
          const updateKeyframe = updateKeyframeAction.getToKeyframe();
          message = `<b>${prefix}</b> • Keyframe created & updated ${updateKeyframe.instance.Name} (${updateKeyframe.property}) @ ${string.format(
            '%.2f',
            updateKeyframe.time
          )} s`;
        }
        break;
      case action instanceof BaselineKeyframeAction:
        const bActions = action.getActions();
        if (bActions.size() > 1) {
          const autoKeyframeWithUpdateAction = bActions[1] as AutoKeyframeWithUpdateAction;
          const updateKfAction = autoKeyframeWithUpdateAction.getActions()[1] as UpdateKeyframeAction;
          const updateKeyframe = updateKfAction.getToKeyframe();
          message = `<b>${prefix}</b> • Keyframes created & updated ${updateKeyframe.instance.Name} (${updateKeyframe.property}) @ ${string.format(
            '%.2f',
            updateKeyframe.time
          )} s`;
        }
        break;
    }

    return message;
  }

  export function undo() {
    const action = undoStack.pop();

    if (!action) return;

    action.undo();
    redoStack.push(action);

    selectedKeyframes([]);
    forceUpdatePreview();

    const message = formatToastMessage(action, 'undo');

    ToastManager.addToast({
      type: ToastType.Success,
      message: message,
      duration: 3,
    });
  }

  export function redo() {
    const action = redoStack.pop();

    if (!action) return;

    action.do();
    undoStack.push(action);

    selectedKeyframes([]);
    forceUpdatePreview();

    const message = formatToastMessage(action, 'redo');

    ToastManager.addToast({
      type: ToastType.Success,
      message: message,
      duration: 3,
    });
  }

  export function clearHistory() {
    undoStack.clear();
    redoStack.clear();
  }
}
