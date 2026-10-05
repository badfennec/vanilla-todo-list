import type { TodoLabels } from '../model/types';

/** Default English texts. Consumers override any of them through the `labels` option. */
export const DEFAULT_LABELS: Readonly<TodoLabels> = Object.freeze({
  addItem: 'Add new item',
  toggle: 'Completed',
  delete: 'Delete item',
  drag: 'Move item',
  text: 'Item text',
  moved: 'Moved to position {position} of {total}',
});

/**
 * Replaces each `{name}` placeholder of a label with its value, e.g.
 * `fillLabel('Moved to position {position}', { position: 2 })` → `'Moved to position 2'`.
 * Unknown placeholders are left as they are.
 */
export function fillLabel(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) => {
    const value = values[name];
    return value === undefined ? placeholder : String(value);
  });
}
