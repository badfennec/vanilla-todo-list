import DragEvents from "./drag-events";

export default class TodoItem {

    constructor( args ) {
        const { ToDo, item, count, onDragStart, onDragMove, onDragEnd } = args;
        this.ToDo = ToDo;
        this.item = item;

        this.#setup( this.item, count );

        new DragEvents({ ToDo: this.ToDo, item: this.item, onDragStartCallback: onDragStart, onDragMoveCallback: onDragMove, onDragEndCallback: onDragEnd });

        return this.item;
    }

    #setup( item, count ){
        item.key = count;
        const entry = document.createElement('div');
        entry.className = 'badfennec-todo__item';
        item.entry = entry;

        item.grabber = this.#addItemGrabber(item);

        this.#addItemCheckbox(item);

        this.#addItemText(item);

        this.ToDo.el.appendChild( item.entry );
    }

    #addItemGrabber(item){
        const { entry } = item;
        const div = document.createElement('div');
        const entryText = document.createTextNode('G');
        div.appendChild(entryText);
        entry.appendChild(div);

        div.addEventListener('mouseover', () => {
            if( this.ToDo.draggingItem ) 
                return;
            this.ToDo.el.style.cursor = 'grab';
        })
        div.addEventListener('mouseout', () => {
            if( this.ToDo.draggingItem ) 
                return;
            this.ToDo.el.style.cursor = '';
        });

        return div;
    }

    #addItemCheckbox( item ){
        const { entry } = item;
        const div = document.createElement('div');
        const checkbox = document.createElement('input');
        checkbox.setAttribute('type', 'checkbox');
        checkbox.checked = item.completed;
        div.appendChild(checkbox);
        entry.appendChild(div);
    }

    #addItemText(item){
        const { entry } = item;
        const div = document.createElement('div');
        entry.appendChild(div);
        const entryText = document.createTextNode(item.text);
        div.appendChild(entryText);
    }

}