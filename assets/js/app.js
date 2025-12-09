import Todo from '../../badfennec-todo/badfennec-todo.js';

document.addEventListener('DOMContentLoaded', function() {

    const items = [
        
        { text: 'Learn JavaScript', completed: false },
        { text: 'Build a Todo App', completed: false },    
        { text: 'Write documentation', completed: false }, 
        { text: 'Profit!', completed: false },
        { text: 'Review code', completed: true },
        { text: 'Deploy application', completed: false },
        
    ];

    const todoApp = new Todo({
        el: document.getElementById('todo'),
        items: items
    }); 

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
})