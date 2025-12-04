
import Reactive from './reactive.js'; 
import TodoItem from './todo-item.js';
import Sorting from './sort.js';
import DragIntersector from './drag-intersector.js';

import './badfennec-todo.css';

export default class BadFennecTodo {

    count = 0;
    updateCallback = null;
    rect = null;

    items = [];

    delta = 0;
    dragY = 0;

    draggingItem = null;
    lastIntersectedItem = null;
    draggingItemOriginY = 0;

    placeholder = null;

    reactive = null;
    reactiveSubscriber = null;

    dragIntersector = null;

    notCompletedContainer = null;
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
        this.#addIntersector();
    }

    #addReactivity(){
        this.reactive = new Reactive({
            dragY: this.dragY,
            items: this.items
        });

        const subscibeCallback = ( value ) => {
            this.#onDeltaChange( value.dragY );

            if( !this.draggingItem ) {
                this.#completedHandler();
            }            
		}

        this.reactive.subscribe( subscibeCallback );
    }

    #addIntersector(){
        this.dragIntersector = new DragIntersector(this);
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

    /**
     * Triggered when drag starts
     * @param {*} item 
     */
    #onDragStart( item ){
        this.draggingItem = item;

        //Add placeholder at original position to not collapse list
        this.dragIntersector.addPlaceholder({ element: this.draggingItem.entry });
    }

    #onDragMove( deltaY ){

        this.reactive.next({
            dragY: deltaY,
            //items: this.items
        });
    }

    #onDragEnd( finalY ) {
        this.dragIntersector.onIntersectionReset( this.lastIntersectedItem );

        if( this.placeholder ){
            this.placeholder.remove();
        }

        const sorting = new Sorting({ ToDo: this });
        sorting.afterDrag( finalY );
        this.draggingItem = null;
        this.dragY = 0;
        this.delta = 0;
        this.dragIntersector.resetPlaceholder();
        this.dragIntersector.resetOverWindow();

        if( sorting.hasSorted ){
            this.#updateCallback();
        }
    }

    /**
     * Add a placeholder element at the original position of the dragged item
     * to prevent the list from collapsing during drag.
     * @param {*} param0 
     */
    /* #addPlaceholder({ element, insertMode = 'before' }){

        //only add placeholder if the element is in the not completed container
        if( element.parentNode !== this.notCompletedContainer ){
            return;
        }

        //remove existing placeholder
        if( this.placeholder ) {
            this.placeholder.remove();
            this.#resetPlaceholder();
        }

        //create placeholder if not existing only once
        if( !this.placeholder ){
            this.placeholder = document.createElement('div');
            this.placeholder.className = 'badfennec-todo__item badfennec-todo__item--placeholder';
        }

        //set height of placeholder to match dragged item height
        this.placeholder.style.paddingTop = `${this.draggingItem.getHeight()}px`;

        //insert placeholder before or after the element based on insertMode
        if( insertMode === 'before' ){
            this.notCompletedContainer.insertBefore( this.placeholder, element );
        } else {
            this.notCompletedContainer.insertBefore( this.placeholder, element.nextSibling );
        }
    }

    #resetPlaceholder(){
        if( this.placeholder ) {
            this.placeholder.style.paddingTop = `0px`;
        }
    } */

    #onDeltaChange( dragY ){
        if( dragY === this.dragY ){
            return;
        }

        this.delta = this.dragY - dragY > 0 ? -1 : 1;
        this.dragY = dragY;
        this.dragIntersector.checkIntersections();
    }

    /* #checkIntersections(){

        if( !this.draggingItem ) {
            return;
        }

        //current dragged item
        const { entry } = this.draggingItem;

        //get bounding rect of dragged item once
        const entryRect = entry.getBoundingClientRect();

        //calculate middle Y of dragged item for intersection check
        const entryMiddleY = entryRect.top + entryRect.height / 2;

        this.lastIntersectedItem = this.items.find( item => {

            //skip self
            if( item === this.draggingItem ) {
                return false;
            }

            //check if item intersects with dragged item
            return item.entry.getBoundingClientRect().top < entryRect.bottom &&
                item.entry.getBoundingClientRect().bottom > entryMiddleY;
        });

        //manage intersection visual feedback
        if( this.lastIntersectedItem ) {
            this.#resetPlaceholder();
            this.#onIntersection();
        }

        //reset others items
        this.items.forEach( item => {
            if( item !== this.lastIntersectedItem || item === this.draggingItem ) {
                this.#onIntersectionReset( item );
            }
        });
    } */

    /* #onIntersection(){

        if( this.lastIntersectedItem.completed ){
            return;
        }

        //adjust padding to show space for dragged item with margin
        const height = this.draggingItem.getHeight();

        //apply padding based on drag direction
        if( this.delta < 0 ) {
            this.lastIntersectedItem.entry.style.paddingTop = `${height}px`;
            this.lastIntersectedItem.entry.style.paddingBottom = 0;
        } else {
            this.lastIntersectedItem.entry.style.paddingTop = 0;
            this.lastIntersectedItem.entry.style.paddingBottom = `${height}px`;
        }
    } */

    /* //called to reset visual state of item after intersection
    #onIntersectionReset( item ){

        if( !item )
            return;

        item.entry.style.paddingTop = `0px`;
        item.entry.style.paddingBottom = `0px`;
    } */

    #completeCallback(){
        
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
                
                completedCount++;

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
        });

        if( completedCount > 0 ) {
            this.el.insertBefore( this.completedContainer, this.notCompletedContainer.nextSibling );
        } else {
            console.log('revove completed container');  
            this.completedContainer.remove();
        }

    }
}