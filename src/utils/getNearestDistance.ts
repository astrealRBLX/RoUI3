// Utility function for calculating the nearest distance
// and original position when given an array
// of positions (numbers in the range [0,1])
// and another position (also in [0,1])

import { getSortedDistances } from './getSortedDistances';

// *Array param should not contain duplicate positions*
export const getNearestDistance = (
  staticPosition: number,
  otherValues: number[]
) => {
  const sortedDistances = getSortedDistances(staticPosition, otherValues);

  return sortedDistances[0];
};
