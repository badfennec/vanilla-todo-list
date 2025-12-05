# BadFennec Todo

🚧 **WIP** - This project is currently under active development.

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

```bash
const items = [
    { text: 'Learn JavaScript', completed: false },
    { text: 'Build a Todo App', completed: true },
    { text: 'Profit!', completed: false },
    { text: 'Review code', completed: true },
    { text: 'Deploy application', completed: false }
];

const todoApp = new Todo({
    el: document.getElementById('todo'),
    items: items
});

```

## Events

You can listen for events using your ToDo instance (see example under the table). You can use the on() API method.

```bash
todoApp.on('update', ({ items }) => {
    console.log('Todo items updated:', items);
});
```

| Event Type          | Description                                                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| update                | Fired whenever the list is modified. This includes reordering via drag & drop and status changes (checked/unchecked). The payload contains the new ordered array of items.