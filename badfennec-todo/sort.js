export default class Sorting {

    //indicates if a sort operation  took place
    hasSorted = false;

    constructor({ ToDo }) {
        this.ToDo = ToDo;
        this.item = this.ToDo.draggingItem;
    }

    afterDrag( finalY ) {
        //if there is a placeholder and its position has changed
        if( this.ToDo.placeholder && this.ToDo.placeholder.parentNode && this.ToDo.placeholder.getBoundingClientRect().top !== this.item.startY ) {

            //replace placeholder with the dragged item
            this.#replacePlaceholder();
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

    #replacePlaceholder(){
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