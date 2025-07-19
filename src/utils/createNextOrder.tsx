export function createNextOrder() {
  let layoutOrder = 0;

  return () => {
    layoutOrder += 1;
    return layoutOrder;
  };
}
