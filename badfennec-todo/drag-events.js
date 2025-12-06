import DragPhysics from './drag-physics.js';

export default class DragEvents {

    constructor({ ToDo, item, onDragStartCallback, onDragMoveCallback, onDragEndCallback }) {
        this.ToDo = ToDo;
        this.item = item;
        this.onDragStartCallback = onDragStartCallback;
        this.onDragMoveCallback = onDragMoveCallback;
        this.onDragEndCallback = onDragEndCallback;

        this.#addItemDragEvents(item);
    }

    #addItemDragEvents(){
        const {entry, grabber} = this.item;

        new DragPhysics({
            grabber: grabber,
            item: this.item,
            element: entry,
            container: this.ToDo.el,
            
            onStart: () => {
                this.#onDragStart();
            },

            onMove: (e, deltaY) => {
                this.#onDragMove(deltaY);
            },
            
            onEnd: ( finalY ) => {
                this.#onDragEnd( finalY );
            }
        });
    }

    #onDragStart() {

        const { entry } = this.item;

        const entryRect = entry.getBoundingClientRect();

        entry.style.position = 'fixed';
        entry.style.top = `${entryRect.top}px`;
        entry.style.left = `${entryRect.left}px`;
        entry.style.width = `${entryRect.width}px`;

        this.ToDo.el.style.cursor = 'grabbing';

        //add class to main container to indicate dragging
        this.ToDo.el.classList.add('badfennec-todo--dragging');

        //add class to entry being dragged
        entry.classList.add('badfennec-todo__item--dragging');
        

        if( this.onDragStartCallback ){
            this.onDragStartCallback(this.item);
        }
    }

    #onDragMove(deltaY){
        if( this.onDragMoveCallback ){
            this.onDragMoveCallback(deltaY);
        }
    }

    #onDragEnd( finalY ) {
        const { entry } = this.ToDo.draggingItem;

        entry.style.position = '';
        entry.style.top = ``;
        entry.style.left = ``;
        entry.style.width = ``;

        this.ToDo.el.style.cursor = '';

        //remove dragging class from main container
        this.ToDo.el.classList.remove('badfennec-todo--dragging');

        //remove class from entry being dragged
        entry.classList.remove('badfennec-todo__item--dragging');

        if( this.onDragEndCallback ){
            this.onDragEndCallback( finalY );
        }
    }

}