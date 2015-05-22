
var confirmarSubmit = function(msg,formname) {

   if (confirm(msg)) {
      document.getElementById(formname).submit();
   }
}

var cambia = function(idfav, idhidden, idform){	
document.getElementById(idform).submit();	
//if(document.getElementById(idhidden).value == "put"){
//document.getElementById(idhidden).value="delete";
//}else{
//document.getElementById(idhidden).value="put";
//}
}

var editarPronostico = function(formname){
  document.getElementById(formname).submit();
}
