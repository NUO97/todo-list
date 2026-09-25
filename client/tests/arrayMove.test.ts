import { describe, expect, it } from 'vitest';
import { arrayMove } from '../src/lib/arrayMove';

describe('arrayMove', () => {
  it('moves an item forward in the list', () => {
    expect(arrayMove(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
  });

  it('moves an item backward in the list', () => {
    expect(arrayMove(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });

  it('does not mutate the original array', () => {
    const original = ['a', 'b', 'c'];
    arrayMove(original, 0, 2);
    expect(original).toEqual(['a', 'b', 'c']);
  });

  it('is a no-op when moving an item to its own index', () => {
    expect(arrayMove(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'b', 'c']);
  });
});
