"use strict";

(function (){

    var list = document.getElementById("list");
    var dataInput = document.getElementById("dataInputField");
    var i = 1;
    
    dataInput.addEventListener(
        "keypress", 
        function(e){
            var inputField = e.target; //we can either use dataInput variable;
            if (e.keyCode === 13 && inputField.value != "") {
                var newNode = document.createElement("li");
                newNode.setAttribute("id", "list_item_" + i++);
                newNode.appendChild(document.createTextNode(inputField.value));
                list.appendChild(newNode);
                inputField.value = "";
            }
        })
})()