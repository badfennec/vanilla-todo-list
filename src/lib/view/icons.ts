import type { TodoIcons } from '../model/types';

// Icons have no fixed size: CSS sizes them through `--bf-icon-size`. They are hidden from assistive technologies
// because the buttons that contain them carry the accessible name.
const SVG_OPEN =
  '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">';
const SVG_OPEN_SMALL =
  '<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">';
const SVG_CLOSE = '</svg>';

const BOX_PATH =
  '<path fill="currentColor" d="M18 3C18 2.44772 17.5523 2 17 2H3C2.44772 2 2 2.44772 2 3V17C2 17.5523 2.44772 18 3 18H17C17.5523 18 18 17.5523 18 17V3ZM20 17C20 18.6569 18.6569 20 17 20H3C1.34315 20 0 18.6569 0 17V3C0 1.34315 1.34315 0 3 0H17C18.6569 0 20 1.34315 20 3V17Z"/>';

const CHECK_PATH =
  '<path fill="currentColor" d="M12.2929 7.29289C12.6834 6.90237 13.3164 6.90237 13.707 7.29289C14.0975 7.68342 14.0975 8.31643 13.707 8.70696L9.70696 12.707C9.31643 13.0975 8.68342 13.0975 8.29289 12.707L6.29289 10.707C5.90237 10.3164 5.90237 9.68342 6.29289 9.29289C6.68342 8.90237 7.31643 8.90237 7.70696 9.29289L8.99992 10.5859L12.2929 7.29289Z"/>';

// 3×3 grid of dots: same shape as the legacy icon, written as circles instead of arc paths.
const GRAB_PATHS =
  '<g fill="currentColor">' +
  '<circle cx="5" cy="5" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="19" cy="5" r="2"/>' +
  '<circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>' +
  '<circle cx="5" cy="19" r="2"/><circle cx="12" cy="19" r="2"/><circle cx="19" cy="19" r="2"/>' +
  '</g>';

const DELETE_PATH =
  '<path fill="currentColor" d="M17.293 5.29297C17.6835 4.90244 18.3165 4.90244 18.707 5.29297C19.0974 5.68351 19.0975 6.31656 18.707 6.70703L13.4141 12L18.707 17.293C19.0974 17.6835 19.0975 18.3166 18.707 18.707C18.3166 19.0975 17.6835 19.0974 17.293 18.707L12 13.4141L6.70703 18.707C6.31656 19.0975 5.68351 19.0974 5.29297 18.707C4.90244 18.3165 4.90244 17.6835 5.29297 17.293L10.5859 12L5.29297 6.70703C4.90244 6.31651 4.90244 5.68349 5.29297 5.29297C5.68349 4.90244 6.31651 4.90244 6.70703 5.29297L12 10.5859L17.293 5.29297Z"/>';

const ADD_PATH =
  '<path fill="currentColor" d="M12 4C12.5523 4 13 4.44772 13 5V11H19C19.5523 11 20 11.4477 20 12C20 12.5523 19.5523 13 19 13H13V19C13 19.5523 12.5523 20 12 20C11.4477 20 11 19.5523 11 19V13H5C4.44772 13 4 12.5523 4 12C4 11.4477 4.44772 11 5 11H11V5C11 4.44772 11.4477 4 12 4Z"/>';

/** Default SVG icons. Consumers override any of them through the `icons` option. */
export const DEFAULT_ICONS: Readonly<TodoIcons> = Object.freeze({
  checked: SVG_OPEN_SMALL + BOX_PATH + CHECK_PATH + SVG_CLOSE,
  unchecked: SVG_OPEN_SMALL + BOX_PATH + SVG_CLOSE,
  grab: SVG_OPEN + GRAB_PATHS + SVG_CLOSE,
  delete: SVG_OPEN + DELETE_PATH + SVG_CLOSE,
  add: SVG_OPEN + ADD_PATH + SVG_CLOSE,
});
