export default class Sorting {

    //indicates if a sort operation  took place
    hasSorted = false;

    constructor({ ToDo }) {
        this.ToDo = ToDo;
        this.item = this.ToDo.draggingItem;
    }

    afterDrag( finalY, isOverWindow ) {

        //calculate difference between startY and finalY
        const diff = Math.abs( finalY - this.item.startY );

        //if difference is significant, perform sort
        if( diff > 0 && ( isOverWindow !== false || this.ToDo.lastIntersectedItem && !this.ToDo.lastIntersectedItem.completed ) ) {

            if( isOverWindow ) {
                if( this.ToDo.delta < 0 ) {

                    const element = this.ToDo.items.find( item => !item.completed && item !== this.item );

                    if( element ) {
                        this.ToDo.notCompletedContainer.insertBefore( this.item.entry, element.entry );
                    }
                } else {
                    this.ToDo.notCompletedContainer.appendChild( this.item.entry );
                }
            } else {
                if( this.ToDo.delta < 0 ) {
                    this.ToDo.notCompletedContainer.insertBefore( this.item.entry, this.ToDo.lastIntersectedItem.entry );
                } else {
                    this.ToDo.notCompletedContainer.insertBefore( this.item.entry, this.ToDo.lastIntersectedItem.entry.nextSibling );
                }
            }

            this.#startResort();

            return;
        }

        this.hasSorted = false;
    }

    #startResort(){
        //reset offsets for all items
        this.#resetOffsets();

        //sort items array based on startY positions
        this.#sortItems();

        this.hasSorted = true;
    }

    #resetOffsets(){
        this.ToDo.items.forEach( item => {
            item.setStartY();
        });
    }

    #sortItems(){
        this.ToDo.items.sort( ( a, b ) => {
            return a.startY - b.startY;
        } );
    }
}