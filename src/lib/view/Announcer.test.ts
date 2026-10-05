import { afterEach, describe, expect, it } from 'vitest';

import { Announcer } from './Announcer';

describe('Announcer', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('creates an empty, visually hidden status region', () => {
    const { element } = new Announcer();

    expect(element.getAttribute('role')).toBe('status');
    expect(element.classList.contains('badfennec-todo__status')).toBe(true);
    expect(element.textContent).toBe('');
  });

  it('announces texts by replacing the region content', () => {
    const announcer = new Announcer();

    announcer.announce('Moved to position 2 of 3');
    announcer.announce('Moved to position 3 of 3');

    expect(announcer.element.textContent).toBe('Moved to position 3 of 3');
  });

  it('removes its element on destroy', () => {
    const announcer = new Announcer();
    document.body.append(announcer.element);

    announcer.destroy();

    expect(announcer.element.isConnected).toBe(false);
  });
});
