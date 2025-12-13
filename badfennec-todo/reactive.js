export default class Reactive {
    value = null;
    subscribers = [];

    constructor( initialValue) {
        this.value = initialValue;
    }

    subscribe( fn ){
        this.subscribers.push( fn );
        fn( this.value );
    }

    next( newValue ){
        this.value = {  ...this.value, ...newValue };
        this.notify();
    }

    notify(){
        this.subscribers.forEach( fn => fn( this.value ) );
    }
}