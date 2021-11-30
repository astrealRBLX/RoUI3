interface IDistanceResult {
  position: number;
  distance: number;
}

// Utility function for calculating the nearest distance
// and original position when given an array
// of positions (numbers in the range [0,1])
// and another position (also in [0,1])
// *Array param should not contain duplicate positions*
export const getNearestDistance = (
  staticPosition: number,
  otherValues: number[]
) => {
  const distances: Array<IDistanceResult> = [];

  otherValues.forEach((position) => {
    distances.push({
      position: position,
      distance: math.abs(position - staticPosition),
    });
  });

  const sortedDistances = distances.sort((a, b) => {
    return a.distance < b.distance;
  });

  return sortedDistances[0];
};
