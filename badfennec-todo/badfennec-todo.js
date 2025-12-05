
import Reactive from './reactive.js'; 
import TodoItem from './todo-item.js';
import Sorting from './sort.js';
import DragIntersector from './drag-intersector.js';
import Events from './events.js';

import './badfennec-todo.css';

export default class BadFennecTodo {

    count = 0;
    rect = null;

    items = [];

    delta = 0;
    dragY = 0;

    draggingItem = null;
    draggingItemOriginY = 0;

    reactive = null;
    reactiveSubscriber = null;

    dragIntersector = null;

    notCompletedContainer = null;
    completedContainer = null;

    events = new Events();        

    constructor({ el, items = [] }) {
        
        if(!el) {
            throw new Error('Element not provided for Todo app');
        }

        if( typeof el === 'string') {            
            this.el = document.querySelector(el);
        } else {
            this.el = el;
        }

        this.#setup(items);
    }

    #setup(items) {

        this.el.classList.add('badfennec-todo');

        this.#addContainers();

        items.forEach(item => {
            this.items.push(this.#addItem(item));
        });

        this.#addIntersector();
        this.#addReactivity();
        this.#completedHandler();
    }

    #addReactivity(){
        this.reactive = new Reactive({
            dragY: this.dragY,
            items: this.items,
        });

        const subscribeCallback = ( value ) => {

            const { dragY, items } = value;

            this.#onDeltaChange( dragY );          

            if( !this.draggingItem ) {

                if( this.items !== items ) {
                    this.items = items;
                    this.events.update( [...this.items] );
                    this.#completedHandler();
                }
            } 
		}

        this.reactive.subscribe( subscribeCallback );
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
            onUpdate: ( item ) => {
                this.#onItemUpdate( item );
            },
            onDelete: ( item ) => {
                this.#onDelete(item);
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
        this.events.add(event, callback);
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
            dragY: deltaY
        });
    }

    #onDragEnd( finalY ) {
        const sorting = new Sorting({ ToDo: this });

        const insert = this.dragIntersector.afterDrag( finalY );

        if( insert ){
            sorting.startResort();
        }
        
        this.draggingItem = null;
        this.dragY = 0;
        this.delta = 0;

        if( sorting.hasSorted ){
            this.reactive.next({
                items: [...sorting.items],
            });
        }
    }

    #onDeltaChange( dragY ){
        if( dragY === this.dragY ){
            return;
        }

        this.delta = this.dragY - dragY > 0 ? -1 : 1;
        this.dragY = dragY;
        this.dragIntersector.checkIntersections();
    }

    #onDelete( item ){
        const items = this.items.filter( i => i !== item );

        this.reactive.next({
            items: items
        });

        this.events.delete( { item: {...item}, items: [...items] } );
    }

    #onItemUpdate( item ){        
        this.reactive.next({
            items: [...this.items]
        });

        this.events.toggle( { item: {...item}, items: [...this.items] } );
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
            this.completedContainer.remove();
        }

    }
}