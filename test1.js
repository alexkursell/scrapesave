var jq = document.createElement('script');
jq.src = "https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js";
document.getElementsByTagName('head')[0].appendChild(jq);


function NodeAttributes(nodeType, classes, id, index, orig) {
    this.nodeType = nodeType;
    this.classes = classes;
    this.id = id;
    this.index = index;
    this.searchRank = null;
    this.originalObject = orig;
}

function comapareNodeAtributes(o, n){
	var os = 0;
	var ns = 0;

	//Compare classes
	for(var i = 0; i < o.classes.length; i++){
		os++;
		if($.inArray(o.classes[i], n.classes) != -1){
			ns++;
		}
	}

	//Compare ids
	os++;
	if (n.id == o.id){
		ns++;
	}

	//Compare indices
	os++;
	if(n.index == o.index){
		ns++;
	}

	//Return what percentage of original attributes was found in the new element
	return ns / os;
}


function recurseWalk(prev, attrs, idx, confidence){
	console.log("Level " + idx + " with a confidence of " + confidence * 100 + "%.")
	var children = $(prev).children(attrs[idx].nodeType);

	if (children.length < 1){
		return null;
	}

	for(i = 0; i < children.length; i++){
		children[i] = new getFindSelector(children[i]);
		children[i].searchRank = comapareNodeAtributes(attrs[idx], children[i]);
	}

	children.sort(function(a, b){
		return a.searchRank - b.searchRank;
	});

	if (children[children.length - 1].searchRank == 0){
		return null;
	}


	recurseWalk(children[children.length - 1].originalObject, attrs, idx + 1, confidence * children[children.length - 1].searchRank);



}


function getSelectorPath(e) {
    if ($(e).prop('tagName')) {
        //console.log(getFindSelector(e));

        var path = getSelectorPath($(e).parent());
        path.push(getFindSelector(e));
        return path;
    }
    return [];
}

function getFindSelector(e) {
    var nodeType = $(e).prop('nodeName');

    var id = $(e).attr("id");

    if (!id) {
        id = null;
    }

    var classNames = $(e).attr("class");
    if (classNames) {
        classNames = $.trim(classNames).replace(/\s\s+/g, ' ').replace(/\s/gi, ".").split(".");
    } else {
        classNames = null;
    }


    var idx = null;
    var similar = $(e).parent().children(nodeType);
    for (var i = 0; i < similar.length; i++) {
        if ($(similar[i]).is($(e))) {
            idx = i;
            break;
        }
    }

    return new NodeAttributes(nodeType, classNames, id, idx, e);

}

jQuery.noConflict();
$ = jQuery;
$('div').click(function(e) {
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