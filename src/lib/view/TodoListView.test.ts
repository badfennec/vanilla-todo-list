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
  const callbacks = { onToggle: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn(), onAdd: vi.fn() };
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

  it('renders the active list, the add row and the completed list into the root', () => {
    const { root, list, addButton } = setup();

    expect(root.classList.contains('badfennec-todo')).toBe(true);
    expect([...root.children]).toEqual([list('active'), addButton(), list('completed')]);
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
});
