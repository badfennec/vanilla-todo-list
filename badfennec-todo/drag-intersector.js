export default class DragIntersector {

    placeholder = null;
    isOverWindow = false;
    lastIntersectedItem = null;
    
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

        if( this.isOverWindow ) {
            return;
        }

        //current dragged item
        const { entry } = this.ToDo.draggingItem;

        //get bounding rect of dragged item once
        const entryRect = entry.getBoundingClientRect();

        //middle Y of dragged item
        const entryMiddleY = this.ToDo.dragY + ( entryRect.height / 2 );

        const lastIntersectedItem = this.ToDo.items.find( item => {

            //skip self or completed items
            if( item === this.ToDo.draggingItem || item.completed ) {
                return false;
            }

            //check if item intersects with dragged item
            return item.entry.getBoundingClientRect().top < entryRect.bottom &&
                item.entry.getBoundingClientRect().bottom > entryMiddleY;
        });

        //manage intersection visual feedback
        if( lastIntersectedItem ) {

            this.lastIntersectedItem = lastIntersectedItem;

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

        if( !this.lastIntersectedItem || this.lastIntersectedItem.spaceAvailable ){
            return;
        }

        delta = delta || this.ToDo.delta;

        //adjust padding to show space for dragged item with margin
        const height = this.ToDo.draggingItem.getFullHeight();
        const position = delta < 0 ? 'top' : 'bottom';
        this.lastIntersectedItem.setSpaceAvailable({position, height});
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

        const containerRect = this.ToDo.notCompletedContainer.getBoundingClientRect();

        const overTop = this.ToDo.dragY < containerRect.top - this.ToDo.draggingItem.getHeight();

        if( overTop ){
            return -1;
        }

        const overBottom = this.ToDo.dragY > containerRect.bottom - this.ToDo.draggingItem.getHeight();

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

    afterDrag( finalY ) {

        //remove also margin placeholder
        this.removePlaceholder();

        //calculate difference between startY and finalY
        const diff = Math.abs( finalY - this.ToDo.draggingItem.startY );

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

}