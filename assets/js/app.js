import Todo from '../../badfennec-todo/badfennec-todo.js';

document.addEventListener('DOMContentLoaded', function() {

    const items = [
        
        { text: 'Learn JavaScript', completed: false },
        { text: 'Build a Todo App', completed: false },    
        { text: 'Write documentation Write documentation Write documentation Write documentation Write documentation', completed: false }, 
        { text: 'Profit!', completed: false },
        { text: 'Review code', completed: true },
        { text: 'Deploy application', completed: false },
        
    ];

    const todoApp = new Todo({
        el: document.getElementById('todo'), // or you can use a selector string like '#todo'
        items: items,
        //itemsGap: 25,
        icons: {
            /* itemCheckedIcon: '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="3" d="M2,12 L9,19 L22,4"/></svg>',
            itemUncheckedIcon: '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" fill="none"/></svg>',
            itemGrabIcon: '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="5" cy="5" r="2" fill="currentColor"/><circle cx="12" cy="5" r="2" fill="currentColor"/><circle cx="19" cy="5" r="2" fill="currentColor"/><circle cx="5" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="19" cy="12" r="2" fill="currentColor"/><circle cx="5" cy="19" r="2" fill="currentColor"/><circle cx="12" cy="19" r="2" fill="currentColor"/><circle cx="19" cy="19" r="2" fill="currentColor"/></svg>',
            itemDeleteIcon: '<svg viewBox="0 0 24 24" width="16" height="16"><line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" stroke-width="3"/><line x1="20" y1="4" x2="4" y2="20" stroke="currentColor" stroke-width="3"/></svg>', */
        }
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