export default class DragIntersector {

    placeholder = null;
    isOverWindow = false;
    lastIntersectedItem = null;
    windowLimits = { top: 0, bottom: 0 };
    itemsRect = [];
    
    constructor( ToDo ) {
        this.ToDo = ToDo;

        this.setWindowLimits(); 
        this.setItemsRect();
    }

    setItemsRect(){

        this.itemsRect.splice(0, this.itemsRect.length);
        let count = 0;
        let offset = this.windowLimits.top;

        if( !this.ToDo.draggingItem ) {
            return;
        }
        
        const draggedItemHeight = this.ToDo.draggingItem.getHeight();

        this.ToDo.items.forEach( item => {
            if( !item.completed && item != this.ToDo.draggingItem ){
                count++;
                const height = item.getHeight();
                const top = offset;
                const bottom = offset + height;
                offset += height;

                this.itemsRect.push( {
                    key: item.key,
                    height: height,
                    top,
                    bottom
                } );
                
            }
        });

        console.log( this.itemsRect );

        console.log('items rect set for ', count, ' items');
    }

    reset(){
        //this.setWindowLimits();
        //this.setItemsRect();
    }

    setWindowLimits(){
        console.log('setting window limits');
        const containerRect = this.ToDo.notCompletedContainer.getBoundingClientRect();
        this.windowLimits.top = containerRect.top;
        this.windowLimits.bottom = containerRect.bottom;
    }

    /* setItemsRect(){
        this.ToDo.items.forEach( item => {
            if( !item.completed && item != this.ToDo.draggingItem ){
                item.setRect();
            }
        });
    } */

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

        if( this.isOverWindow ) {
            return;
        }

        const lastIntersectedItem = this.itemsRect.find( item => {
            //check if item intersects with dragged item
            return this.ToDo.dragY > item.top && this.ToDo.dragY < item.bottom; //entryMiddleY;
        });

        //manage intersection visual feedback
        if( lastIntersectedItem ) {

            this.lastIntersectedItem = this.ToDo.items.find( item => item.key === lastIntersectedItem.key );

            if( !this.lastIntersectedItem ){
                return;
            }

            console.log( console.log('lastIntersectedItem:', this.lastIntersectedItem.entry ) );

            //reset placeholder first to avoid doble padding
            this.resetPlaceholder();
            this.onIntersection();
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

            console.log('has space available');
            //this.lastIntersectedItem.setStartY();
            
            /* if( (this.lastIntersectedItem.spaceAvailable === 'top' && delta > 0) &&
                ( this.ToDo.dragY < this.lastIntersectedItem.startY + this.lastIntersectedItem.spaceAvailableHeight / 2 ) ){
                    console.log('return from top');
                return
            }
            
            if( (this.lastIntersectedItem.spaceAvailable === 'bottom' && delta < 0) &&
                ( this.ToDo.dragY > this.lastIntersectedItem.startY + this.lastIntersectedItem.getHeight() / 2 ) ){
                    console.log('return from bottom');
                return
            } */

            if( (this.lastIntersectedItem.spaceAvailable === 'top' && delta > 0) && ( this.ToDo.dragY < this.lastIntersectedItem.rect.top ) ){
                    console.log('return from top');
                return
            }
            
            if( (this.lastIntersectedItem.spaceAvailable === 'bottom' && delta < 0 ) && ( this.ToDo.dragY > this.lastIntersectedItem.rect.bottom ) ){
                    console.log('return from bottom');
                return
            } 
        }

        //adjust padding to show space for dragged item with margin
        const height = this.ToDo.draggingItem.getFullHeight();
        const position = delta < 0 ? 'top' : 'bottom';

        if( this.lastIntersectedItem.spaceAvailable !== position ){
            this.lastIntersectedItem.setSpaceAvailable({position, height});
            //this.setItemsRect();
        }        
    }

    //called to reset visual state of item after intersection
    onIntersectionReset( item ){

        if( !item )
            return;

        item.resetSpaceAvailable();
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
    }

    resetPlaceholder(){
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
        const overTop = this.ToDo.dragY < this.windowLimits.top - this.ToDo.draggingItem.getHeight();

        if( overTop ){
            return -1;
        }

        const overBottom = this.ToDo.dragY > this.windowLimits.bottom - this.ToDo.draggingItem.getHeight();

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

            this.reset();

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

            this.onIntersectionReset( this.lastIntersectedItem );

            return true;
        }

        return false;
    }

    dragStart(){
        this.addPlaceholder({ element: this.ToDo.draggingItem.entry });
        this.setItemsRect();
    }

}