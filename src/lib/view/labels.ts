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
