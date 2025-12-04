export default class DragIntersector {

    isOverWindow = false;
    
    constructor( ToDo ) {
        this.ToDo = ToDo;
    }

    checkIntersections(){

        if( !this.ToDo.draggingItem ) {     
            return;
        }

        const isOverWindow = this.checkOverWindow();

        if( isOverWindow ) {
            this.setOverWindow( isOverWindow );
        } else {
            this.resetOverWindow();
        }

        /* if( !this.isOverWindow ) {
            this.setOverWindow( isOverWindow );
        } else {
            this.resetOverWindow();
        } */

        //current dragged item
        const { entry } = this.ToDo.draggingItem;

        //get bounding rect of dragged item once
        const entryRect = entry.getBoundingClientRect();

        //calculate middle Y of dragged item for intersection check
        const entryMiddleY = entryRect.top + entryRect.height / 2;

        this.ToDo.lastIntersectedItem = this.ToDo.items.find( item => {

            //skip self
            if( item === this.ToDo.draggingItem || item.completed ) {
                return false;
            }

            //check if item intersects with dragged item
            return item.entry.getBoundingClientRect().top < entryRect.bottom &&
                item.entry.getBoundingClientRect().bottom > entryMiddleY;
        });

        //manage intersection visual feedback
        if( this.ToDo.lastIntersectedItem ) {
            this.resetPlaceholder();
            this.onIntersection();
        }

        //reset others items
        this.ToDo.items.forEach( item => {
            if( item !== this.ToDo.lastIntersectedItem || item === this.ToDo.draggingItem ) {
                this.onIntersectionReset( item );
            }
        });
    }

    onIntersection(){

        //adjust padding to show space for dragged item with margin
        const height = this.ToDo.draggingItem.getFullHeight();

        //apply padding based on drag direction
        if( this.ToDo.delta < 0 ) {
            this.ToDo.lastIntersectedItem.entry.style.paddingTop = `${height}px`;
            this.ToDo.lastIntersectedItem.entry.style.paddingBottom = 0;
        } else {
            this.ToDo.lastIntersectedItem.entry.style.paddingTop = 0;
            this.ToDo.lastIntersectedItem.entry.style.paddingBottom = `${height}px`;
        }
    }

    //called to reset visual state of item after intersection
    onIntersectionReset( item ){

        if( !item )
            return;

        item.entry.style.paddingTop = `0px`;
        item.entry.style.paddingBottom = `0px`;
    }

    /**
     * Add a placeholder element at the original position of the dragged item
     * to prevent the list from collapsing during drag.
     * @param {*} param0 
     */
    addPlaceholder({ element, insertMode = 'before' }){

        //only add placeholder if the element is in the not completed container
        if( element.parentNode !== this.ToDo.notCompletedContainer ){
            return;
        }

        //remove existing placeholder
        if( this.ToDo.placeholder ) {
            this.ToDo.placeholder.remove();
            this.resetPlaceholder();
        }

        //create placeholder if not existing only once
        if( !this.ToDo.placeholder ){
            this.ToDo.placeholder = document.createElement('div');
            this.ToDo.placeholder.className = 'badfennec-todo__item badfennec-todo__item--placeholder';
        }

        //set height of placeholder to match dragged item height
        this.ToDo.placeholder.style.paddingTop = `${this.ToDo.draggingItem.getFullHeight()}px`;

        //insert placeholder before or after the element based on insertMode
        if( insertMode === 'before' ){
            this.ToDo.notCompletedContainer.insertBefore( this.ToDo.placeholder, element );
        } else {
            this.ToDo.notCompletedContainer.insertBefore( this.ToDo.placeholder, element.nextSibling );
        }
    }

    resetPlaceholder(){
        if( this.ToDo.placeholder ) {
            this.ToDo.placeholder.style.paddingTop = `0px`;
        }
    }

    checkOverWindow(){

        const containerRect = this.ToDo.notCompletedContainer.getBoundingClientRect();

        const overTop = this.ToDo.dragY < containerRect.top;

        if( overTop ){
            return -1;
        }

        const overBottom = this.ToDo.dragY > containerRect.top + containerRect.height;

        if( overBottom ){
            return 1;
        }
        
        return false;
    }

    setOverWindow( v ){

        if( this.isOverWindow ){                    
            return;            
        } else {
            console.log( 'setOverWindow', v ); 
            this.isOverWindow = v;

            let targetElement = null;

            if( v === -1 ) {
                targetElement = this.ToDo.items.find( item => !item.completed && item !== this.ToDo.draggingItem );                

                if( targetElement ) {
                    //this.addPlaceholder({ element: targetElement.entry, insertMode: 'before' });
                }
            } else if( v === 1 ) {
                targetElement = [...this.ToDo.items].reverse().find( item => !item.completed && item !== this.ToDo.draggingItem );                

                if( targetElement ) {
                    //this.addPlaceholder({ element: targetElement.entry, insertMode: 'after' });
                }
            }
        }
        

        return;

        let targetElement = null;

        if( v === -1 ) {
            targetElement = this.ToDo.notCompletedContainer.firstChild !== this.ToDo.draggingItem.entry ? this.ToDo.notCompletedContainer.firstChild : this.ToDo.notCompletedContainer.firstChild?.nextSibling;

            console.log( 'targetElement', targetElement );

            /* if( targetElement ) {
                this.addPlaceholder({ element: targetElement, insertMode: 'before' });
            } */
        } else if( v === 1 ) {
            //this.addPlaceholder({ element: this.ToDo.notCompletedContainer.lastChild, insertMode: 'after' });
        }
    }

    resetOverWindow(){

        if( !this.isOverWindow ){
            return;
        }

        this.isOverWindow = false;
    }

}