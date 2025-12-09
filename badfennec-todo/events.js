export default class Events {
    callbacks = {
        input: null,
        update: null,
        toggle: null,
        delete: null,
    };

    getPublicItem( todoItem ){

        const itemID = todoItem.id || todoItem.ID || todoItem.key;

        return {
            id: itemID,
            ID: itemID,
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

    input( {item} ){
        if( !this.callbacks.input )
            return;

        this.callbacks.input({ item: this.getPublicItem( item ) });
    }

    toggle( {item, items} ){
        if( !this.callbacks.toggle )
            return;

        const parsedItems = items.map( todoItem => this.getPublicItem( todoItem ) );

        this.callbacks.toggle({ item: this.getPublicItem( item ), items: parsedItems });
    }

    delete( {item, items} ){
        if( !this.callbacks.delete )
            return;

        const parsedItems = items.map( todoItem => this.getPublicItem( todoItem ) );

        this.callbacks.delete({ item: this.getPublicItem( item ), items: parsedItems });
    }
}