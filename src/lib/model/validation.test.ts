import { afterEach, describe, expect, it, vi } from 'vitest';

import { parseItem, parseItems, parseOptions, parseString, parseTarget } from './validation';

type UUID = ReturnType<typeof crypto.randomUUID>;

describe('parseItem', () => {
  it('keeps the provided fields', () => {
    expect(parseItem({ id: 'a', text: 'Buy milk', completed: true })).toEqual({
      id: 'a',
      text: 'Buy milk',
      completed: true,
    });
  });

  it('fills in defaults for missing fields', () => {
    const item = parseItem({});

    expect(item.text).toBe('');
    expect(item.completed).toBe(false);
    expect(item.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('generates a different id for each item', () => {
    expect(parseItem({}).id).not.toBe(parseItem({}).id);
  });

  it('keeps falsy but valid values', () => {
    expect(parseItem({ id: '0', text: '', completed: false })).toEqual({ id: '0', text: '', completed: false });
  });

  it.each([null, 'text', 42, ['a']])('rejects a non-object item: %j', (value) => {
    expect(() => parseItem(value)).toThrow(new TypeError('item must be an object'));
  });

  it('rejects an empty id', () => {
    expect(() => parseItem({ id: '' })).toThrow(new TypeError('item.id must not be empty'));
  });

  it('rejects fields of the wrong type', () => {
    expect(() => parseItem({ id: 1 })).toThrow(new TypeError('item.id must be a string'));
    expect(() => parseItem({ text: 1 })).toThrow(new TypeError('item.text must be a string'));
    expect(() => parseItem({ completed: 'yes' })).toThrow(new TypeError('item.completed must be a boolean'));
  });
});

describe('parseItems', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('parses every item in order', () => {
    expect(parseItems([{ id: 'a' }, { id: 'b', completed: true }])).toEqual([
      { id: 'a', text: '', completed: false },
      { id: 'b', text: '', completed: true },
    ]);
  });

  it('rejects a non-array value', () => {
    expect(() => parseItems({})).toThrow(new TypeError('items must be an array'));
  });

  it('reports the index of the invalid item', () => {
    expect(() => parseItems([{}, { text: 1 }])).toThrow(new TypeError('items[1].text must be a string'));
  });

  it('never generates an id that is provided by another item', () => {
    vi.spyOn(crypto, 'randomUUID')
      .mockReturnValueOnce('b' as UUID)
      .mockReturnValueOnce('c' as UUID);

    // The generated id would clash with "b", provided by a later item.
    expect(parseItems([{ id: 'a' }, {}, { id: 'b' }]).map((item) => item.id)).toEqual(['a', 'c', 'b']);
  });

  it('rejects duplicated ids', () => {
    expect(() => parseItems([{ id: 'a' }, { id: 'a' }])).toThrow(new TypeError('items[1].id "a" is duplicated'));
  });
});

describe('parseOptions', () => {
  it('returns defaults when no options are given', () => {
    expect(parseOptions()).toEqual({ items: [], icons: {}, labels: {} });
    expect(parseOptions({})).toEqual({ items: [], icons: {}, labels: {} });
  });

  it('parses items, icons and labels', () => {
    const options = parseOptions({
      items: [{ id: 'a', text: 'Task' }],
      icons: { add: '<svg></svg>' },
      labels: { addItem: 'Aggiungi' },
    });

    expect(options).toEqual({
      items: [{ id: 'a', text: 'Task', completed: false }],
      icons: { add: '<svg></svg>' },
      labels: { addItem: 'Aggiungi' },
    });
  });

  it('ignores undefined icons and labels', () => {
    expect(parseOptions({ icons: { add: undefined }, labels: { drag: undefined } })).toEqual({
      items: [],
      icons: {},
      labels: {},
    });
  });

  it('rejects a non-object value', () => {
    expect(() => parseOptions(null)).toThrow(new TypeError('options must be an object'));
  });

  it('rejects unknown keys, to catch typos', () => {
    expect(() => parseOptions({ itemsGap: 10 })).toThrow(new TypeError('options.itemsGap is not supported'));
    expect(() => parseOptions({ icons: { addIcon: '' } })).toThrow(
      new TypeError('options.icons.addIcon is not supported'),
    );
    expect(() => parseOptions({ labels: { title: '' } })).toThrow(
      new TypeError('options.labels.title is not supported'),
    );
  });

  it('rejects icons and labels of the wrong type', () => {
    expect(() => parseOptions({ icons: 'svg' })).toThrow(new TypeError('options.icons must be an object'));
    expect(() => parseOptions({ icons: { add: 1 } })).toThrow(new TypeError('options.icons.add must be a string'));
    expect(() => parseOptions({ labels: { drag: false } })).toThrow(
      new TypeError('options.labels.drag must be a string'),
    );
  });

  it('reports the full path of an invalid item', () => {
    expect(() => parseOptions({ items: [{ completed: 1 }] })).toThrow(
      new TypeError('options.items[0].completed must be a boolean'),
    );
  });
});

describe('parseTarget', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('accepts an element', () => {
    const element = document.createElement('div');

    expect(parseTarget(element)).toBe(element);
  });

  it('resolves a selector', () => {
    const element = document.createElement('div');
    element.id = 'todo';
    document.body.append(element);

    expect(parseTarget('#todo')).toBe(element);
  });

  it('rejects a selector that matches nothing', () => {
    expect(() => parseTarget('#missing')).toThrow(new TypeError('target "#missing" matches no HTML element'));
  });

  it('rejects other values', () => {
    expect(() => parseTarget(null)).toThrow(new TypeError('target must be an HTMLElement or a CSS selector'));
    expect(() => parseTarget(42)).toThrow(TypeError);
  });
});

describe('parseString', () => {
  it('accepts strings, empty included', () => {
    expect(parseString('a', 'id')).toBe('a');
    expect(parseString('', 'text')).toBe('');
  });

  it('rejects other values', () => {
    expect(() => parseString(1, 'id')).toThrow(new TypeError('id must be a string'));
    expect(() => parseString(undefined, 'text')).toThrow(new TypeError('text must be a string'));
  });
});
