import { afterEach, describe, expect, it, vi } from 'vitest';

import { TodoStore } from './TodoStore';
import type { TodoItem } from './types';

type UUID = ReturnType<typeof crypto.randomUUID>;

const item = (id: string, completed = false): TodoItem => ({ id, text: id, completed });

/** Ids in display order, with completed items marked by a trailing "✓". */
const ids = (store: TodoStore): string[] => store.getItems().map(({ id, completed }) => (completed ? `${id}✓` : id));

describe('TodoStore', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('starts empty by default', () => {
      expect(new TodoStore().getItems()).toEqual([]);
    });

    it('puts active items first, keeping the relative order', () => {
      const store = new TodoStore([item('a', true), item('b'), item('c', true), item('d')]);

      expect(ids(store)).toEqual(['b', 'd', 'a✓', 'c✓']);
    });

    it('does not keep references to the given items', () => {
      const input = [item('a')];
      const store = new TodoStore(input);

      input.push(item('b'));

      expect(ids(store)).toEqual(['a']);
    });
  });

  describe('getItems', () => {
    it('returns a copy of the array', () => {
      const store = new TodoStore([item('a')]);

      (store.getItems() as TodoItem[]).push(item('b'));

      expect(ids(store)).toEqual(['a']);
    });

    it('returns frozen items', () => {
      const store = new TodoStore([item('a')]);

      expect(store.getItems().every((todo) => Object.isFrozen(todo))).toBe(true);
    });
  });

  describe('add', () => {
    it('adds an active item at the end of the active items', () => {
      const store = new TodoStore([item('a'), item('b', true)]);

      const added = store.add('New');

      expect(added).toMatchObject({ text: 'New', completed: false });
      expect(ids(store)).toEqual(['a', added.id, 'b✓']);
    });

    it('never generates an id that is already in the list', () => {
      vi.spyOn(crypto, 'randomUUID')
        .mockReturnValueOnce('a' as UUID)
        .mockReturnValueOnce('b' as UUID);
      const store = new TodoStore([item('a')]);

      expect(store.add().id).toBe('b');
    });

    it('uses an empty text by default', () => {
      expect(new TodoStore().add().text).toBe('');
    });

    it('emits add, then change', () => {
      const store = new TodoStore();
      const events: string[] = [];
      store.on('add', () => events.push('add'));
      store.on('change', () => events.push('change'));

      store.add('New');

      expect(events).toEqual(['add', 'change']);
    });
  });

  describe('remove', () => {
    it('removes the item and returns it', () => {
      const store = new TodoStore([item('a'), item('b')]);

      expect(store.remove('a')).toEqual(item('a'));
      expect(ids(store)).toEqual(['b']);
    });

    it('emits remove with the item, then change with the remaining items', () => {
      const store = new TodoStore([item('a'), item('b')]);
      const onRemove = vi.fn();
      const onChange = vi.fn();
      store.on('remove', onRemove);
      store.on('change', onChange);

      store.remove('a');

      expect(onRemove).toHaveBeenCalledExactlyOnceWith({ item: item('a') });
      expect(onChange).toHaveBeenCalledExactlyOnceWith({ items: [item('b')] });
    });
  });

  describe('toggle', () => {
    it('moves a completed item to the end of the completed items', () => {
      const store = new TodoStore([item('a'), item('b'), item('c', true)]);

      const toggled = store.toggle('a');

      expect(toggled.completed).toBe(true);
      expect(ids(store)).toEqual(['b', 'c✓', 'a✓']);
    });

    it('restores an item to its previous active position', () => {
      const store = new TodoStore([item('a'), item('b'), item('c')]);

      store.toggle('b');
      store.toggle('b');

      expect(ids(store)).toEqual(['a', 'b', 'c']);
    });

    it('restores to the first position (index 0)', () => {
      const store = new TodoStore([item('a'), item('b')]);

      store.toggle('a');
      store.toggle('a');

      expect(ids(store)).toEqual(['a', 'b']);
    });

    it('restores to the end of the active items when the previous position no longer exists', () => {
      const store = new TodoStore([item('a'), item('b'), item('c')]);

      store.toggle('c');
      store.remove('a');
      store.toggle('c');

      expect(ids(store)).toEqual(['b', 'c']);
    });

    it('restores an item that started completed to the end of the active items', () => {
      const store = new TodoStore([item('a'), item('b'), item('c', true)]);

      store.toggle('c');

      expect(ids(store)).toEqual(['a', 'b', 'c']);
    });

    it('emits toggle with the updated item, then change', () => {
      const store = new TodoStore([item('a')]);
      const onToggle = vi.fn();
      const onChange = vi.fn();
      store.on('toggle', onToggle);
      store.on('change', onChange);

      store.toggle('a');

      expect(onToggle).toHaveBeenCalledExactlyOnceWith({ item: item('a', true) });
      expect(onChange).toHaveBeenCalledExactlyOnceWith({ items: [item('a', true)] });
    });
  });

  describe('edit', () => {
    it('changes the text and keeps the position', () => {
      const store = new TodoStore([item('a'), item('b')]);

      const edited = store.edit('a', 'Changed');

      expect(edited).toEqual({ id: 'a', text: 'Changed', completed: false });
      expect(store.getItems()[0]).toEqual(edited);
    });

    it('emits edit, then change', () => {
      const store = new TodoStore([item('a')]);
      const events: string[] = [];
      store.on('edit', () => events.push('edit'));
      store.on('change', () => events.push('change'));

      store.edit('a', 'Changed');

      expect(events).toEqual(['edit', 'change']);
    });

    it('does nothing when the text is the same', () => {
      const store = new TodoStore([item('a')]);
      const onChange = vi.fn();
      store.on('change', onChange);

      store.edit('a', 'a');

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('move', () => {
    const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const letters = (count: number) => LETTERS.slice(0, count).map((letter) => item(letter));

    it('moves an item up: from 10th to 7th', () => {
      const store = new TodoStore(letters(10));

      store.move('J', 6);

      expect(ids(store)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'J', 'G', 'H', 'I']);
    });

    it('moves an item down: from 3rd to 7th', () => {
      const store = new TodoStore(letters(10));

      store.move('C', 6);

      expect(ids(store)).toEqual(['A', 'B', 'D', 'E', 'F', 'G', 'C', 'H', 'I', 'J']);
    });

    it('moves to the first and to the last active position', () => {
      const store = new TodoStore([...letters(3), item('x', true)]);

      store.move('C', 0);
      expect(ids(store)).toEqual(['C', 'A', 'B', 'x✓']);

      store.move('C', 2);
      expect(ids(store)).toEqual(['A', 'B', 'C', 'x✓']);
    });

    it('emits move with the active indexes, then change', () => {
      const store = new TodoStore(letters(3));
      const onMove = vi.fn();
      const events: string[] = [];
      store.on('move', onMove);
      store.on('move', () => events.push('move'));
      store.on('change', () => events.push('change'));

      store.move('A', 2);

      expect(onMove).toHaveBeenCalledExactlyOnceWith({ item: item('A'), fromIndex: 0, toIndex: 2 });
      expect(events).toEqual(['move', 'change']);
    });

    it('does nothing when the item is already at that index', () => {
      const store = new TodoStore(letters(3));
      const onChange = vi.fn();
      store.on('change', onChange);

      store.move('B', 1);

      expect(ids(store)).toEqual(['A', 'B', 'C']);
      expect(onChange).not.toHaveBeenCalled();
    });

    it('rejects completed items', () => {
      const store = new TodoStore([item('a'), item('b', true)]);

      expect(() => store.move('b', 0)).toThrow(new Error('Todo item "b" is completed and cannot be moved'));
    });

    it.each([-1, 3, 1.5, Number.NaN])('rejects the out-of-range index %s', (toIndex) => {
      const store = new TodoStore([...letters(3), item('x', true)]);

      expect(() => store.move('A', toIndex)).toThrow(RangeError);
      expect(ids(store)).toEqual(['A', 'B', 'C', 'x✓']);
    });
  });

  describe('setItems', () => {
    it('replaces every item, active ones first', () => {
      const store = new TodoStore([item('old')]);

      store.setItems([item('a', true), item('b')]);

      expect(ids(store)).toEqual(['b', 'a✓']);
    });

    it('stores frozen copies of the given items', () => {
      const input = [item('a')];
      const store = new TodoStore();

      store.setItems(input);
      input.push(item('b'));

      expect(ids(store)).toEqual(['a']);
      expect(Object.isFrozen(store.getItems()[0])).toBe(true);
    });

    it('emits only change, with the new items', () => {
      const store = new TodoStore([item('old')]);
      const onRemove = vi.fn();
      const onAdd = vi.fn();
      const onChange = vi.fn();
      store.on('remove', onRemove);
      store.on('add', onAdd);
      store.on('change', onChange);

      store.setItems([item('a')]);

      expect(onRemove).not.toHaveBeenCalled();
      expect(onAdd).not.toHaveBeenCalled();
      expect(onChange).toHaveBeenCalledExactlyOnceWith({ items: [item('a')] });
    });

    it('forgets the positions remembered by toggle', () => {
      const store = new TodoStore([item('a'), item('b')]);
      store.toggle('a');

      store.setItems([item('b'), item('c'), item('a', true)]);
      store.toggle('a');

      expect(ids(store)).toEqual(['b', 'c', 'a']);
    });
  });

  describe('unknown ids', () => {
    it.each([
      ['remove', (store: TodoStore) => store.remove('x')],
      ['toggle', (store: TodoStore) => store.toggle('x')],
      ['edit', (store: TodoStore) => store.edit('x', 'text')],
      ['move', (store: TodoStore) => store.move('x', 0)],
    ])('%s throws', (_name, action) => {
      const store = new TodoStore([item('a')]);

      expect(() => action(store)).toThrow(new Error('Todo item "x" not found'));
    });
  });

  describe('listeners', () => {
    it('can be removed with off or with the function returned by on', () => {
      const store = new TodoStore();
      const viaOff = vi.fn();
      const viaUnsubscribe = vi.fn();
      store.on('change', viaOff);
      const unsubscribe = store.on('change', viaUnsubscribe);

      store.off('change', viaOff);
      unsubscribe();
      store.add();

      expect(viaOff).not.toHaveBeenCalled();
      expect(viaUnsubscribe).not.toHaveBeenCalled();
    });

    it('are all removed by destroy', () => {
      const store = new TodoStore();
      const onChange = vi.fn();
      store.on('change', onChange);

      store.destroy();
      store.add();

      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
