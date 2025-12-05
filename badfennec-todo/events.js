export default class Events {
    callbacks = {
        update: null,
        delete: null
    };

    getPublicItem( todoItem ){
        return {
            text: todoItem.text,
            completed: todoItem.completed
        }
    }

    add( event, callback ) {
        
        if( event in this.callbacks ) {
            this.callbacks[event] = callback;
        } else {
            console.warn(`Event "${event}" is not supported.`);
        }
    }

    update( todoItems ){
        if( !this.callbacks.update )
            return;

        const items = [];

        todoItems.forEach( item => {
            items.push( this.getPublicItem( item ) );
        } );

        this.callbacks.update({ items });
    }

    delete( todoItem ){
        if( !this.callbacks.delete )
            return;

        this.callbacks.delete( this.getPublicItem( todoItem ) );
    }
}