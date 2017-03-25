var jq = document.createElement('script');
jq.src = "https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js";
document.getElementsByTagName('head')[0].appendChild(jq);


function NodeAttributes(nodeType, classes, id, index){
	this.nodeType = nodeType;
	this.classes = classes;
  this.id = id;
  this.index = index;
}
   
function getSelectorPath(e){
	if($(e).prop('tagName')){
    //console.log(getFindSelector(e));
    
    path = getSelectorPath($(e).parent().closest('div'));
    path.push(getFindSelector(e));
    return path;
  }
  return [];
};

function getFindSelector(e){
	var nodeType = $(e).prop('nodeName');
  
  var id = $(e).attr("id");
  
  if (!id){
  	id = null;
  }

  var classNames = $(e).attr("class");
  if (classNames){
 		classNames = $.trim(classNames).replace(/\s\s+/g, ' ').replace(/\s/gi, ".").split(".");
    } else {
    	classNames = null;
    }
  
  
  idx = null;
	similar = $(e).parent().closest('div').children(nodeType);
  for(i = 0; i < similar.length; i++){
  	if($(similar[i]).is($(e))){
    	idx = i;
      break;
    };
  };
  
  return new NodeAttributes(nodeType, classNames, id, idx)

};

jQuery.noConflict();
$ = jQuery;
$('div').click(function(e){
	e.stopPropagation();
  console.log(getSelectorPath($(e.target)));
});


/*$('div').click(function(e){
	e.stopPropagation();
  console.log(getFindSelector(e.target));
});*/

/*function highlight(e, n){
	if($(e).prop('tagName')){
    console.log(getFindSelector(e));
    $(e).css('border', '2px solid blue');
    setTimeout(function(){
    	highlight($(e).parent().closest('div'), n + 1);}
      , 1000);
  }
};*/

