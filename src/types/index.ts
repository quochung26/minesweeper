export type mapDetail = {
  high: number;
  length: number;
  mine: number;
};

export type map = {
  [key: string]: mapDetail;
};

export type checked = {
  [key: string]: number;
};

export type sweepers = {
  [key: string]: number;
};

export type modalData = {
  open: boolean,
  playTime: number,
  mineRemoved: number,
  newGame: number
}
