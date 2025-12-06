import DragEvents from "./drag-events";
import Reactive from "./reactive";
import { CheckedIcon, UncheckedIcon, DeleteIcon, GrabIcon } from "./icons";

export default class TodoItem {

    completed = false;
    key = null;
    index = null;

    entry = null;
    container = null;
    checkbox = null;
    entryText = null;
    deleteBtn = null;

    height = 0;
    fullHeight = 0;
    marginBottom = 0;

    startY = 0; 
    rect = {
        top: 0,
        bottom: 0,
        height: 0,
        middleHeight: 0
    }  
    
    spaceAvailable = null;
    spaceAvailableHeight = 0;
    
    checkedIcon = null;
    uncheckedIcon = null
    grabIcon = null;
    deleteIcon = null;

    constructor( args ) {
        const { ToDo, item, key, onDragStart, onDragMove, onDragEnd, onUpdate, onDelete } = args;
        this.ToDo = ToDo;
        this.item = item;

        this.grabIcon = args.grabIcon || GrabIcon;
        this.checkedIcon = args.checkedIcon || CheckedIcon;
        this.uncheckedIcon = args.uncheckedIcon || UncheckedIcon;
        this.deleteIcon = args.deleteIcon || DeleteIcon;

        this.onUpdate = onUpdate;
        this.onDelete = onDelete;

        this.#setup( this.item, key );

        new DragEvents({ ToDo: this.ToDo, item: this, onDragStartCallback: onDragStart, onDragMoveCallback: onDragMove, onDragEndCallback: onDragEnd });
    }

    #setup( item, key ){
        this.key = key;
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
        this.#addItemDelete();

        if( !this.completed ){
            this.ToDo.notCompletedContainer.appendChild( this.entry );
        } else {
            this.ToDo.completedContainer.appendChild( this.entry );
        }
        

        this.setRect();
        this.setStartY( this.rect.top );
        this.setHeight( this.rect.height );
        
        this.#addReactive();
        
    }

    #addReactive(){
        this.reactive = new Reactive({
            completed: this.completed,
            text: this.text
        }); 

        const reactivateSubscription = () => {
            this.#onUpdateChange();
        }

        this.reactive.subscribe( reactivateSubscription );
    }

    setIndex( index ){
        this.index = index;
    }

    setStartY( top ){
        this.startY = top || this.entry.getBoundingClientRect().top;

        if( !top )
            console.log('getBoundingClientRect() called');
    }

    setRect(){
        console.log('getBoundingClientRect() called');
        const rect = this.container.getBoundingClientRect();
        this.rect.top = rect.top;
        this.rect.bottom = rect.bottom;
        this.rect.height = rect.height;
        this.rect.middleHeight = rect.height / 2;
    }

    setHeight( height ){
        this.marginBottom = parseFloat(window.getComputedStyle(this.entry).marginBottom);
        this.height = height || this.container.getBoundingClientRect().height ;
        this.fullHeight = this.height + this.marginBottom;

        if( !height )
            console.log('getBoundingClientRect() called');
    }

    setSpaceAvailable({position, height}){
        this.spaceAvailable = position;
        this.spaceAvailableHeight = height;

        if( position === 'top' ){
            this.entry.style.paddingTop = `${height}px`;
            this.entry.style.paddingBottom = `0px`;
        } else {
            this.entry.style.paddingTop = `0px`;
            this.entry.style.paddingBottom = `${height}px`;
        }
    }

    resetSpaceAvailable(){
        this.spaceAvailable = null;
        this.entry.style.paddingTop = `0px`;
        this.entry.style.paddingBottom = `0px`;
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

            this.onUpdate( this );
        });
    }

    #addItemText(){
        this.entryText = document.createElement('div');
        this.entryText.style.flexGrow = '1';
        this.entryText.className = 'badfennec-todo__text';
        this.container.appendChild(this.entryText);
        const textNode = document.createTextNode(this.text);
        this.entryText.appendChild(textNode);
    }

    #addItemDelete(){
        const button = document.createElement('div');
        const deleteBtn = document.createElement('div');
        deleteBtn.classList.add('badfennec-todo__delete');
        deleteBtn.classList.add('badfennec-todo__shape');
        deleteBtn.innerHTML = this.deleteIcon;
        button.appendChild(deleteBtn);
        this.container.appendChild(button);

        deleteBtn.addEventListener('click', () => {
            //remove all event listeners to avoid memory leaks
            this.entry.remove();
            this.onDelete( this );
        });
    }

    #onUpdateChange(){
        this.checkbox.innerHTML = this.completed ? this.checkedIcon : this.uncheckedIcon;
        this.entry.classList.toggle('badfennec-todo__item--completed', this.completed );
    }

}