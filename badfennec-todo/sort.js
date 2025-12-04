export default class Sorting {

    //indicates if a sort operation  took place
    hasSorted = false;

    constructor({ ToDo }) {
        this.ToDo = ToDo;
        this.item = this.ToDo.draggingItem;
    }

    startResort(){
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
        this.ToDo.items.sort( (a, b) => {
            return a.startY - b.startY;
        } );
    }
}