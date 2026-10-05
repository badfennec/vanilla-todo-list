import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TodoItem } from '../model/types';
import { DEFAULT_ICONS } from './icons';
import { DEFAULT_LABELS } from './labels';
import { TodoItemView } from './TodoItemView';

const ITEM: TodoItem = { id: 'a', text: 'Buy milk', completed: false };

function setup(item: TodoItem = ITEM) {
  const callbacks = { onToggle: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() };
  const view = new TodoItemView({ item, icons: DEFAULT_ICONS, labels: DEFAULT_LABELS, ...callbacks });
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
    expect(text.getAttribute('contenteditable')).toBe('plaintext-only');
    expect(text.getAttribute('role')).toBe('textbox');
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

  it('reports a text change after the edit delay', () => {
    const { text, onEdit } = setup();

    type(text, 'Buy');
    vi.advanceTimersByTime(200);
    type(text, 'Buy oat milk');
    vi.advanceTimersByTime(299);
    expect(onEdit).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onEdit).toHaveBeenCalledExactlyOnceWith('a', 'Buy oat milk');
  });

  it('reports a pending text change at once on blur', () => {
    const { text, onEdit } = setup();

    type(text, 'Buy bread');
    text.dispatchEvent(new Event('blur'));
    vi.runAllTimers();

    expect(onEdit).toHaveBeenCalledExactlyOnceWith('a', 'Buy bread');
  });

  it('does not report unchanged text', () => {
    const { text, onEdit } = setup();

    type(text, 'Buy milk');
    vi.runAllTimers();
    text.dispatchEvent(new Event('blur'));

    expect(onEdit).not.toHaveBeenCalled();
  });

  it('confirms the text on Enter instead of adding a line break', () => {
    const { text } = setup();
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });

    text.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it('replaces pasted line breaks with spaces', () => {
    const { text, onEdit } = setup();

    type(text, 'Buy\nmilk\r\nand eggs');
    vi.runAllTimers();

    expect(onEdit).toHaveBeenCalledExactlyOnceWith('a', 'Buy milk and eggs');
  });

  it('renders a new state of the item on update', () => {
    const { view, toggle, text } = setup();

    view.update({ ...ITEM, text: 'Buy coffee', completed: true });

    expect(view.element.classList.contains('badfennec-todo__item--completed')).toBe(true);
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(toggle.innerHTML).toBe(serialized(DEFAULT_ICONS.checked));
    expect(text.textContent).toBe('Buy coffee');
  });

  it('does not rewrite the text while the user is typing in it', () => {
    const { view, text } = setup();

    text.focus();
    type(text, 'Buy m');
    view.update({ ...ITEM, text: 'Changed elsewhere' });

    expect(text.textContent).toBe('Buy m');
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
