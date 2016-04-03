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
            list.appendChild(newNode);
        }
    }
    
    var ws = new WebSocket("ws://localhost:8888/updateinformer");
    var actionsMap = {};
    actionsMap["update"] = function(data){
        elements = data["elements"]
        i = elements.length + 1;
        rebuildItemsList()
    }
    
    
    inputField.disabled = true;
    ws.onopen = function() {
        
        inputField.addEventListener(
            "keypress", 
            function(e){
                var inputField = e.target;
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
                if (endPosition != -1) {swapTwoItems(startPosition, endPosition);}
            }
        }
        
        inputField.disabled = false;
    }
    
    ws.onmessage = function (evt) {
        var data = JSON.parse(evt.data);
        actionsMap[data.method](data); //ACTUALLY WE HAVE ONLY ONE METHOD.
    };
    
    function swapTwoItems(index1, index2) {
        var body = JSON.stringify({method:"swap", old_position:index1, new_position:index2})
        ws.send(body);
        arrayMove(elements,index1,index2);
    }
    
    function createNewItem() {
        var newElement = {id:i, text:inputField.value};
        var body = JSON.stringify({method:"add", item:newElement});
        ws.send(body);
        var newNode = document.createElement("li");
        newNode.setAttribute("draggable",true);
        newNode.setAttribute("data-element-id", i);
        
        elements.push(newElement);
        newNode.appendChild(document.createTextNode(newElement.text));
        list.appendChild(newNode);
    }
    
})();