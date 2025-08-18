import { peek } from '@rbxts/charm';
import { Selection } from '@rbxts/services';
import { instanceTreeSelection, screenGuiSelection } from 'state/timeline';

export function isValidAnimatableSelection(selection: Instance) {
  const screenGui = peek(screenGuiSelection).unwrap();
  const isValid = selection.IsDescendantOf(screenGui) && selection.IsA('GuiObject');

  return isValid;
}

export function isSelectionLinked() {
  const selections = Selection.Get();

  if (selections.size() === 1 && isValidAnimatableSelection(selections[0])) {
    const instanceSelection = peek(instanceTreeSelection);

    if (instanceSelection.isSome() && instanceSelection.unwrap() === selections[0]) {
      return true;
    }
  }

  return false;
}
