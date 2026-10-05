import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EditableText, type EditableTextOptions } from './EditableText';

function setup(overrides: Partial<EditableTextOptions> = {}) {
  const onChange = vi.fn();
  const onLeave = vi.fn();
  const editable = new EditableText({ label: 'Item text', value: 'Buy milk', onChange, onLeave, ...overrides });
  document.body.append(editable.element);

  const type = (value: string): void => {
    editable.element.textContent = value;
    editable.element.dispatchEvent(new Event('input'));
  };
  const blur = (): void => {
    editable.element.dispatchEvent(new Event('blur'));
  };

  return { editable, element: editable.element, onChange, onLeave, type, blur };
}

describe('EditableText', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it('renders a labelled plain-text box with the initial value', () => {
    const { element } = setup();

    expect(element.getAttribute('contenteditable')).toBe('plaintext-only');
    expect(element.getAttribute('role')).toBe('textbox');
    expect(element.getAttribute('aria-label')).toBe('Item text');
    expect(element.classList.contains('badfennec-todo__text')).toBe(true);
    expect(element.textContent).toBe('Buy milk');
  });

  it('reports a change after the default delay of 300 ms', () => {
    const { type, onChange } = setup();

    type('Buy oat milk');
    vi.advanceTimersByTime(299);
    expect(onChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onChange).toHaveBeenCalledExactlyOnceWith('Buy oat milk');
  });

  it('uses a custom delay, restarting it while the user types', () => {
    const { type, onChange } = setup({ delay: 100 });

    type('Buy');
    vi.advanceTimersByTime(80);
    type('Buy bread');
    vi.advanceTimersByTime(80);
    expect(onChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(20);
    expect(onChange).toHaveBeenCalledExactlyOnceWith('Buy bread');
  });

  it('on blur reports the pending change first, then the leave', () => {
    const { type, blur, onChange, onLeave } = setup();
    const calls: string[] = [];
    onChange.mockImplementation(() => calls.push('change'));
    onLeave.mockImplementation(() => calls.push('leave'));

    type('Buy bread');
    blur();
    vi.runAllTimers();

    expect(calls).toEqual(['change', 'leave']);
    expect(onChange).toHaveBeenCalledExactlyOnceWith('Buy bread');
    expect(onLeave).toHaveBeenCalledExactlyOnceWith('Buy bread');
  });

  it('reports the leave even when nothing changed, but no change', () => {
    const { blur, onChange, onLeave } = setup();

    blur();

    expect(onChange).not.toHaveBeenCalled();
    expect(onLeave).toHaveBeenCalledExactlyOnceWith('Buy milk');
  });

  it('does not report text equal to the current value', () => {
    const { editable, type, onChange } = setup();

    editable.setValue('Buy bread');
    type('Buy bread');
    vi.runAllTimers();

    expect(onChange).not.toHaveBeenCalled();
  });

  it('confirms on Enter instead of adding a line break, but not while composing', () => {
    const { element } = setup();
    const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    const composing = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true, isComposing: true });

    element.dispatchEvent(enter);
    element.dispatchEvent(composing);

    expect(enter.defaultPrevented).toBe(true);
    expect(composing.defaultPrevented).toBe(false);
  });

  it('replaces line breaks with spaces in what it reports', () => {
    const { type, blur, onChange, onLeave } = setup();

    type('Buy\nmilk\r\nand eggs');
    blur();

    expect(onChange).toHaveBeenCalledExactlyOnceWith('Buy milk and eggs');
    expect(onLeave).toHaveBeenCalledExactlyOnceWith('Buy milk and eggs');
  });

  it('shows a new value, except while the user is typing', () => {
    const { editable, element, type } = setup();

    editable.setValue('Buy coffee');
    expect(element.textContent).toBe('Buy coffee');

    editable.focus();
    type('Buy t');
    editable.setValue('Changed elsewhere');
    expect(document.activeElement).toBe(element);
    expect(element.textContent).toBe('Buy t');
  });

  it('drops a pending change and removes its element and listeners on destroy (A3)', () => {
    const { editable, element, type, blur, onChange, onLeave } = setup();

    type('Buy bread');
    editable.destroy();
    vi.runAllTimers();
    blur();

    expect(onChange).not.toHaveBeenCalled();
    expect(onLeave).not.toHaveBeenCalled();
    expect(element.isConnected).toBe(false);
  });
});
