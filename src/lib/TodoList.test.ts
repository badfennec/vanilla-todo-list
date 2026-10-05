import { afterEach, describe, expect, it, vi } from 'vitest';

import { TodoList } from './index';

function setup(options?: ConstructorParameters<typeof TodoList>[1]) {
  const root = document.createElement('div');
  root.id = 'todo';
  document.body.append(root);
  const todo = new TodoList(root, options);

  const texts = (modifier: string): string[] =>
    [...root.querySelectorAll(`.badfennec-todo__list--${modifier} .badfennec-todo__text`)].map(
      (text) => text.textContent,
    );
  const button = (selector: string, index = 0): HTMLButtonElement => {
    const element = root.querySelectorAll(selector).item(index);
    if (!(element instanceof HTMLButtonElement)) throw new Error(`${selector} ${String(index)} not found`);
    return element;
  };

  return { root, todo, texts, button };
}

const ITEMS = [
  { id: 'a', text: 'A' },
  { id: 'b', text: 'B' },
  { id: 'c', text: 'C', completed: true },
];

describe('TodoList', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  describe('constructor', () => {
    it('renders the initial items into an element', () => {
      const { root, texts } = setup({ items: ITEMS });

      expect(root.classList.contains('badfennec-todo')).toBe(true);
      expect(texts('active')).toEqual(['A', 'B']);
      expect(texts('completed')).toEqual(['C']);
    });

    it('accepts a CSS selector', () => {
      const root = document.createElement('section');
      root.className = 'my-list';
      document.body.append(root);

      new TodoList('.my-list', { items: [{ text: 'A' }] });

      expect(root.querySelectorAll('.badfennec-todo__item')).toHaveLength(1);
    });

    it('rejects an invalid target or invalid options', () => {
      expect(() => new TodoList('#missing')).toThrow(TypeError);
      expect(() => new TodoList(document.body, { items: [{ text: 1 }] } as never)).toThrow(
        new TypeError('options.items[0].text must be a string'),
      );
    });

    it('merges custom icons and labels with the defaults', () => {
      const { root, button } = setup({
        items: [{ text: 'A' }],
        icons: { delete: '<svg class="custom"></svg>' },
        labels: { delete: 'Elimina', addItem: 'Aggiungi' },
      });

      expect(button('.badfennec-todo__delete').getAttribute('aria-label')).toBe('Elimina');
      expect(button('.badfennec-todo__delete').querySelector('.custom')).not.toBeNull();
      expect(button('.badfennec-todo__add').textContent).toBe('Aggiungi');
      expect(button('.badfennec-todo__toggle').getAttribute('aria-label')).toBe('Completed');
      expect(root.querySelector('.badfennec-todo__handle svg')).not.toBeNull();
    });
  });

  describe('API', () => {
    it('adds, edits, toggles, moves and removes items, updating the DOM', () => {
      const { todo, texts } = setup({ items: ITEMS });

      const d = todo.add('D');
      expect(texts('active')).toEqual(['A', 'B', 'D']);

      todo.edit(d.id, 'D2');
      todo.move(d.id, 0);
      expect(texts('active')).toEqual(['D2', 'A', 'B']);

      todo.toggle('a');
      expect(texts('active')).toEqual(['D2', 'B']);
      expect(texts('completed')).toEqual(['C', 'A']);

      todo.remove('c');
      expect(texts('completed')).toEqual(['A']);
      expect(todo.getItems().map((item) => item.text)).toEqual(['D2', 'B', 'A']);
    });

    it('replaces every item with setItems, validating them', () => {
      const { todo, texts } = setup({ items: ITEMS });

      todo.setItems([{ text: 'X', completed: true }, { text: 'Y' }]);

      expect(texts('active')).toEqual(['Y']);
      expect(texts('completed')).toEqual(['X']);
      expect(() => {
        todo.setItems([{ id: '' }]);
      }).toThrow(TypeError);
    });

    it('validates the arguments of its methods', () => {
      const { todo } = setup({ items: ITEMS });

      expect(() => todo.add(1 as never)).toThrow(new TypeError('text must be a string'));
      expect(() => todo.edit('a', null as never)).toThrow(new TypeError('text must be a string'));
      expect(() => todo.remove(undefined as never)).toThrow(new TypeError('id must be a string'));
    });

    it('notifies listeners after the DOM is updated, and stops after off or unsubscribe', () => {
      const { root, todo } = setup();
      const seen: number[] = [];
      const onChange = vi.fn(() => {
        seen.push(root.querySelectorAll('.badfennec-todo__item').length);
      });
      const onAdd = vi.fn();

      const unsubscribe = todo.on('change', onChange);
      todo.on('add', onAdd);
      todo.add('A');
      unsubscribe();
      todo.off('add', onAdd);
      todo.add('B');

      expect(seen).toEqual([1]);
      expect(onAdd).toHaveBeenCalledOnce();
    });
  });

  describe('user interaction', () => {
    it('toggles and deletes items from the buttons', () => {
      const { todo, texts, button } = setup({ items: ITEMS });
      const onToggle = vi.fn();
      todo.on('toggle', onToggle);

      button('.badfennec-todo__toggle', 0).click();
      expect(texts('completed')).toEqual(['C', 'A']);
      expect(onToggle).toHaveBeenCalledOnce();

      button('.badfennec-todo__delete', 0).click();
      expect(todo.getItems().map((item) => item.id)).toEqual(['c', 'a']);
    });

    it('adds a focused empty item from the add row, and removes it if left empty (A7)', () => {
      const { root, todo, button } = setup();
      const events: string[] = [];
      todo.on('add', () => events.push('add'));
      todo.on('remove', () => events.push('remove'));

      button('.badfennec-todo__add').click();
      const text = root.querySelector<HTMLElement>('.badfennec-todo__text');
      expect(document.activeElement).toBe(text);
      expect(todo.getItems()).toHaveLength(1);

      text?.dispatchEvent(new Event('blur'));
      expect(todo.getItems()).toHaveLength(0);
      expect(events).toEqual(['add', 'remove']);
    });

    it('applies text edits from the item', () => {
      vi.useFakeTimers();
      const { root, todo } = setup({ items: [{ id: 'a', text: 'A' }] });
      const text = root.querySelector<HTMLElement>('.badfennec-todo__text');
      if (!text) throw new Error('text not found');

      text.textContent = 'A2';
      text.dispatchEvent(new Event('input'));
      vi.runAllTimers();
      vi.useRealTimers();

      expect(todo.getItems()[0]?.text).toBe('A2');
    });

    it('reorders items from the keyboard', () => {
      const { todo, button } = setup({ items: ITEMS });
      const handle = button('.badfennec-todo__handle', 0);

      handle.focus();
      handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

      expect(todo.getItems().map((item) => item.id)).toEqual(['b', 'a', 'c']);
      expect(document.activeElement).toBe(handle);
    });
  });

  it('removes its DOM and listeners on destroy, keeping the target element', () => {
    const { root, todo } = setup({ items: ITEMS });
    const onChange = vi.fn();
    todo.on('change', onChange);

    todo.destroy();
    todo.add('X');

    expect(root.isConnected).toBe(true);
    expect(root.children).toHaveLength(0);
    expect(root.classList.contains('badfennec-todo')).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
  });
});
