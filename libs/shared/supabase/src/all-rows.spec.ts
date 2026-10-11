import { allRows, pageSize } from './all-rows';

describe('allRows', () => {
  it('reads pages until one comes back short', async () => {
    const total = pageSize * 2 + 5;
    const ranges: [number, number][] = [];

    const result = await allRows(async (from, to) => {
      ranges.push([from, to]);
      const end = Math.min(to + 1, total);
      return {
        data: Array.from({ length: end - from }, (_, index) => from + index),
        error: null,
      };
    });

    expect(result.data).toHaveLength(total);
    expect(result.data?.at(-1)).toBe(total - 1);
    expect(ranges).toEqual([
      [0, pageSize - 1],
      [pageSize, pageSize * 2 - 1],
      [pageSize * 2, pageSize * 3 - 1],
    ]);
  });

  it('stops at the first error and returns no rows', async () => {
    const result = await allRows(async (from) =>
      from === 0
        ? { data: Array.from({ length: pageSize }, () => 1), error: null }
        : { data: null, error: { message: 'permission denied' } },
    );

    expect(result).toEqual({
      data: null,
      error: { message: 'permission denied' },
    });
  });
});
