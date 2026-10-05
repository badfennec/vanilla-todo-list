import { afterEach, describe, expect, it } from 'vitest';

import { DragSession } from './DragSession';

// Active list at y=1000 (viewport); three 40px items with a 10px gap: middles at 20, 70, 120 (relative to the list).
const LIST_TOP = 1000;

function setup(fromIndex = 0) {
  const root = document.createElement('div');
  const list = document.createElement('ul');
  const elements = [0, 1, 2].map((index) => {
    const item = document.createElement('li');
    // The test DOM has no layout: give the rects by hand.
    item.getBoundingClientRect = () => new DOMRect(0, LIST_TOP + index * 50, 300, 40);
    return item;
  });
  list.getBoundingClientRect = () => new DOMRect(0, LIST_TOP, 300, 140);
  list.append(...elements);
  root.append(list);
  document.body.append(root);

  const session = new DragSession({ root, list, elements, fromIndex });
  const placeholder = (): Element | null => list.querySelector('.badfennec-todo__placeholder');
  // The dragged element is out of the flow: only the order of the others and of the placeholder is visible.
  const flow = (): Element[] => [...list.children].filter((child) => child !== elements[fromIndex]);

  return { root, list, elements, session, placeholder, flow };
}

describe('DragSession', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('puts a placeholder in the slot of the dragged item and takes the item out of the flow', () => {
    const { root, list, elements, placeholder } = setup(1);
    const [a, b, c] = elements;

    expect([...list.children]).toEqual([a, placeholder(), b, c]);
    expect(placeholder()?.getAttribute('aria-hidden')).toBe('true');
    expect((placeholder() as HTMLElement).style.blockSize).toBe('40px');
    expect(b?.style.top).toBe('50px');
    expect(b?.classList.contains('badfennec-todo__item--dragging')).toBe(true);
    expect(root.classList.contains('badfennec-todo--dragging')).toBe(true);
  });

  it('starts at the index of the dragged item', () => {
    const { session } = setup(2);

    expect(session.fromIndex).toBe(2);
    expect(session.index).toBe(2);
  });

  it('moves the placeholder once the dragged middle passes another middle', () => {
    const { elements, session, placeholder, flow } = setup(0);
    const [, b, c] = elements;

    session.move(49); // middle at 69: still before B
    expect(session.index).toBe(0);
    expect(flow()).toEqual([placeholder(), b, c]);

    session.move(51); // middle at 71: after B
    expect(session.index).toBe(1);
    expect(flow()).toEqual([b, placeholder(), c]);

    session.move(500); // past C: last
    expect(session.index).toBe(2);
    expect(flow()).toEqual([b, c, placeholder()]);

    session.move(-500); // back to the top
    expect(session.index).toBe(0);
    expect(flow()).toEqual([placeholder(), b, c]);
  });

  it('restores the DOM on finish, and can be finished twice', () => {
    const { root, list, elements, session, placeholder } = setup(0);
    session.move(100);

    session.finish();
    session.finish();

    expect(placeholder()).toBeNull();
    expect([...list.children]).toEqual(elements);
    expect(elements[0]?.style.top).toBe('');
    expect(elements[0]?.classList.contains('badfennec-todo__item--dragging')).toBe(false);
    expect(root.classList.contains('badfennec-todo--dragging')).toBe(false);
  });

  it('rejects an index with no element', () => {
    const list = document.createElement('ul');

    expect(() => new DragSession({ root: list, list, elements: [], fromIndex: 0 })).toThrow(
      new RangeError('Index 0 is out of range (0--1)'),
    );
  });
});
