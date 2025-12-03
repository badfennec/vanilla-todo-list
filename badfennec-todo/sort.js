export default class Sorting {

    constructor({ ToDo, finalY }) {

        this.ToDo = ToDo;
        this.item = this.ToDo.draggingItem;
        this.#watchDrag( finalY );
        

    }

    #watchDrag( finalY ) {
        const diff = Math.abs( finalY - this.item.startY );

        if( diff > 0 && this.ToDo.placeholder && this.ToDo.placeholder.parentNode && this.ToDo.placeholder.getBoundingClientRect().top !== this.item.startY ) {

            this.#startResort();

            return;
        }

        console.log('No sorting needed');
    }

    #startResort(){
        
        //replace placeholder with the dragged item
        this.#raplacePlaceholder();

        //reset offsets for all items
        this.#resetOffsets();

        //sort items array based on startY positions
        this.#sortItems();
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