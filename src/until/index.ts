export function convertCount(value: number) {
  if (value < 10) {
    return `00${value}`;
  }

  if (value < 100) {
    return `0${value}`;
  }

  return value;
}
