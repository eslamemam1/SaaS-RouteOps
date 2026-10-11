import { centerSquare } from './driver-photo';

describe('centerSquare', () => {
  it('keeps the middle of a tall photo', () => {
    expect(centerSquare(300, 500)).toEqual({ x: 0, y: 100, side: 300 });
  });

  it('keeps the middle of a wide photo', () => {
    expect(centerSquare(1600, 900)).toEqual({ x: 350, y: 0, side: 900 });
  });

  it('keeps a square photo whole', () => {
    expect(centerSquare(256, 256)).toEqual({ x: 0, y: 0, side: 256 });
  });
});
