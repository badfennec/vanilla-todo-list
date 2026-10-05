import { describe, expect, it } from 'vitest';

describe('test environment', () => {
  it('provides a DOM', () => {
    const element = document.createElement('div');
    document.body.append(element);

    expect(element).toBeInstanceOf(HTMLElement);
    expect(document.body.contains(element)).toBe(true);
  });
});
