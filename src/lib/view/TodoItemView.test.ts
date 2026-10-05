import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TodoItem } from '../model/types';
import { DEFAULT_ICONS } from './icons';
import { DEFAULT_LABELS } from './labels';
import { TodoItemView } from './TodoItemView';

const ITEM: TodoItem = { id: 'a', text: 'Buy milk', completed: false };

function setup(item: TodoItem = ITEM, options: { editDelay?: number } = {}) {
  const callbacks = { onToggle: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() };
  const view = new TodoItemView({ item, icons: DEFAULT_ICONS, labels: DEFAULT_LABELS, ...callbacks, ...options });
  document.body.append(view.element);

  const query = <T extends Element>(selector: string, type: new () => T): T => {
    const element = view.element.querySelector(selector);
    if (!(element instanceof type)) throw new Error(`${selector} not found`);
    return element;
  };

  return {
    view,
    ...callbacks,
    handle: query('.badfennec-todo__handle', HTMLButtonElement),
    toggle: query('.badfennec-todo__toggle', HTMLButtonElement),
    remove: query('.badfennec-todo__delete', HTMLButtonElement),
    text: query('.badfennec-todo__text', HTMLDivElement),
  };
}

/** The markup as the DOM serializes it (e.g. `<path/>` becomes `<path></path>`). */
function serialized(html: string): string {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.innerHTML;
}

function type(text: HTMLElement, value: string): void {
  text.textContent = value;
  text.dispatchEvent(new Event('input'));
}

describe('TodoItemView', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it('renders real buttons with accessible names and the item text', () => {
    const { view, handle, toggle, remove, text } = setup();

    expect(view.element.tagName).toBe('LI');
    for (const button of [handle, toggle, remove]) {
      expect(button.tagName).toBe('BUTTON');
      expect(button.type).toBe('button');
    }
    expect(handle.getAttribute('aria-label')).toBe(DEFAULT_LABELS.drag);
    expect(toggle.getAttribute('aria-label')).toBe(DEFAULT_LABELS.toggle);
    expect(remove.getAttribute('aria-label')).toBe(DEFAULT_LABELS.delete);
    expect(text.getAttribute('aria-label')).toBe(DEFAULT_LABELS.text);
    expect(text.textContent).toBe('Buy milk');
  });

  it('renders the completed state', () => {
    const { view, toggle } = setup({ ...ITEM, completed: true });

    expect(view.element.classList.contains('badfennec-todo__item--completed')).toBe(true);
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(toggle.innerHTML).toBe(serialized(DEFAULT_ICONS.checked));
  });

  it('reports toggle and delete intents without changing the item', () => {
    const { view, toggle, remove, onToggle, onDelete } = setup();

    toggle.click();
    remove.click();

    expect(onToggle).toHaveBeenCalledExactlyOnceWith('a');
    expect(onDelete).toHaveBeenCalledExactlyOnceWith('a');
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    expect(view.element.isConnected).toBe(true);
  });

  // Text editing itself (debounce, blur, Enter, line breaks) is covered by EditableText.test.ts.
  it('reports text changes with the item id, after its edit delay', () => {
    const { text, onEdit } = setup(ITEM, { editDelay: 100 });

    type(text, 'Buy bread');
    vi.advanceTimersByTime(99);
    expect(onEdit).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onEdit).toHaveBeenCalledExactlyOnceWith('a', 'Buy bread');
  });

  it('renders a new state of the item on update', () => {
    const { view, toggle, text } = setup();

    view.update({ ...ITEM, text: 'Buy coffee', completed: true });

    expect(view.element.classList.contains('badfennec-todo__item--completed')).toBe(true);
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(toggle.innerHTML).toBe(serialized(DEFAULT_ICONS.checked));
    expect(text.textContent).toBe('Buy coffee');
  });

  it('focuses the text of a new item', () => {
    const { view, text } = setup({ ...ITEM, text: '' });

    view.editAsNew();

    expect(document.activeElement).toBe(text);
  });

  it('deletes a new item left empty (A7)', () => {
    const { view, text, onDelete, onEdit } = setup({ ...ITEM, text: '' });

    view.editAsNew();
    text.dispatchEvent(new Event('blur'));

    expect(onDelete).toHaveBeenCalledExactlyOnceWith('a');
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('deletes a new item whose text was typed and then cleared', () => {
    const { view, text, onDelete } = setup({ ...ITEM, text: '' });

    view.editAsNew();
    type(text, 'Buy');
    vi.runAllTimers();
    view.update({ ...ITEM, text: 'Buy' });
    type(text, '');
    text.dispatchEvent(new Event('blur'));

    expect(onDelete).toHaveBeenCalledExactlyOnceWith('a');
  });

  it('keeps a new item that was given a text', () => {
    const { view, text, onDelete, onEdit } = setup({ ...ITEM, text: '' });

    view.editAsNew();
    type(text, 'Buy bread');
    text.dispatchEvent(new Event('blur'));

    expect(onEdit).toHaveBeenCalledExactlyOnceWith('a', 'Buy bread');
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('keeps an existing item emptied by the user', () => {
    const { text, onDelete, onEdit } = setup();

    type(text, '');
    text.dispatchEvent(new Event('blur'));

    expect(onEdit).toHaveBeenCalledExactlyOnceWith('a', '');
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('deletes a new item left empty only the first time it is left', () => {
    const { view, text, onDelete } = setup({ ...ITEM, text: '' });

    view.editAsNew();
    type(text, 'Buy');
    text.dispatchEvent(new Event('blur'));
    view.update({ ...ITEM, text: 'Buy' });
    type(text, '');
    text.dispatchEvent(new Event('blur'));

    expect(onDelete).not.toHaveBeenCalled();
  });

  it('drops a pending text change on destroy (A3)', () => {
    const { view, text, onEdit } = setup();

    type(text, 'Buy bread');
    view.destroy();
    vi.runAllTimers();

    expect(onEdit).not.toHaveBeenCalled();
  });

  it('removes its element and listeners on destroy', () => {
    const { view, toggle, onToggle } = setup();

    view.destroy();
    toggle.click();

    expect(view.element.isConnected).toBe(false);
    expect(onToggle).not.toHaveBeenCalled();
  });
});
