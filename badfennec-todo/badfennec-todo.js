
import Reactive from './reactive.js'; 
import TodoItem from './todo-item.js';
import Sorting from './sort.js';

import './badfennec-todo.css';

export default class BadFennecTodo {

    count = 0;
    updateCallback = null;
    rect = null;

    items = [];

    delta = 0;
    dragY = 0;

    draggingItem = null;
    draggingItemOriginY = 0;

    placeholder = null;

    reactive = null;
    reactiveSubscriber = null;    

    constructor({ el, items = [] }) {
        
        if(!el) {
            throw new Error('Element not provided for Todo app');
        }

        if( typeof el === 'string') {            
            this.el = document.querySelector(el);
        } else {
            this.el = el;
        }

        //this.items = [...items];

        this.#setup(items);
    }

    #setup(items) {

        this.el.classList.add('badfennec-todo');

        items.forEach(item => {
            //item = ;
            this.items.push(this.#addItem(item));
        });

        this.#addReactivity();
    }

    #addReactivity(){
        this.reactive = new Reactive({
            dragY: this.dragY,
            items: this.items
        });

        const subscibeCallback = ( value ) => {
            this.#onDeltaChange( value.dragY );
		}

        this.reactive.subscribe( subscibeCallback );
    }

    #addItem(item) {
        item = new TodoItem({ 
            ToDo: this, 
            item, 
            count: this.count,
            onDragStart: ( item ) => {
                this.#onDragStart( item );
            },
            onDragMove: ( deltaY ) => {
                this.#onDragMove( deltaY );
            },
            onDragEnd: ( finalY ) => {
                this.#onDragEnd( finalY );
            }
        });

        this.count++;

        return item;
    }

    on( event, callback ) {
        if( event === 'update' ) {
            this.updateCallback = callback;
        }
    }

    #onDragStart( item ){
        this.draggingItem = item;
        this.#addPlaceholder({ element: this.draggingItem.entry });
    }

    #onDragMove( deltaY ){
        this.reactive.next({
            dragY: deltaY,
            items: this.items
        });
    }

    #onDragEnd( finalY ) {
        const sorting = new Sorting({ ToDo: this });
        sorting.afterDrag( finalY );
        this.draggingItem = null;
        this.dragY = 0;
        this.delta = 0;
        this.#resetPlaceholder();

        if( sorting.hasSorted )
            this.#updateCallback();
    }

    #addPlaceholder({ element, insertMode = 'before' }){

        if( this.placeholder ) {
            this.#resetPlaceholder();
        }

        if( !this.placeholder ){
            this.placeholder = document.createElement('div');
            this.placeholder.className = 'badfennec-todo__item badfennec-todo__item--placeholder';
        }

        this.placeholder.style.height = `${this.draggingItem.entry.offsetHeight}px`;

        if( insertMode === 'before' ){
            this.el.insertBefore( this.placeholder, element );
        } else {
            this.el.insertBefore( this.placeholder, element.nextSibling );
        }
    }

    #resetPlaceholder(){
        if( this.placeholder ) {
            this.placeholder.remove();
        }
    }

    #onDeltaChange( dragY ){
        if( dragY === this.dragY ){
            return;
        }

        this.delta = this.dragY - dragY > 0 ? -1 : 1;
        this.dragY = dragY;
        this.#checkIntersections();
    }

    #checkIntersections(){

        //current dragged item
        const { entry } = this.draggingItem;

        //get bounding rect of dragged item once
        const entryRect = entry.getBoundingClientRect();

        //calculate middle Y of dragged item for intersection check
        const entryMiddleY = entryRect.top + entryRect.height / 2;

        const intersecting = this.items.find( item => {

            //skip self
            if( item === this.draggingItem ) {
                return false;
            }

            //check if item intersects with dragged item
            return item.entry.getBoundingClientRect().top < entryRect.bottom &&
                item.entry.getBoundingClientRect().bottom > entryMiddleY;
        });

        //manage intersection visual feedback
        if( intersecting ) {
            this.#onIntersection( intersecting );
        }

        //reset others items
        this.items.forEach( item => {
            if( item !== intersecting || item === this.draggingItem ) {
                this.#onIntersectionReset( item );
            }
        });
    }

    #onIntersection( intersectedItem ){

        if( this.delta < 0 ) {
            this.#addPlaceholder({ element: intersectedItem.entry, insertMode: 'before' });
        } else {
            this.#addPlaceholder({ element: intersectedItem.entry, insertMode: 'after' });
        }
    }

    //called to reset visual state of item after intersection
    #onIntersectionReset( item ){
        
    }

    #updateCallback(){

        if( !this.updateCallback )
            return;

        const items = [];

        this.items.forEach( item => {
            items.push({
                completed: item.completed,
                text: item.text
            });
        } );

        this.updateCallback({ items });
    }
}