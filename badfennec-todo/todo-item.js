import DragEvents from "./drag-events";
import Reactive from "./reactive";

export default class TodoItem {

    completed = false;
    key = null;
    index = null;

    entry = null;
    container = null;
    grabber = null;
    checkbox = null;
    entryText = null;

    height = 0;
    fullHeight = 0;
    marginBottom = 0;

    startY = 0;    

    checkedIcon = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M18 3C18 2.44772 17.5523 2 17 2H3C2.44772 2 2 2.44772 2 3V17C2 17.5523 2.44772 18 3 18H17C17.5523 18 18 17.5523 18 17V3ZM20 17C20 18.6569 18.6569 20 17 20H3C1.34315 20 0 18.6569 0 17V3C0 1.34315 1.34315 0 3 0H17C18.6569 0 20 1.34315 20 3V17Z" fill="black"/><path fill="currentColor" d="M12.2929 7.29289C12.6834 6.90237 13.3164 6.90237 13.707 7.29289C14.0975 7.68342 14.0975 8.31643 13.707 8.70696L9.70696 12.707C9.31643 13.0975 8.68342 13.0975 8.29289 12.707L6.29289 10.707C5.90237 10.3164 5.90237 9.68342 6.29289 9.29289C6.68342 8.90237 7.31643 8.90237 7.70696 9.29289L8.99992 10.5859L12.2929 7.29289Z" fill="black"/></svg>';
    uncheckedIcon = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M18 3C18 2.44772 17.5523 2 17 2H3C2.44772 2 2 2.44772 2 3V17C2 17.5523 2.44772 18 3 18H17C17.5523 18 18 17.5523 18 17V3ZM20 17C20 18.6569 18.6569 20 17 20H3C1.34315 20 0 18.6569 0 17V3C0 1.34315 1.34315 0 3 0H17C18.6569 0 20 1.34315 20 3V17Z" fill="black"/></svg>';
    grabIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 5C10 3.89543 10.8954 3 12 3C13.1046 3 14 3.89543 14 5C14 6.10457 13.1046 7 12 7C10.8954 7 10 6.10457 10 5Z" fill="currentColor"/><path d="M17 5C17 3.89543 17.8954 3 19 3C20.1046 3 21 3.89543 21 5C21 6.10457 20.1046 7 19 7C17.8954 7 17 6.10457 17 5Z" fill="currentColor"/><path d="M3 5C3 3.89543 3.89543 3 5 3C6.10457 3 7 3.89543 7 5C7 6.10457 6.10457 7 5 7C3.89543 7 3 6.10457 3 5Z" fill="currentColor"/><path d="M10 12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12Z" fill="currentColor"/><path d="M17 12C17 10.8954 17.8954 10 19 10C20.1046 10 21 10.8954 21 12C21 13.1046 20.1046 14 19 14C17.8954 14 17 13.1046 17 12Z" fill="currentColor"/><path d="M3 12C3 10.8954 3.89543 10 5 10C6.10457 10 7 10.8954 7 12C7 13.1046 6.10457 14 5 14C3.89543 14 3 13.1046 3 12Z" fill="currentColor"/><path d="M10 19C10 17.8954 10.8954 17 12 17C13.1046 17 14 17.8954 14 19C14 20.1046 13.1046 21 12 21C10.8954 21 10 20.1046 10 19Z" fill="currentColor"/><path d="M17 19C17 17.8954 17.8954 17 19 17C20.1046 17 21 17.8954 21 19C21 20.1046 20.1046 21 19 21C17.8954 21 17 20.1046 17 19Z" fill="currentColor"/><path d="M3 19C3 17.8954 3.89543 17 5 17C6.10457 17 7 17.8954 7 19C7 20.1046 6.10457 21 5 21C3.89543 21 3 20.1046 3 19Z" fill="currentColor"/></svg>';

    constructor( args ) {
        const { ToDo, item, count, onDragStart, onDragMove, onDragEnd, onComplete } = args;
        this.ToDo = ToDo;
        this.item = item;

        this.grabIcon = args.grabIcon || this.grabIcon;
        this.checkedIcon = args.checkedIcon || this.checkedIcon;
        this.uncheckedIcon = args.uncheckedIcon || this.uncheckedIcon;

        this.onComplete = onComplete;

        this.#setup( this.item, count );

        new DragEvents({ ToDo: this.ToDo, item: this, onDragStartCallback: onDragStart, onDragMoveCallback: onDragMove, onDragEndCallback: onDragEnd });
    }

    #setup( item, count ){
        this.key = count;
        this.entry = document.createElement('div');
        this.entry.className = 'badfennec-todo__item';
        this.completed = item.completed || false;
        this.text = item.text || '';

        this.container = document.createElement('div');
        this.container.className = 'badfennec-todo__item-container';
        this.entry.appendChild(this.container);

        this.#addItemGrabber();        

        this.#addItemCheckbox();

        this.#addItemText();
        this.ToDo.notCompletedContainer.appendChild( this.entry );
        this.setHeight();

        this.setStartY();
        this.#addReactive();
        
    }

    #addReactive(){
        this.reactive = new Reactive({
            completed: this.completed,
            text: this.text
        }); 

        const reactivateSubscription = () => {
            this.#onCompleteChange();
        }

        this.reactive.subscribe( reactivateSubscription );
    }

    setIndex( index ){
        this.index = index;
    }

    setStartY(){
        this.startY = this.entry.getBoundingClientRect().top;
    }

    setHeight(){
        this.marginBottom = parseFloat(window.getComputedStyle(this.entry).marginBottom);
        this.height = this.container.getBoundingClientRect().height ;
        this.fullHeight = this.height + this.marginBottom;
    }

    getMarginBottom(){
        return this.marginBottom;
    }

    getHeight(){
        return this.height;
    }

    getFullHeight(){
        return this.fullHeight;
    }

    #addItemGrabber(){
        const container = document.createElement('div');
        this.grabber = document.createElement('div');
        this.grabber.classList.add('badfennec-todo__grabber');
        this.grabber.classList.add('badfennec-todo__shape');
        this.grabber.innerHTML = this.grabIcon;
        container.appendChild(this.grabber);
        this.container.appendChild(container);

        this.grabber.addEventListener('mouseover', () => {
            if( this.ToDo.draggingItem || this.completed ) 
                return;

            this.ToDo.el.style.cursor = 'grab';
        })
        this.grabber.addEventListener('mouseout', () => {
            if( this.ToDo.draggingItem ) 
                return;
            this.ToDo.el.style.cursor = '';
        });
    }

    #addItemCheckbox(){

        const button = document.createElement('div');
        this.checkbox = document.createElement('div');
        this.checkbox.classList.add('badfennec-todo__checkbox');
        this.checkbox.classList.add('badfennec-todo__shape');
        this.checkbox.innerHTML = this.completed ? this.checkedIcon : this.uncheckedIcon;
        button.appendChild(this.checkbox);
        this.container.appendChild(button);

        this.checkbox.addEventListener('click', () => {
            this.completed = !this.completed;
            this.reactive.next({ 
                completed: this.completed 
            });

            this.onComplete( this );
        });
    }

    #addItemText(){
        this.entryText = document.createElement('div');
        this.entryText.className = 'badfennec-todo__text';
        this.container.appendChild(this.entryText);
        const textNode = document.createTextNode(this.text);
        this.entryText.appendChild(textNode);
    }

    #onCompleteChange(){
        this.checkbox.innerHTML = this.completed ? this.checkedIcon : this.uncheckedIcon;
        this.entry.classList.toggle('badfennec-todo__item--completed', this.completed);
    }

}