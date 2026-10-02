import { afterEach, describe, expect, it, vi } from 'vitest';

import { createId } from './createId';

type UUID = ReturnType<typeof crypto.randomUUID>;

describe('createId', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a UUID', () => {
    expect(createId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('returns a different id at each call', () => {
    expect(createId()).not.toBe(createId());
  });

  it('skips ids that are already taken', () => {
    vi.spyOn(crypto, 'randomUUID')
      .mockReturnValueOnce('taken-1' as UUID)
      .mockReturnValueOnce('taken-2' as UUID)
      .mockReturnValueOnce('free' as UUID);
    const taken = new Set(['taken-1', 'taken-2']);

    expect(createId((id) => taken.has(id))).toBe('free');
  });
});
