import { describe, expect, it, vi } from 'vitest';

import { animateLanding } from './landing';

const LANDING_CLASS = 'badfennec-todo__item--landing';

// The test DOM has no TransitionEvent: a plain event with the property is enough for the handler.
function transitionEvent(type: string, propertyName: string): Event {
  return Object.assign(new Event(type), { propertyName });
}

describe('animateLanding', () => {
  it('starts from the offset and lets CSS animate the transform back to none', () => {
    const element = document.createElement('li');
    const transforms: string[] = [];
    element.getBoundingClientRect = vi.fn(() => {
      transforms.push(element.style.transform);
      return new DOMRect();
    });

    animateLanding(element, -100);

    // The layout is forced while the start position is applied, before the transition class.
    expect(transforms).toEqual(['translateY(-100px)']);
    expect(element.classList.contains(LANDING_CLASS)).toBe(true);
    expect(element.style.transform).toBe('');
  });

  it('ends when the transform transition ends or is cancelled, not other transitions', () => {
    for (const type of ['transitionend', 'transitioncancel']) {
      const element = document.createElement('li');
      animateLanding(element, 50);

      element.dispatchEvent(transitionEvent(type, 'opacity'));
      expect(element.classList.contains(LANDING_CLASS)).toBe(true);

      element.dispatchEvent(transitionEvent(type, 'transform'));
      expect(element.classList.contains(LANDING_CLASS)).toBe(false);
    }
  });

  it('can be stopped, more than once', () => {
    const element = document.createElement('li');
    const stop = animateLanding(element, 50);

    stop();
    stop();

    expect(element.classList.contains(LANDING_CLASS)).toBe(false);
  });

  it('does nothing when the item is already in its slot', () => {
    const element = document.createElement('li');

    animateLanding(element, 0)();

    expect(element.className).toBe('');
    expect(element.style.transform).toBe('');
  });
});
