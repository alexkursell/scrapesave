function onReady(){
	console.log("Ready");

$('a').click(function(e){
	console.log("Click");
	e.preventDefault();
	e.stopPropagation();
});
}



jQuery.noConflict();
$ = jQuery;

$(document).ready(onReady);
