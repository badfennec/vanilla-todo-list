export default class DragPhysics {

    isDragging = false;

    // Initial difference between mouse Y and element top
    startYDiff = 0;

    startY = 0;
    currentY = 0;

    constructor({ element, item, grabber, container, onStart, onMove, onEnd }) {

        this.element = element;
        this.item = item;
        this.grabber = grabber || element;
        this.container = container;

        this.onStartCallback = onStart;
        this.onMoveCallback = onMove;
        this.onEndCallback = onEnd;

        this.startHandler = this.#start.bind(this);
        this.moveHandler = this.#move.bind(this);
        this.endHandler = this.#end.bind(this);

        this.#init();
    }

    #init(){
        this.grabber.addEventListener('mousedown', this.startHandler);
        this.grabber.addEventListener('touchstart', this.startHandler, { passive: false });
    }

    #getY(e) {
        const y = e.clientY || (e.touches && e.touches[0].clientY);
        return y || 1;
    }

    /**
     * Handle start of dragging
     * @param {*} e 
     */
    #start(e){

        //ignore if item is completed
        if( this.item.completed ){
            return;
        }

        // Prevent default behavior for touch events
        if (e.type === 'touchstart'){ 
            e.preventDefault();
        }

        this.isDragging = true;
        this.startY = this.#getY(e);
        this.currentY = this.startY;

        // Initial Y position inside the container
        this.startYDiff = this.startY - this.element.getBoundingClientRect().top;        

        if (this.onStartCallback){ 
            this.onStartCallback();        
        }

        window.addEventListener('mousemove', this.moveHandler);
        window.addEventListener('touchmove', this.moveHandler, { passive: false });
        window.addEventListener('mouseup', this.endHandler);
        window.addEventListener('touchend', this.endHandler);
    }

    /**
     * Handle dragging movement
     * @param {*} e 
     * @returns 
     */
    #move(e) {
        if (!this.isDragging) 
            return;

        if (e.cancelable) 
            e.preventDefault();

        this.currentY = this.#getY(e);
        const deltaY = this.currentY - this.startYDiff;
        
        // Update visual position
        this.element.style.transform = `translate3d(0, ${-(this.startY - this.currentY)}px, 0)`;
        
        if (this.onMoveCallback){ 
            this.onMoveCallback(e, this.currentY);
        }
    }

    /**
     * Handle end of dragging
     */
    #end(e) {
        this.isDragging = false;
        
        // Remove event listeners
        window.removeEventListener('mousemove', this.moveHandler);
        window.removeEventListener('touchmove', this.moveHandler);
        window.removeEventListener('mouseup', this.endHandler);
        window.removeEventListener('touchend', this.endHandler);

        // Notify end of dragging
        if (this.onEndCallback){ 
            const itemFinalY = this.currentY - this.startYDiff;
            this.onEndCallback( itemFinalY );
        }

        this.startYDiff = 0;
    }
}