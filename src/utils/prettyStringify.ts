import { KeyframeValue } from 'rodux/actions/dataActions';

// Rounds a number to two decimals as a string
const roundNumToString = (num: number) => {
  return string.format('%.2f', num);
};

// Utility function to convert some data type
// into a pretty string
export = (data: KeyframeValue) => {
  const dataType = typeOf(data);
  let typeString = `${dataType}`;

  if (dataType === 'boolean') {
    typeString = `${dataType.sub(1, 1).upper()}${dataType.sub(2).lower()}`;
  }

  switch (dataType) {
    case 'number':
      data = data as number;
      return `Number(${roundNumToString(data)})`;
    case 'Vector2':
      data = data as Vector2;
      return `Vector2(${roundNumToString(data.X)}, ${roundNumToString(
        data.Y
      )})`;
    case 'UDim':
      data = data as UDim;
      return `UDim(${roundNumToString(data.Scale)}, ${data.Offset})`;
    case 'UDim2':
      data = data as UDim2;
      return `UDim2(${roundNumToString(data.X.Scale)}, ${
        data.X.Offset
      }, ${roundNumToString(data.Y.Scale)}, ${data.Y.Offset})`;
    default:
      return `${typeString}(${data})`;
  }
};
