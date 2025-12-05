export default class Sorting {

    //indicates if a sort operation  took place
    hasSorted = false;
    items = null;
    draggedItem = null;

    constructor({ ToDo }) {
        this.ToDo = ToDo;
        this.items = [...ToDo.items];
        this.draggedItem = {...ToDo.draggingItem};
    }

    startResort(){

        //reset offsets for all items
        this.#resetOffsets();

        //sort items array based on startY positions
        this.#sortItems();

        this.hasSorted = this.draggedItem.startY !== this.ToDo.draggingItem.startY;
    }

    #resetOffsets(){
        this.items.forEach( item => {
            item.setStartY();
        });
    }

    #sortItems(){
        this.items.sort( (a, b) => {
            return a.startY - b.startY;
        } );
    }
}