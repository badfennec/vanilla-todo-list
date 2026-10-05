import { describe, expect, it } from 'vitest';

import { keyboardTargetIndex, type ReorderKey } from './keyboardTargetIndex';

const key = (name: string, modifiers: Partial<ReorderKey> = {}): ReorderKey => ({
  key: name,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  ...modifiers,
});

describe('keyboardTargetIndex', () => {
  it('moves by one position with the arrows', () => {
    expect(keyboardTargetIndex(key('ArrowUp'), 2, 4)).toBe(1);
    expect(keyboardTargetIndex(key('ArrowDown'), 2, 4)).toBe(3);
  });

  it('moves to the first or last position with Home and End', () => {
    expect(keyboardTargetIndex(key('Home'), 2, 4)).toBe(0);
    expect(keyboardTargetIndex(key('End'), 2, 4)).toBe(4);
  });

  it('stays in place at the edges (0 is a valid index)', () => {
    expect(keyboardTargetIndex(key('ArrowUp'), 0, 4)).toBe(0);
    expect(keyboardTargetIndex(key('ArrowDown'), 4, 4)).toBe(4);
    expect(keyboardTargetIndex(key('Home'), 0, 0)).toBe(0);
  });

  it('ignores other keys', () => {
    expect(keyboardTargetIndex(key('Enter'), 1, 4)).toBeUndefined();
    expect(keyboardTargetIndex(key('ArrowLeft'), 1, 4)).toBeUndefined();
    expect(keyboardTargetIndex(key(' '), 1, 4)).toBeUndefined();
  });

  it('ignores keys with a modifier', () => {
    for (const modifier of ['altKey', 'ctrlKey', 'metaKey', 'shiftKey'] as const) {
      expect(keyboardTargetIndex(key('ArrowDown', { [modifier]: true }), 1, 4)).toBeUndefined();
    }
  });
});
