import { AppStore } from 'rodux/store';
import { IKeyframe } from 'rodux/reducers/dataReducer';
import { KeyframeValue } from 'rodux/actions/dataActions';

interface IExportedKeyframe {
  position: number;
  property: string;
  easingStyle: string;
  easingDirection: string;
  value: KeyframeValue;
}

// Exports an animation generating its keyframes
export const exportAnimation = (inst: Instance) => {
  const appData = AppStore.getState().appData;

  const instanceKeyframes = appData.keyframes.filter(
    (kf) => kf.instance === inst
  );

  const propertiesID = appData.instances.indexOf(inst);
  const properties = appData.properties[propertiesID];
  const keyframeGroups: IExportedKeyframe[][] = [];

  // Generate all keyframe groups
  properties.forEach((property) => {
    let keyframeGroupIndex = 0;
    const keyframesByProperty: IKeyframe[] = [];

    instanceKeyframes.forEach((kf) => {
      if (kf.property !== property) return;

      keyframesByProperty.push(kf);
    });

    keyframesByProperty.sort((a, b) => {
      return a.position < b.position;
    });

    keyframesByProperty.forEach((kf) => {
      if (keyframeGroups[keyframeGroupIndex] === undefined) {
        keyframeGroups[keyframeGroupIndex] = [];
      }

      keyframeGroups[keyframeGroupIndex].push({
        position: kf.position,
        value: kf.value,
        property: kf.property,
        easingStyle: kf.kindData.easingStyle.Name,
        easingDirection: kf.kindData.easingDirection.Name,
      });

      keyframeGroupIndex += 1;
    });
  });

  const animController = new Instance('AnimationController');
  animController.Name = inst.Name + ' Animation';

  keyframeGroups.forEach((kfGroup, kfGIndex) => {
    const keyframeFolder = new Instance('Folder', animController);
    keyframeFolder.Name = 'keyframes_' + kfGIndex;

    kfGroup.forEach((kf) => {
      const keyframeInst = new Instance('Keyframe', keyframeFolder);
      keyframeInst.Name = kf.property;
      keyframeInst.Time = kf.position;
      keyframeInst.SetAttribute('Value', kf.value);
      keyframeInst.SetAttribute('Property', kf.property);
      keyframeInst.SetAttribute('EasingStyle', kf.easingStyle);
      keyframeInst.SetAttribute('EasingDirection', kf.easingDirection);
    });
  });

  const RS = game.GetService('ReplicatedStorage');
  let animExportsFolder = RS.FindFirstChild('RoUI3 Exports');
  if (!animExportsFolder) {
    animExportsFolder = new Instance('Folder', RS);
    animExportsFolder.Name = 'RoUI3 Exports';
  }

  animController.Parent = animExportsFolder;
};

export const exportAllAnimations = () => {
  const appData = AppStore.getState().appData;

  appData.instances.forEach((inst) => {
    exportAnimation(inst);
  });
};
