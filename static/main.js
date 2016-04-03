"use strict";



(function (){
    
    function arrayMove(arr, fromIndex, toIndex) {
        var element = arr[fromIndex];
        arr.splice(fromIndex, 1);
        arr.splice(toIndex, 0, element);
    }
    
    function getDomElementPosition (parent, element) {
        var Elements = parent.children;
        for (var i = 0; i < Elements.length; i++) {
            if (Elements[i] == element) {
                return i;
            }
        }
        return -1
    }
    
    var list = document.getElementById("list");
    var inputField = document.getElementById("dataInputField");
    var elements = [];
    var i = 1;
    
    
    function rebuildItemsList(){
        list.innerHTML = "";
        for (var i = 0; i < elements.length; i++) {
            var newNode = document.createElement("li");
            newNode.setAttribute("draggable",true);
            newNode.setAttribute("data-element-id", elements[i].id );
            newNode.appendChild(document.createTextNode(elements[i].text));
            console.log(elements);
            list.appendChild(newNode);
        }
    }
    
    function loadItemsFromServer() {
        return fetch("/items").then(
            function(responce) {
                responce.json().then(
                    function(jsonResponce) {
                        elements = jsonResponce.data;
                        rebuildItemsList();
                        i = elements.length + 1;
                    }
                )
            }
        )
    }
    
    //UPDATE LIST EVERY TIME WITHOUT ANY ADDITIONAL CHECKS
    var ws = new WebSocket("ws://localhost:8888/updateinformer");
    ws.onopen = function(e) {
       loadItemsFromServer();
        console.log(e);
    };
    ws.onmessage = function (evt) {
       loadItemsFromServer();
    };
    
    
    function swapTwoItems(index1, index2) {
        fetch("/itemsswapper", {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: "POST",
            body: JSON.stringify({old_position:index1, new_position:index2})
            }).then(
                function(responce) {
                    if (responce.status === 200) {
                        arrayMove(elements,startPosition,endPosition);
                    }
                }
            );
    }
    
    
    function createNewItem() {
        var newElement = {id:i, text:inputField.value};
        var newNode = document.createElement("li");
        newNode.setAttribute("draggable",true);
        newNode.setAttribute("data-element-id", i);
        
        fetch("/items", {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: "POST",
            body: JSON.stringify(newElement)
            }).then(
                function(responce) {
                    if (responce.status === 200) {
                        elements.push(newElement);
                        newNode.appendChild(document.createTextNode(newElement.text));
                        list.appendChild(newNode);
                    }
                }
            );
    }
    
    
    inputField.addEventListener(
        "keypress", 
        function(e){
            var inputField = e.target; //we can either use dataInput variable;
            if (e.keyCode === 13 && inputField.value != "") {
                e.preventDefault();
                
                createNewItem()
                inputField.value = "";
                i++; 
            }
        })
    
    
    list.ondragstart = function(e){
                    var dragListItem = e.target;
                    var startPosition = getDomElementPosition(list, dragListItem)
                    var endPosition = -1;
        
                    dragListItem.style.opacity = '0.3';
                    e.dataTransfer.setData('text/plain', "");
                    
                    list.ondragenter= function(e){
                        var curPos = getDomElementPosition(list, dragListItem);
                        var newPos = getDomElementPosition(list, e.target);
                        
                        if (newPos >= 0) {
                            endPosition = newPos
                            if (newPos > curPos) {
                                list.insertBefore(dragListItem, e.target.nextSibling);
                            } else if (newPos < curPos) {
                                list.insertBefore(dragListItem, e.target);    
                            }
                        }
                    }
                    
                    list.ondragend= function(e) {
                        dragListItem.style.opacity = '';
                        swapTwoItems(startPosition, endPosition);
                    }
                }

})();