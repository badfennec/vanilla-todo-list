# BadFennec Todo

A lightweight, dependency-free To-Do list built in Vanilla JS. It features a custom Drag & Drop engine designed to work seamlessly on both mouse and touch devices.

## Key Features

- **Zero Dependencies:** Pure modern JavaScript.

- **Custom Physics:** Smoother experience than native HTML5 Drag & Drop.

- **Mobile Ready:** Full touch support without scroll conflicts.

- **Smart Sorting:** Automatically handles reordering between "Active" and "Completed" lists.


## Usage

```bash
gh repo clone badfennec/vanilla-todo-list
cd vanilla-todo-list
npm install
npm run dev
```

```bash
import Todo from 'path/to/file/badfennec-todo.js';
```

Initialize the application by creating a new instance. The constructor accepts a configuration object with the following properties:

- **el:** The target container. Accepts either a CSS selector string (e.g., '#todo') or a direct DOM Element.
- **items:** An array of objects. Each object must contain a text (string) and a completed (boolean) status.
- **itemsGap:** Gap between an item and other. Default: 10.
- **icons:** An object with custom icons to use instead of the default ones. Available icons are: itemCheckedIcon, itemUncheckedIcon, itemGrabIcon, itemDeleteIcon and addIcon

```bash
const items = [
    { text: 'Learn JavaScript', completed: false },
    { text: 'Build a Todo App', completed: true },
    { text: 'Profit!', completed: false },
    { text: 'Review code', completed: true },
    { text: 'Deploy application', completed: false }
];

const icons: {
    itemCheckedIcon: '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="3" d="M2,12 L9,19 L22,4"/></svg>',
    itemUncheckedIcon: '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" fill="none"/></svg>',
    itemGrabIcon: '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="5" cy="5" r="2" fill="currentColor"/><circle cx="12" cy="5" r="2" fill="currentColor"/><circle cx="19" cy="5" r="2" fill="currentColor"/><circle cx="5" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="19" cy="12" r="2" fill="currentColor"/><circle cx="5" cy="19" r="2" fill="currentColor"/><circle cx="12" cy="19" r="2" fill="currentColor"/><circle cx="19" cy="19" r="2" fill="currentColor"/></svg>',
    itemDeleteIcon: '<svg viewBox="0 0 24 24" width="16" height="16"><line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" stroke-width="3"/><line x1="20" y1="4" x2="4" y2="20" stroke="currentColor" stroke-width="3"/></svg>',
    addIcon: '<svg viewBox="0 0 24 24" width="16" height="16"><line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" stroke-width="3"/><line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="3"/></svg>'
}

const todoApp = new Todo({
    el: document.getElementById('todo'),
    items: items,
    itemsGap: 25,
    icons
});

```

## Events

You can listen for events using your ToDo instance (see example under the table). You can use the on() API method.

```bash
todoApp.on('input', ({ item }) => {
    console.log('Todo item input changed:', item);
});

todoApp.on('update', ({ items }) => {
    console.log('Todo items updated:', items);
});

todoApp.on('toggle', ({ item, items }) => {
    console.log('Todo item toggled:', item, items);
});

todoApp.on('delete', ({ item, items }) => {
    console.log('Todo item deleted:', item, items);
});
```

| Event Type          | Description                                                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| update                | Fired whenever the list is modified. This includes reordering via drag & drop and status changes (checked/unchecked). The payload contains the new ordered array of items.
| input                | Fired whene item text change. The payload contains the item.
| toogle               | Fired when an item is checked or unchecked.
| delete               | Fired when an item is removed from the list. The payload contains the removed item