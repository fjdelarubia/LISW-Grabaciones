

//var confirmarSubmit = function(msg,formname) {

  // if (confirm(msg)) {
   //   document.getElementById(formname).submit();
   //}
//}

var confirmarSubmit = function(msg, forname){
	alertify.confirm(msg, function(closeEvent){
		if(closeEvent){
		document.getElementById(forname).submit();
		}
	});
}

