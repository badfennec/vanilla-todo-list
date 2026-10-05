/**
 * A polite live region (`role="status"`): texts passed to `announce()` are read by screen readers without moving the
 * focus. The element is visually hidden by the `badfennec-todo__status` class; the caller places it in the page.
 */
export class Announcer {
  readonly element: HTMLDivElement;

  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'badfennec-todo__status';
    this.element.setAttribute('role', 'status');
  }

  announce(text: string): void {
    this.element.textContent = text;
  }

  destroy(): void {
    this.element.remove();
  }
}
