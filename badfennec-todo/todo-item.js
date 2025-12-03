import DragEvents from "./drag-events";

export default class TodoItem {

    completed = false;
    key = null;
    entry = null;
    grabber = null;
    startY = 0;

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