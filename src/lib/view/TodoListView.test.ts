import { afterEach, describe, expect, it, vi } from 'vitest';

import type { TodoItem } from '../model/types';
import { DEFAULT_ICONS } from './icons';
import { DEFAULT_LABELS } from './labels';
import { TodoListView } from './TodoListView';

const A: TodoItem = { id: 'a', text: 'A', completed: false };
const B: TodoItem = { id: 'b', text: 'B', completed: false };
const C: TodoItem = { id: 'c', text: 'C', completed: true };

function setup() {
  const root = document.createElement('div');
  document.body.append(root);
  const callbacks = { onToggle: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn(), onAdd: vi.fn(), onMove: vi.fn() };
  const view = new TodoListView({ root, icons: DEFAULT_ICONS, labels: DEFAULT_LABELS, ...callbacks });

  const list = (modifier: string): HTMLUListElement => {
    const element = root.querySelector(`.badfennec-todo__list--${modifier}`);
    if (!(element instanceof HTMLUListElement)) throw new Error(`${modifier} list not found`);
    return element;
  };
  const texts = (modifier: string): string[] =>
    [...list(modifier).querySelectorAll('.badfennec-todo__text')].map((text) => text.textContent);
  const button = (index: number, name: string): HTMLButtonElement => {
    const element = root.querySelectorAll(`.badfennec-todo__${name}`).item(index);
    if (!(element instanceof HTMLButtonElement)) throw new Error(`${name} button ${String(index)} not found`);
    return element;
  };

  const addButton = (): HTMLButtonElement => {
    const element = root.querySelector('.badfennec-todo__add');
    if (!(element instanceof HTMLButtonElement)) throw new Error('add button not found');
    return element;
  };

  return { root, view, list, texts, button, addButton, ...callbacks };
}

