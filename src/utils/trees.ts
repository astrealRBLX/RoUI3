import Roact from '@rbxts/roact';
import { Option } from '@rbxts/rust-classes';

interface ITrees {
  start: Option<Roact.Tree>;
  timeline: Option<Roact.Tree>;
}

export class TreeManager {
  trees: ITrees;

  constructor() {
    this.trees = {
      start: Option.none(),
      timeline: Option.none(),
    };
  }
}

let treeManager: TreeManager;

export const createTreeManager = () => {
  treeManager = new TreeManager();
  return treeManager;
};

export const getTreeManager = () => {
  return treeManager;
};
