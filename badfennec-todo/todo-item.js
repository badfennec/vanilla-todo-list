import DragEvents from "./drag-events";

export default class TodoItem {

    completed = false;
    key = null;
    entry = null;
    grabber = null;
    startY = 0;

    checkedIcon = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 3C18 2.44772 17.5523 2 17 2H3C2.44772 2 2 2.44772 2 3V17C2 17.5523 2.44772 18 3 18H17C17.5523 18 18 17.5523 18 17V3ZM20 17C20 18.6569 18.6569 20 17 20H3C1.34315 20 0 18.6569 0 17V3C0 1.34315 1.34315 0 3 0H17C18.6569 0 20 1.34315 20 3V17Z" fill="black"/><path d="M12.2929 7.29289C12.6834 6.90237 13.3164 6.90237 13.707 7.29289C14.0975 7.68342 14.0975 8.31643 13.707 8.70696L9.70696 12.707C9.31643 13.0975 8.68342 13.0975 8.29289 12.707L6.29289 10.707C5.90237 10.3164 5.90237 9.68342 6.29289 9.29289C6.68342 8.90237 7.31643 8.90237 7.70696 9.29289L8.99992 10.5859L12.2929 7.29289Z" fill="black"/></svg>';
    uncheckedIcon = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 3C18 2.44772 17.5523 2 17 2H3C2.44772 2 2 2.44772 2 3V17C2 17.5523 2.44772 18 3 18H17C17.5523 18 18 17.5523 18 17V3ZM20 17C20 18.6569 18.6569 20 17 20H3C1.34315 20 0 18.6569 0 17V3C0 1.34315 1.34315 0 3 0H17C18.6569 0 20 1.34315 20 3V17Z" fill="black"/></svg>';

    constructor( args ) {
        const { ToDo, item, count, onDragStart, onDragMove, onDragEnd } = args;
        this.ToDo = ToDo;
        this.item = item;

        this.#setup( this.item, count );

        new DragEvents({ ToDo: this.ToDo, item: this, onDragStartCallback: onDragStart, onDragMoveCallback: onDragMove, onDragEndCallback: onDragEnd });
    }

    #setup( item, count ){
        this.key = count;
        this.entry = document.createElement('div');
        this.entry.className = 'badfennec-todo__item';
        this.completed = item.completed || false;
        this.text = item.text || '';

        this.#addItemGrabber();        

        this.#addItemCheckbox();

        this.#addItemText();
        this.ToDo.el.appendChild( this.entry );

        this.setStartY();
    }

    setStartY(){
        this.startY = this.entry.getBoundingClientRect().top;
    }

    #addItemGrabber(){
        this.grabber = document.createElement('div');
        const entryText = document.createTextNode('G');
        this.grabber.appendChild(entryText);
        this.entry.appendChild(this.grabber);

        this.grabber.addEventListener('mouseover', () => {
            if( this.ToDo.draggingItem ) 
                return;
            this.ToDo.el.style.cursor = 'grab';
        })
        this.grabber.addEventListener('mouseout', () => {
            if( this.ToDo.draggingItem ) 
                return;
            this.ToDo.el.style.cursor = '';
        });
    }

    #addItemCheckbox(){
        const div = document.createElement('div');

        const checkbox = document.createElement('input');
        checkbox.setAttribute('type', 'checkbox');
        checkbox.checked = this.completed;
        div.appendChild(checkbox);

        this.entry.appendChild(div);
    }

    #addItemText(){
        const div = document.createElement('div');
        this.entry.appendChild(div);
        const entryText = document.createTextNode(this.text);
        div.appendChild(entryText);
    }

}