// Demo app. It uses the library like a consumer would: the font and the theme are imported here, not by the library.
// Latin subset, weight 400: all the demo needs.
import '@fontsource/poppins/latin-400.css';
import '../lib/styles/todo.css';
import './demo.css';

import { TodoList } from '../lib';

const todo = new TodoList('#todo', {
  items: [
    { text: 'Learn JavaScript' },
    { text: 'Build a Todo App' },
    { text: 'Write documentation' },
    { text: 'Profit!' },
    { text: 'Review code', completed: true },
    { text: 'Deploy application' },
    { text: 'Fix bugs', completed: true },
    { text: 'Refactor codebase' },
    { text: 'Optimize performance' },
    { text: 'Update dependencies', completed: true },
    { text: 'Write tests' },
  ],
});

todo.on('add', ({ item }) => {
  console.log('add', item);
});
todo.on('remove', ({ item }) => {
  console.log('remove', item);
});
todo.on('toggle', ({ item }) => {
  console.log('toggle', item);
});
todo.on('edit', ({ item }) => {
  console.log('edit', item);
});
todo.on('move', ({ item, fromIndex, toIndex }) => {
  console.log('move', item, { fromIndex, toIndex });
});
todo.on('change', ({ items }) => {
  console.log('change', items);
});
