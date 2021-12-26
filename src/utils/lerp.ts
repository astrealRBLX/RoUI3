// Utility function for lerping a number between two
// ranges based on an alpha
export const lerp = (a: number, b: number, c: number) => {
  return a + (b - a) * c;
};
