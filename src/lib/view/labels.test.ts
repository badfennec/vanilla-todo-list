import { describe, expect, it } from 'vitest';

import { DEFAULT_LABELS, fillLabel } from './labels';

describe('fillLabel', () => {
  it('replaces placeholders with their values', () => {
    expect(fillLabel(DEFAULT_LABELS.moved, { position: 2, total: 5 })).toBe('Moved to position 2 of 5');
  });

  it('works with placeholders in any order, repeated, and 0 as a value', () => {
    expect(fillLabel('{total}: {position} / {total}', { position: 0, total: 3 })).toBe('3: 0 / 3');
  });

  it('leaves unknown placeholders and plain text as they are', () => {
    expect(fillLabel('Spostato in {position} ({missing})', { position: 1 })).toBe('Spostato in 1 ({missing})');
    expect(fillLabel('No placeholders', { position: 1 })).toBe('No placeholders');
  });
});
