
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

    container = null;
    completedContainer = null;

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

        this.#addContainers();

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

            this.#completedHandler();
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
            },
            onComplete: ( item ) => {
                this.#completeCallback( item );
            }
        });

        this.count++;

        return item;
    }

    #addContainers(){
        this.#addNotCompletedContainer();
        this.#addCompletedContainer();
    }

    #addNotCompletedContainer(){
        this.notCompletedContainer = document.createElement('div');
        this.notCompletedContainer.className = 'badfennec-todo__not-completed-container';
        this.el.appendChild( this.notCompletedContainer );
    }

    #addCompletedContainer(){
        this.completedContainer = document.createElement('div');
        this.completedContainer.className = 'badfennec-todo__completed-container';
        this.el.appendChild( this.completedContainer );
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
            //items: this.items
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

        if( element.parentNode !== this.notCompletedContainer ){
            return;
        }

        if( this.placeholder ) {
            this.#resetPlaceholder();
        }

        if( !this.placeholder ){
            this.placeholder = document.createElement('div');
            this.placeholder.className = 'badfennec-todo__item badfennec-todo__item--placeholder';
        }

        this.placeholder.style.height = `${this.draggingItem.entry.offsetHeight}px`;

        if( insertMode === 'before' ){
            this.notCompletedContainer.insertBefore( this.placeholder, element );
        } else {
            this.notCompletedContainer.insertBefore( this.placeholder, element.nextSibling );
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

        if( !this.draggingItem ) {
            return;
        }

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

    #completeCallback( item ){
        
        this.reactive.next({
            items: this.items
        });
        
        this.#updateCallback();
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

    #completedHandler(){

        let completedCount = 0;

        this.items.forEach( ( item, currentIndex ) => {

            if( item.completed ) {               

                //item is completed and not in completed container
                if( item.entry.parentNode !== this.completedContainer ) {
                    item.entry.remove();
                    this.completedContainer.appendChild( item.entry );
                }
            } else {
                if( item.entry.parentNode === this.completedContainer ) {
                    item.entry.remove();

                    const nextItem = this.items.find( ( nextItem, i ) => {
                        return i > currentIndex && !nextItem.completed && nextItem.entry.parentNode !== this.completedContainer;
                    });

                    if(!nextItem){
                        //No items found after current item that are not completed
                        this.notCompletedContainer.appendChild( item.entry );
                    } else {
                        //Insert before the next not completed item found
                        this.notCompletedContainer.insertBefore( item.entry, nextItem.entry );
                    }
                }
            }            

            item.setStartY();
            completedCount++;
        });

        if( completedCount > 0 ) {
            this.el.insertBefore( this.completedContainer, this.notCompletedContainer.nextSibling );
        } else {
            this.completedContainer.remove();
        }

    }
}