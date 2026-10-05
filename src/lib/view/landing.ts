const LANDING_CLASS = 'badfennec-todo__item--landing';

/**
 * Animates a dropped item from where it was released to its slot (FLIP): the item is already in its final place in the
 * layout, it starts `offset` px away from it and CSS (`--landing`) animates the transform back to none.
 * Returns a function that stops the animation at once; it is safe to call more than once.
 */
export function animateLanding(element: HTMLElement, offset: number): () => void {
  if (offset === 0) {
    return () => undefined;
  }

  element.style.transform = `translateY(${String(offset)}px)`;
  // Forces a layout, so the start position is applied before the transition is turned on.
  element.getBoundingClientRect();
  element.classList.add(LANDING_CLASS);
  element.style.transform = '';

  const stop = (): void => {
    element.removeEventListener('transitionend', handleEnd);
    element.removeEventListener('transitioncancel', handleEnd);
    element.classList.remove(LANDING_CLASS);
  };
  // Opacity and box-shadow also transition when the drag ends: wait for the transform only.
  const handleEnd = (event: TransitionEvent): void => {
    if (event.target === element && event.propertyName === 'transform') {
      stop();
    }
  };
  element.addEventListener('transitionend', handleEnd);
  element.addEventListener('transitioncancel', handleEnd);

  return stop;
}
