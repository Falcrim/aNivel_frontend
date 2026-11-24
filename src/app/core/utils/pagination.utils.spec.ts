import { describe, expect, it } from 'vitest';
import { extractResults } from './pagination.utils';
import { PaginatedResponse } from '../models/pagination.model';

describe('pagination.utils', () => {
  it('should extract items and total count from a flat array', () => {
    const data = [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }];
    const result = extractResults(data);

    expect(result.items).toEqual(data);
    expect(result.totalCount).toBe(2);
  });

  it('should extract items and total count from PaginatedResponse', () => {
    const paginated: PaginatedResponse<{ id: number; name: string }> = {
      count: 45,
      next: 'http://api.local/items/?page=2',
      previous: null,
      results: [{ id: 1, name: 'Item 1' }],
    };

    const result = extractResults(paginated);
    expect(result.items).toEqual([{ id: 1, name: 'Item 1' }]);
    expect(result.totalCount).toBe(45);
  });

  it('should handle null or undefined safely', () => {
    const resultNull = extractResults(null);
    expect(resultNull.items).toEqual([]);
    expect(resultNull.totalCount).toBe(0);

    const resultUndefined = extractResults(undefined);
    expect(resultUndefined.items).toEqual([]);
    expect(resultUndefined.totalCount).toBe(0);
  });

  it('should handle paginated response with empty results', () => {
    const paginated: PaginatedResponse<string> = {
      count: 0,
      next: null,
      previous: null,
      results: [],
    };

    const result = extractResults(paginated);
    expect(result.items).toEqual([]);
    expect(result.totalCount).toBe(0);
  });
});
