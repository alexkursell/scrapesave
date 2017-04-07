
jQuery.noConflict();
console.log("Started");

$ = jQuery;

$(document).ready(function(){
	console.log("Ready");

$('a').click(function(e){
	console.log("Click");
	e.preventDefault();
	e.stopPropagation();
});




});