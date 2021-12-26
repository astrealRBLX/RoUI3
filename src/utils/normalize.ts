// Utility function to normalize a value
// in some range into another range
export const normalizeToRange = (
  constant: number,
  rMin: number,
  rMax: number,
  tMin: number,
  tMax: number
) => {
  return ((constant - rMin) / (rMax - rMin)) * (tMax - tMin) + tMin;
};
