import Roact from '@rbxts/roact';
import { Option } from '@rbxts/rust-classes';

interface ITrees {
  start: Option<Roact.Tree>;
  timeline: Option<Roact.Tree>;
}

// Manages multiple Roact trees
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

// Create the app's tree manager
export const createTreeManager = () => {
  treeManager = new TreeManager();
  return treeManager;
};

// Get the app's tree manager
export const getTreeManager = () => {
  return treeManager;
};
