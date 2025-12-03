import DragEvents from "./drag-events";

export default class TodoItem {

    completed = false;
    key = null;
    entry = null;
    grabber = null;
    startY = 0;

    grabIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 5C10 3.89543 10.8954 3 12 3C13.1046 3 14 3.89543 14 5C14 6.10457 13.1046 7 12 7C10.8954 7 10 6.10457 10 5Z"fill="currentColor"/><path d="M17 5C17 3.89543 17.8954 3 19 3C20.1046 3 21 3.89543 21 5C21 6.10457 20.1046 7 19 7C17.8954 7 17 6.10457 17 5Z"fill="currentColor"/><path d="M3 5C3 3.89543 3.89543 3 5 3C6.10457 3 7 3.89543 7 5C7 6.10457 6.10457 7 5 7C3.89543 7 3 6.10457 3 5Z"fill="currentColor"/><path d="M10 12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12Z"fill="currentColor"/><path d="M17 12C17 10.8954 17.8954 10 19 10C20.1046 10 21 10.8954 21 12C21 13.1046 20.1046 14 19 14C17.8954 14 17 13.1046 17 12Z"fill="currentColor"/><path d="M3 12C3 10.8954 3.89543 10 5 10C6.10457 10 7 10.8954 7 12C7 13.1046 6.10457 14 5 14C3.89543 14 3 13.1046 3 12Z"fill="currentColor"/><path d="M10 19C10 17.8954 10.8954 17 12 17C13.1046 17 14 17.8954 14 19C14 20.1046 13.1046 21 12 21C10.8954 21 10 20.1046 10 19Z"fill="currentColor"/><path d="M17 19C17 17.8954 17.8954 17 19 17C20.1046 17 21 17.8954 21 19C21 20.1046 20.1046 21 19 21C17.8954 21 17 20.1046 17 19Z"fill="currentColor"/><path d="M3 19C3 17.8954 3.89543 17 5 17C6.10457 17 7 17.8954 7 19C7 20.1046 6.10457 21 5 21C3.89543 21 3 20.1046 3 19Z"fill="currentColor"/></svg>';

    constructor( args ) {
        const { ToDo, item, count, onDragStart, onDragMove, onDragEnd } = args;
        this.ToDo = ToDo;
        this.item = item;

        this.grabIcon = args.grabIcon || this.grabIcon;

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
        this.grabber.innerHTML = this.grabIcon;
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