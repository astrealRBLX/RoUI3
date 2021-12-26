export interface IDistanceResult {
  position: number;
  distance: number;
}

// When given a static position between 0 and 1 and
// an array of other positions between 0 and 1 this utility
// function will calculate the distances to each value from
// the static position and return them sorted by distance
// from closest to furthest
export const getSortedDistances = (
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

  return sortedDistances;
};
