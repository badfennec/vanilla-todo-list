
import Reactive from './reactive.js'; 
import TodoItem from './todo-item.js';
import Sorting from './sort.js';
import DragIntersector from './drag-intersector.js';
import Events from './events.js';
import DOMHandler from './dom.js';

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

    #setup( items ) {

        this.el.classList.add('badfennec-todo');

        this.#addContainers();

        items.forEach(item => {
            this.items.push(this.#addItem(item));
        });

        this.#addIntersector();
        this.#completedHandler();
        this.#addReactivity();
    }

    #addReactivity(){
        this.reactive = new Reactive({
            event: null,
        });

        const eventsSubscribe = ( value ) => {

            const { event } = value;
            
            if( ['sort', 'delete', 'toggle'].includes( event ) ){
                this.events.update( [...this.items] );
            }
		}

        this.reactive.subscribe( eventsSubscribe );
    }

    #addIntersector(){
        this.dragIntersector = new DragIntersector(this);
    }

    #addItem( item ) {
        item = new TodoItem({ 
            ToDo: this, 
            item, 
            key: this.count,
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
                this.#onItemToggle( item );
            },
            onDelete: ( item ) => {
                this.#onDelete(item);
            }
        });

        this.count++;

        return item;
    }

    #addContainers(){
        const domHandler = new DOMHandler();
        this.notCompletedContainer = domHandler.addNotCompletedContainer(this.el);
        this.completedContainer = domHandler.addCompletedContainer(this.el);
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
        this.#onDeltaChange( deltaY );
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
            this.items = [...sorting.items];
            this.reactive.next({
                event: 'sort'
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
        this.items = this.items.filter( i => i !== item );
        this.events.delete( { item: {...item}, items: [...this.items] } );
        this.reactive.next({
            event: 'delete'
        });
    }

    #onItemToggle( item ){

        this.#completedHandler();
        this.events.toggle( { item: {...item}, items: [...this.items] } );
        this.reactive.next({
            event: 'toggle'
        });
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