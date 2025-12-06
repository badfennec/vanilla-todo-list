export default class DOMHandler {
    
    addNotCompletedContainer( parent ){
        const notCompletedContainer = document.createElement('div');
        notCompletedContainer.className = 'badfennec-todo__not-completed-container';
        parent.appendChild( notCompletedContainer );

        return notCompletedContainer;
    }

    addCompletedContainer( parent ){
        const completedContainer = document.createElement('div');
        completedContainer.className = 'badfennec-todo__completed-container';
        parent.appendChild( completedContainer );

        return completedContainer;
    }

}