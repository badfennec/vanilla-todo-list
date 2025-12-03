export default class Sorting {

    //indicates if a sort operation  took place
    hasSorted = false;

    constructor({ ToDo }) {
        this.ToDo = ToDo;
        this.item = this.ToDo.draggingItem;
    }

    afterDrag( finalY ) {
        //calculate the difference between the finalY and the item's startY
        const diff = Math.abs( finalY - this.item.startY );

        //if the diffeence is maior tha
        if( diff > 0 && this.ToDo.placeholder && this.ToDo.placeholder.parentNode && this.ToDo.placeholder.getBoundingClientRect().top !== this.item.startY ) {

            //replace placeholder with the dragged item
            this.#raplacePlaceholder();
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

    #raplacePlaceholder(){
        this.ToDo.placeholder.replaceWith(this.item.entry);
    }

    #resetOffsets(){
        this.ToDo.items.forEach( item => {
            item.setStartY();
        });
    }

    #sortItems(){
        this.ToDo.items.sort( (a, b) => {
            return a.startY - b.startY;
        } );
    }
}