describe('TodoListView', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('renders the active list, the add row, the completed list and a status region into the root', () => {
    const { root, list, addButton } = setup();
    const status = root.querySelector('.badfennec-todo__status');

    expect(root.classList.contains('badfennec-todo')).toBe(true);
    expect([...root.children]).toEqual([list('active'), addButton(), list('completed'), status]);
    expect(status?.getAttribute('role')).toBe('status');
  });

  it('renders the add row as a button with a visible label', () => {
    const { addButton } = setup();

    expect(addButton().type).toBe('button');
    expect(addButton().textContent).toBe(DEFAULT_LABELS.addItem);
    expect(addButton().querySelector('.badfennec-todo__icon svg')).not.toBeNull();
  });

  it('reports the add intent without adding anything itself', () => {
    const { view, root, addButton, onAdd } = setup();
    view.render([]);

    addButton().click();

    expect(onAdd).toHaveBeenCalledOnce();
    expect(root.querySelectorAll('.badfennec-todo__item')).toHaveLength(0);
  });

  it('focuses the text of a new item', () => {
    const { view, root } = setup();
    view.render([A, B]);

    view.editAsNew('b');

    expect(document.activeElement).toBe(root.querySelectorAll('.badfennec-todo__text').item(1));
  });

  it('throws when asked to edit an item that is not rendered', () => {
    const { view } = setup();

    expect(() => {
      view.editAsNew('missing');
    }).toThrow(new Error('Todo item "missing" is not rendered'));
  });

  it('renders active items in the first list and completed items in the second, in order', () => {
    const { view, texts } = setup();

    view.render([B, A, C]);

    expect(texts('active')).toEqual(['B', 'A']);
    expect(texts('completed')).toEqual(['C']);
  });

  it('reuses the item elements and updates them', () => {
    const { view, root, texts } = setup();
    view.render([A, B]);
    const [first, second] = root.querySelectorAll('.badfennec-todo__item');

    view.render([{ ...B, text: 'B2' }, A]);

    expect(texts('active')).toEqual(['B2', 'A']);
    expect([...root.querySelectorAll('.badfennec-todo__item')]).toEqual([second, first]);
  });

  it('moves a toggled item to the other list', () => {
    const { view, texts } = setup();
    view.render([A, B]);

    view.render([B, { ...A, completed: true }]);

    expect(texts('active')).toEqual(['B']);
    expect(texts('completed')).toEqual(['A']);
  });

  it('removes the elements of items that are gone', () => {
    const { view, root, texts } = setup();
    view.render([A, B, C]);

    view.render([B]);

    expect(texts('active')).toEqual(['B']);
    expect(texts('completed')).toEqual([]);
    expect(root.querySelectorAll('.badfennec-todo__item')).toHaveLength(1);
  });

  it('keeps focus on an item that stays in place', () => {
    const { view, root } = setup();
    view.render([A, B]);
    const text = root.querySelector<HTMLElement>('.badfennec-todo__text');
    text?.focus();

    view.render([A, { ...B, text: 'B2' }]);

    expect(document.activeElement).toBe(text);
  });

  it('reports intents with the item id', () => {
    const { view, button, onToggle, onDelete } = setup();
    view.render([A, B]);

    button(1, 'toggle').click();
    button(0, 'delete').click();

    expect(onToggle).toHaveBeenCalledExactlyOnceWith('b');
    expect(onDelete).toHaveBeenCalledExactlyOnceWith('a');
  });

  it('removes its elements and the root class on destroy, keeping other root content', () => {
    const { view, root, addButton, onAdd } = setup();
    const own = document.createElement('p');
    root.prepend(own);
    view.render([A, C]);

    const add = addButton();
    view.destroy();
    add.click();

    expect(onAdd).not.toHaveBeenCalled();
    expect(root.classList.contains('badfennec-todo')).toBe(false);
    expect([...root.children]).toEqual([own]);
  });

  describe('drag and drop', () => {
    const D: TodoItem = { id: 'd', text: 'D', completed: false };
    // Active list at y=1000 (page coordinates); items 40px high with a 10px gap: middles at 20, 70, 120 (relative).
    const LIST_TOP = 1000;

    function setupDrag(items: readonly TodoItem[] = [A, B, D, C]) {
      const context = setup();
      context.view.render(items);

      const rect = (top: number, height: number) => new DOMRect(0, top, 300, height);
      context.list('active').getBoundingClientRect = () => rect(LIST_TOP, 140);
      context.root.querySelectorAll<HTMLLIElement>('.badfennec-todo__item').forEach((item, index) => {
        item.getBoundingClientRect = () => rect(LIST_TOP + index * 50, 40);
      });
      // Pointer capture is stubbed: the test DOM doesn't track it.
      context.root.querySelectorAll<HTMLButtonElement>('.badfennec-todo__handle').forEach((handle) => {
        handle.setPointerCapture = vi.fn();
        handle.releasePointerCapture = vi.fn();
        handle.hasPointerCapture = () => false;
      });

      const pointer = (index: number, type: string, clientY = 0): void => {
        const handle = context.button(index, 'handle');
        handle.dispatchEvent(new PointerEvent(type, { pointerId: 1, isPrimary: true, button: 0, clientY }));
      };
      const item = (index: number): HTMLLIElement => {
        const element = context.root.querySelectorAll('.badfennec-todo__item').item(index);
        if (!(element instanceof HTMLLIElement)) throw new Error(`item ${String(index)} not found`);
        return element;
      };
      const placeholder = (): Element | null => context.root.querySelector('.badfennec-todo__placeholder');
      const activeChildren = (): Element[] => [...context.list('active').children];

      return { ...context, pointer, item, placeholder, activeChildren };
    }

    it('puts a placeholder in the slot of the dragged item and takes the item out of the flow', () => {
      const { root, pointer, item, placeholder, activeChildren } = setupDrag();
      const dragged = item(1);

      pointer(1, 'pointerdown', 500);

      expect(activeChildren()).toEqual([item(0), placeholder(), dragged, item(2)]);
      expect(placeholder()?.getAttribute('aria-hidden')).toBe('true');
      expect((placeholder() as HTMLElement).style.blockSize).toBe('40px');
      expect(dragged.classList.contains('badfennec-todo__item--dragging')).toBe(true);
      expect(dragged.style.top).toBe('50px');
      expect(root.classList.contains('badfennec-todo--dragging')).toBe(true);
    });

    it('moves the placeholder once the dragged middle passes another middle', () => {
      const { pointer, item, placeholder, activeChildren } = setupDrag();
      const [a, b, d] = [item(0), item(1), item(2)];

      pointer(0, 'pointerdown', 500);
      pointer(0, 'pointermove', 549); // middle at 69: still before B
      expect(activeChildren()).toEqual([placeholder(), a, b, d]);

      pointer(0, 'pointermove', 551); // middle at 71: after B
      expect(activeChildren()).toEqual([a, b, placeholder(), d]);

      pointer(0, 'pointermove', 700); // past D: last
      expect(activeChildren()).toEqual([a, b, d, placeholder()]);
    });

    it('reports the drop index and restores the DOM on pointer up', () => {
      const { root, pointer, item, placeholder, activeChildren, onMove } = setupDrag();
      const [a, b, d] = [item(0), item(1), item(2)];

      pointer(2, 'pointerdown', 500);
      pointer(2, 'pointermove', 400); // middle at 20: first
      pointer(2, 'pointerup', 400);

      expect(onMove).toHaveBeenCalledExactlyOnceWith('d', 0);
      expect(placeholder()).toBeNull();
      expect(activeChildren()).toEqual([a, b, d]);
      expect(d.classList.contains('badfennec-todo__item--dragging')).toBe(false);
      expect(d.style.top).toBe('');
      expect(d.style.transform).toBe('');
      expect(root.classList.contains('badfennec-todo--dragging')).toBe(false);
    });

    it('measures relative to the list, so the page position does not matter (A9)', () => {
      const { pointer, onMove } = setupDrag();

      pointer(0, 'pointerdown', 0);
      pointer(0, 'pointermove', 51);
      pointer(0, 'pointerup', 51);

      expect(onMove).toHaveBeenCalledExactlyOnceWith('a', 1);
    });

    it('does not report a drop at the same index', () => {
      const { pointer, onMove } = setupDrag();

      pointer(1, 'pointerdown', 500);
      pointer(1, 'pointermove', 510);
      pointer(1, 'pointerup', 510);

      expect(onMove).not.toHaveBeenCalled();
    });

    it('changes nothing when the drag is cancelled', () => {
      const { pointer, placeholder, item, onMove } = setupDrag();

      pointer(0, 'pointerdown', 500);
      pointer(0, 'pointermove', 600);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      pointer(0, 'pointerup', 600);

      expect(onMove).not.toHaveBeenCalled();
      expect(placeholder()).toBeNull();
      expect(item(0).classList.contains('badfennec-todo__item--dragging')).toBe(false);
    });

    it('does not drag completed items', () => {
      const { root, pointer, placeholder } = setupDrag();

      pointer(3, 'pointerdown', 500);

      expect(placeholder()).toBeNull();
      expect(root.classList.contains('badfennec-todo--dragging')).toBe(false);
    });

    it('starts each drag from a clean state (A2)', () => {
      const { pointer, onMove } = setupDrag();

      pointer(0, 'pointerdown', 500);
      pointer(0, 'pointermove', 610); // middle at 130: last
      pointer(0, 'pointerup', 610);
      pointer(1, 'pointerdown', 500);
      pointer(1, 'pointerup', 500);

      expect(onMove).toHaveBeenCalledExactlyOnceWith('a', 2);
    });

    it('cancels the drag when the items are rendered again', () => {
      const { view, pointer, placeholder, item, onMove } = setupDrag();

      pointer(0, 'pointerdown', 500);
      pointer(0, 'pointermove', 600);
      view.render([A, { ...B, text: 'B2' }, D, C]);
      pointer(0, 'pointerup', 600);

      expect(onMove).not.toHaveBeenCalled();
      expect(placeholder()).toBeNull();
      expect(item(0).classList.contains('badfennec-todo__item--dragging')).toBe(false);
    });

    it('stops the drag on destroy', () => {
      const { view, root, pointer, onMove } = setupDrag();
      const handle = root.querySelector('.badfennec-todo__handle');

      pointer(0, 'pointerdown', 500);
      view.destroy();
      handle?.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, isPrimary: true }));

      expect(onMove).not.toHaveBeenCalled();
      expect(root.querySelector('.badfennec-todo__placeholder')).toBeNull();
      expect(root.classList.contains('badfennec-todo--dragging')).toBe(false);
    });
  });

  describe('keyboard reordering', () => {
    const D: TodoItem = { id: 'd', text: 'D', completed: false };

    /** Renders the items and re-renders them like the store would when a move is reported. */
    function setupKeyboard() {
      const context = setup();
      let items: TodoItem[] = [A, B, D, C];
      context.view.render(items);
      context.onMove.mockImplementation((id: string, toIndex: number) => {
        const moved = items.find((item) => item.id === id);
        if (!moved) return;
        items = items.filter((item) => item !== moved);
        items.splice(toIndex, 0, moved);
        context.view.render(items);
      });

      const press = (index: number, key: string, init: KeyboardEventInit = {}): KeyboardEvent => {
        const handle = context.button(index, 'handle');
        handle.focus();
        const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
        handle.dispatchEvent(event);
        return event;
      };
      const status = (): string | null | undefined =>
        context.root.querySelector('.badfennec-todo__status')?.textContent;

      return { ...context, press, status };
    }

    it('moves the item up and down by one with the arrows', () => {
      const { press, texts, onMove } = setupKeyboard();

      press(0, 'ArrowDown');
      expect(onMove).toHaveBeenLastCalledWith('a', 1);
      expect(texts('active')).toEqual(['B', 'A', 'D']);

      press(2, 'ArrowUp');
      expect(onMove).toHaveBeenLastCalledWith('d', 1);
      expect(texts('active')).toEqual(['B', 'D', 'A']);
    });

    it('moves the item to the first or last position with Home and End', () => {
      const { press, onMove } = setupKeyboard();

      press(2, 'Home');
      expect(onMove).toHaveBeenLastCalledWith('d', 0);

      press(0, 'End');
      expect(onMove).toHaveBeenLastCalledWith('d', 2);
    });

    it('keeps focus on the handle of the moved item', () => {
      const { root, press } = setupKeyboard();
      // Moving D up re-inserts D's own node, which drops its focus.
      const handle = root.querySelectorAll('.badfennec-todo__handle').item(2);

      press(2, 'ArrowUp');

      expect(document.activeElement).toBe(handle);
    });

    it('announces the new position', () => {
      const { press, status } = setupKeyboard();

      press(0, 'End');

      expect(status()).toBe('Moved to position 3 of 3');
    });

    it('does nothing at the edges, but keeps the arrows from scrolling the page', () => {
      const { press, onMove, status } = setupKeyboard();

      const up = press(0, 'ArrowUp');
      const down = press(2, 'ArrowDown');
      press(0, 'Home');

      expect(onMove).not.toHaveBeenCalled();
      expect(up.defaultPrevented).toBe(true);
      expect(down.defaultPrevented).toBe(true);
      expect(status()).toBe('');
    });

    it('ignores other keys, modifiers and keys outside the handle', () => {
      const { root, press, onMove } = setupKeyboard();

      press(0, 'Enter');
      press(0, 'ArrowDown', { altKey: true });
      press(0, 'ArrowDown', { shiftKey: true });
      root
        .querySelector('.badfennec-todo__toggle')
        ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

      expect(onMove).not.toHaveBeenCalled();
    });
  });
});
