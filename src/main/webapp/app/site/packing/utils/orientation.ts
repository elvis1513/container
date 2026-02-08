import type { ItemSize, Orientation } from '../types';

type Axis = 'x' | 'y' | 'z';
type AxisLetter = 'L' | 'W' | 'H';

export const ALL_ORIENTATIONS: Orientation[] = ['LWH', 'WLH', 'LHW', 'WHL', 'HLW', 'HWL'];

const sizeByLetter = (size: ItemSize, letter: AxisLetter): number => {
  switch (letter) {
    case 'L':
      return size.l;
    case 'W':
      return size.w;
    case 'H':
      return size.h;
    default:
      return size.l;
  }
};

const orientationToAxes = (orientation: Orientation): { x: AxisLetter; y: AxisLetter; z: AxisLetter } => {
  const [xLetter, zLetter, yLetter] = orientation.split('') as AxisLetter[];
  return { x: xLetter, y: yLetter, z: zLetter };
};

const axesToOrientation = (axes: { x: AxisLetter; y: AxisLetter; z: AxisLetter }): Orientation => {
  return `${axes.x}${axes.z}${axes.y}` as Orientation;
};

export const getOrientedDimensions = (size: ItemSize, orientation: Orientation): { x: number; y: number; z: number } => {
  const axes = orientationToAxes(orientation);
  return {
    x: sizeByLetter(size, axes.x),
    y: sizeByLetter(size, axes.y),
    z: sizeByLetter(size, axes.z),
  };
};

export const rotateOrientation = (orientation: Orientation, axis: Axis, steps = 1): Orientation => {
  let axes = orientationToAxes(orientation);

  for (let i = 0; i < steps; i += 1) {
    if (axis === 'x') {
      axes = { x: axes.x, y: axes.z, z: axes.y };
    } else if (axis === 'y') {
      axes = { x: axes.z, y: axes.y, z: axes.x };
    } else {
      axes = { x: axes.y, y: axes.x, z: axes.z };
    }
  }

  return axesToOrientation(axes);
};
