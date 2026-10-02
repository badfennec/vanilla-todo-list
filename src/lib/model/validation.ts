import type { ParsedTodoOptions, TodoIcons, TodoItem, TodoLabels, TodoOptions } from './types';

// Typed as Record<keyof T, true> so the compiler fails if a key is added to the interface but not here.
const OPTION_KEYS = keysOf<TodoOptions>({ items: true, icons: true, labels: true });
const ICON_KEYS = keysOf<TodoIcons>({ checked: true, unchecked: true, grab: true, delete: true, add: true });
const LABEL_KEYS = keysOf<TodoLabels>({ addItem: true, toggle: true, delete: true, drag: true });

/**
 * Validates one consumer-provided item and fills in the defaults.
 * @throws {TypeError} if the value is not a valid item.
 */
export function parseItem(value: unknown, path = 'item'): TodoItem {
  if (!isRecord(value)) {
    throw new TypeError(`${path} must be an object`);
  }

  const id = readOptional(value, 'id', 'string', path);
  if (id === '') {
    throw new TypeError(`${path}.id must not be empty`);
  }

  return {
    id: id ?? crypto.randomUUID(),
    text: readOptional(value, 'text', 'string', path) ?? '',
    completed: readOptional(value, 'completed', 'boolean', path) ?? false,
  };
}

/**
 * Validates a list of consumer-provided items. Ids must be unique.
 * @throws {TypeError} if the value is not an array of valid items.
 */
export function parseItems(value: unknown, path = 'items'): TodoItem[] {
  if (!Array.isArray(value)) {
    throw new TypeError(`${path} must be an array`);
  }

  const seenIds = new Set<string>();

  return value.map((entry: unknown, index) => {
    const item = parseItem(entry, `${path}[${String(index)}]`);

    if (seenIds.has(item.id)) {
      throw new TypeError(`${path}[${String(index)}].id "${item.id}" is duplicated`);
    }
    seenIds.add(item.id);

    return item;
  });
}

/**
 * Validates the list constructor options.
 * @throws {TypeError} if the value is not a valid options object.
 */
export function parseOptions(value: unknown = {}): ParsedTodoOptions {
  const path = 'options';

  if (!isRecord(value)) {
    throw new TypeError(`${path} must be an object`);
  }

  for (const key of Object.keys(value)) {
    if (!isOneOf(key, OPTION_KEYS)) {
      throw new TypeError(`${path}.${key} is not supported`);
    }
  }

  return {
    items: value.items === undefined ? [] : parseItems(value.items, `${path}.items`),
    icons: parseStringMap(value.icons, ICON_KEYS, `${path}.icons`),
    labels: parseStringMap(value.labels, LABEL_KEYS, `${path}.labels`),
  };
}

interface TypeNames {
  string: string;
  boolean: boolean;
}

function readOptional<T extends keyof TypeNames>(
  record: Record<string, unknown>,
  key: string,
  type: T,
  path: string,
): TypeNames[T] | undefined {
  const value = record[key];

  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== type) {
    throw new TypeError(`${path}.${key} must be a ${type}`);
  }

  return value as TypeNames[T];
}

function parseStringMap<K extends string>(
  value: unknown,
  keys: readonly K[],
  path: string,
): Partial<Record<K, string>> {
  if (value === undefined) {
    return {};
  }
  if (!isRecord(value)) {
    throw new TypeError(`${path} must be an object`);
  }

  const result: Partial<Record<K, string>> = {};

  for (const [key, entry] of Object.entries(value)) {
    if (!isOneOf(key, keys)) {
      throw new TypeError(`${path}.${key} is not supported`);
    }
    if (entry === undefined) {
      continue;
    }
    if (typeof entry !== 'string') {
      throw new TypeError(`${path}.${key} must be a string`);
    }
    result[key] = entry;
  }

  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOneOf<K extends string>(key: string, keys: readonly K[]): key is K {
  return (keys as readonly string[]).includes(key);
}

function keysOf<T extends object>(shape: Record<keyof T & string, true>): (keyof T & string)[] {
  return Object.keys(shape) as (keyof T & string)[];
}
