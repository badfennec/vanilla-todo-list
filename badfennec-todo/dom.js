import { addIcon } from "./icons";

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

    addNewItemBox({ parent, icon, placeholder, addCallback }){

        const addNewItemBox = document.createElement('div');        
        addNewItemBox.className = 'badfennec-todo__add-new-item-box';

        const container = document.createElement('div');
        container.className = 'badfennec-todo__add-new-item-container';
        addNewItemBox.appendChild(container);
        
        const iconContainer = document.createElement('div');
        container.appendChild(iconContainer);

        const button = document.createElement('div');
        button.className = 'badfennec-todo__shape';
        button.innerHTML = icon || addIcon;
        button.style.cursor = 'pointer';
        iconContainer.appendChild(button);

        button.addEventListener('click', ( e ) => {
            e.preventDefault();
            addCallback();
        });

        const textNode = document.createTextNode(placeholder);
        container.appendChild(textNode);
        parent.appendChild( addNewItemBox );

        return addNewItemBox;
    }

}