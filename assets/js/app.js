import Todo from '../../badfennec-todo/badfennec-todo.js';

document.addEventListener('DOMContentLoaded', function() {

    const items = [
        { text: 'Learn JavaScript', completed: false },
        { text: 'Build a Todo App', completed: false },
        { text: 'Profit!', completed: false },
        { text: 'Review code', completed: true },
        { text: 'Deploy application', completed: false },
        { text: 'Write documentation Write documentation Write documentation Write documentation Write documentation', completed: true }
    ];

    const todoApp = new Todo({
        el: document.getElementById('todo'), // or you can use a selector string like '#todo'
        items: items
    }); 

    todoApp.on('update', ({ items }) => {
        console.log('Todo items updated:', items);
    });

    todoApp.on('delete', ( item ) => {
        console.log('Todo item deleted:', item);
    });
})