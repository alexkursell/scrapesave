$(document).ready(function(){

$('head').append('<link rel="stylesheet" type="text/css" href="sidebar.css');
$('body').wrap('<div style="width:75%;float:left;"></div>')
$('body').append('<div id="previewhalf" class="roundbox flowy" style="float:right;width:20%;"><h3 style="text-align:center">Preview</h3><div class="inside flowy"><em><h3 id="title" class="boxlabel">Title</h3></em><input id="titleinput" class="roundbox" style="font-size:25px" type="text"></input><em><h3 class="boxlabel">Body</h3></em><div id="preview" class="roundbox scrollable" style="max-height:inherit;" contenteditable="true">h</div></div></div>');




});