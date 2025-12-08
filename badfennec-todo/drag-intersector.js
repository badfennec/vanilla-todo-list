export default class DragIntersector {

    placeholder = null;
    placeholderActive = false;

    isOverWindow = false;
    lastIntersectedItem = null;
    windowLimits = { top: 0, bottom: 0 };
    itemsRect = [];
    
    constructor( ToDo ) {
        this.ToDo = ToDo;
    }

    /**
     * Sets the rectangles of all items in the todo list, adjusting for the dragged item.
     * This avoids recalculating each item's rectangle individually during drag operations.
     */
    setItemsRect(){

        let items = [...this.ToDo.items].filter( item => !item.completed );

        this.itemsRect.splice(0, this.itemsRect.length);
        let offset = this.windowLimits.top;

        /* if( !this.ToDo.draggingItem ) {
            return;
        } */

        items.forEach( item => {

            //add placeholder height if needed
            if( item.key === this.ToDo.draggingItem.key ){
                if( this.placeholderActive ){
                    offset += this.ToDo.draggingItem.getFullHeight();
                }                
            } else {
                //Height of the dragged item
                const draggedItemHeight = this.ToDo.draggingItem.getHeight();
                const hasSpaceAvailable = item.spaceAvailable;

                //calculate item rect considering space available for dragged item
                const itemHeight = item.getHeight();
                const height = itemHeight;

                //top and bottom are only for the content, margin or padding is not included

                //calculate top position considering space available for dragged item
                const top = offset + ( ( hasSpaceAvailable === 'top' ) ? draggedItemHeight : 0 );

                //consider space available for dragged item
                const bottom = top + height;

                //update offset for next item
                offset = bottom + item.getGap() + ( ( hasSpaceAvailable === 'bottom' ) ? draggedItemHeight : 0 );

                this.itemsRect.push( {
                    key: item.key,
                    height: height,
                    top,
                    bottom,
                    entry: item.entry
                } );

            }

        });

        if( this.itemsRect.length > 0 ){
            //set bottom limit for window
            this.setWindowLimits({ top: this.windowLimits.top, bottom: offset });
        }
    }

    setWindowLimits( {top, bottom} = {} ){

        let containerRect = ( !top || !bottom ) ? this.ToDo.notCompletedContainer.getBoundingClientRect() : {};
        
        this.windowLimits.top = top || containerRect.top;
        this.windowLimits.bottom = bottom || containerRect.bottom;
    }

    checkIntersections(){

        if( !this.ToDo.draggingItem ) {     
            return;
        }

        this.setItemsRect();

        const isOverWindow = this.checkOverWindow();

        if( isOverWindow ) {
            this.setOverWindow( isOverWindow );
        } else {
            this.resetOverWindow();
        }

        if( this.isOverWindow ) {
            return;
        }

        const lastIntersectedItem = this.itemsRect.find( item => {
            //check if item intersects with dragged item
            return this.ToDo.dragY > item.top && this.ToDo.dragY < item.bottom; //entryMiddleY;
        });

        //manage intersection visual feedback
        if( lastIntersectedItem ){

            this.lastIntersectedItem = this.ToDo.items.find( item => item.key === lastIntersectedItem.key );

            if( !this.lastIntersectedItem ){
                return;
            }

            //reset placeholder first to avoid doble padding
            this.resetPlaceholder();
            this.setItemsRect();
            this.onIntersection();
            //this.setItemsRect();
        } else {
            return;
        }

        //reset others items
        this.ToDo.items.forEach( item => {
            if( item !== this.lastIntersectedItem ) {
                this.onIntersectionReset( item );
            }
        });
    }

    onIntersection( delta ){

        if( !this.lastIntersectedItem ){
            return;
        }

        delta = delta || this.ToDo.delta;

        //handle the return from over window
        if( this.lastIntersectedItem.spaceAvailable ){

            if( (this.lastIntersectedItem.spaceAvailable === 'top' && delta > 0) && ( this.ToDo.dragY < this.lastIntersectedItem.rect.top ) ){
                return
            }
            
            if( (this.lastIntersectedItem.spaceAvailable === 'bottom' && delta < 0 ) && ( this.ToDo.dragY > this.lastIntersectedItem.rect.bottom ) ){
                return
            } 
        }

        //adjust padding to show space for dragged item with margin
        const height = this.ToDo.draggingItem.getFullHeight();
        const position = delta < 0 ? 'top' : 'bottom';

        if( this.lastIntersectedItem.spaceAvailable !== position ){
            this.lastIntersectedItem.setSpaceAvailable({position, height});
        } 
        
        this.ToDo.items.forEach( item => {
            if( item !== this.lastIntersectedItem ) {
                this.onIntersectionReset( item );
            }
        });
        //this.setItemsRect();
    }

    //called to reset visual state of item after intersection
    onIntersectionReset( item ){

        if( !item )
            return;

        item.resetSpaceAvailable();
        //this.setItemsRect();
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
        this.removePlaceholder();

        //create placeholder if not existing only once
        if( !this.placeholder ){
            this.placeholder = document.createElement('div');
            this.placeholder.className = 'badfennec-todo__item badfennec-todo__item--placeholder';
        }

        //set height of placeholder to match dragged item height
        this.placeholder.style.paddingTop = `${this.ToDo.draggingItem.getFullHeight()}px`;

        //insert placeholder before or after the element based on insertMode
        if( insertMode === 'before' ){
            this.ToDo.notCompletedContainer.insertBefore( this.placeholder, element );
        } else {
            this.ToDo.notCompletedContainer.insertBefore( this.placeholder, element.nextSibling );
        }

        this.placeholderActive = true;
    }

    resetPlaceholder(){
        this.placeholderActive = false;
        if( this.placeholder ) {
            this.placeholder.style.paddingTop = `0px`;
        }
    }

    removePlaceholder(){
        if( this.placeholder ){
            this.placeholder.remove();
            this.resetPlaceholder();
        }
    }

    checkOverWindow(){
        const overTop = this.ToDo.dragY < this.windowLimits.top;

        if( overTop ){
            return -1;
        }

        const overBottom = this.ToDo.dragY > this.windowLimits.bottom;

        if( overBottom ){
            return 1;
        }
        
        return false;
    }

    setOverWindow( v ){

        if( this.isOverWindow ){                    
            return;            
        } else {
            this.isOverWindow = v;

            let targetElement = null;

            if( v === -1 ) {
                targetElement = this.ToDo.items.find( item => !item.completed && item !== this.ToDo.draggingItem );
            } else if( v === 1 ) {
                targetElement = [...this.ToDo.items].reverse().find( item => !item.completed && item !== this.ToDo.draggingItem );
            }

            if( targetElement ) {
                this.lastIntersectedItem = targetElement;

                //reset placeholder first to avoid doble padding
                this.resetPlaceholder();

                //apply intersection effect to target element
                this.onIntersection( v );
            }
        }
        

        return;
    }

    resetOverWindow(){

        if( !this.isOverWindow ){
            return;
        }

        this.isOverWindow = false;
    }

    afterDrag( itemFinalY ) {

        console.log(this.itemsRect);

        //remove also margin placeholder
        this.removePlaceholder();

        //calculate difference between startY and finalY
        const diff = Math.abs( itemFinalY - this.ToDo.draggingItem.startY );

        //if difference is significant, perform sort
        if( diff > 0 && this.lastIntersectedItem && !this.lastIntersectedItem.completed ) {

            if( this.lastIntersectedItem.spaceAvailable === 'top' ) {
                this.ToDo.notCompletedContainer.insertBefore( this.ToDo.draggingItem.entry, this.lastIntersectedItem.entry );
            } else {
                this.ToDo.notCompletedContainer.insertBefore( this.ToDo.draggingItem.entry, this.lastIntersectedItem.entry.nextSibling );
            }

            this.ToDo.items.forEach( item => {
                item.resetSpaceAvailable();
            });

            return true;
        }

        this.ToDo.items.forEach( item => {
            item.resetSpaceAvailable();
        });

        return false;
    }

    dragStart(){
        this.setWindowLimits();
        this.addPlaceholder({ element: this.ToDo.draggingItem.entry });
        this.setItemsRect();
    }

}