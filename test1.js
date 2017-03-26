
function NodeAttributes(nodeType, classes, id, index, orig) {
    this.nodeType = nodeType;
    this.classes = classes;
    this.id = id;
    this.index = index;
    this.searchRank = null;
    this.originalObject = orig;
}

function parse(s){
	s = JSON.parse(s);

	for (i = 0; i < s.length; i++){
		var a = s[i];

		s[i] = new NodeAttributes(a[0], a[1], a[2], a[3], null);
	}

	return s;
}


var jq = document.createElement('script');
jq.src = "https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js";
document.getElementsByTagName('head')[0].appendChild(jq);

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
	console.log("Level " + idx + " with a confidence of " + confidence * 100 + "%.");

	if (idx == attrs.length){
		console.log("Reached bottom.");
		console.log($(prev).text());
		return;
	}


	var children = $(prev).children(attrs[idx].nodeType);

	if (children.length < 1){
		return null;
	}

	for(var i = 0; i < children.length; i++){
		children[i] = new getFindSelector(children[i]);
		children[i].searchRank = comapareNodeAtributes(attrs[idx], children[i]);
	}

	children.sort(function(a, b){
		return a.searchRank - b.searchRank;
	});

	if (children[children.length - 1].searchRank == 0){
		console.log("Failed");
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
        classNames = [];
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

path = null;



jQuery.noConflict();
$ = jQuery;
$('div').click(function(e) {
    e.stopPropagation();
    if(path == null){
    	path = getSelectorPath($(e.target));

    	for (i = 0; i < path.length; i++){
    		a = path[i];
    		path[i] = [a.nodeType, a.classes, a.id, a.index];
    	}

    	console.log(JSON.stringify(path));




    } else {
    	recurseWalk(document, path, 0, 1);
    }

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


[["HTML",[],null,0],["BODY",["post-template-default","single","single-post","postid-4326","single-format-standard","s1-collapse","s2-collapse"],null,0],["DIV",[],"pjgm-wrap",0],["DIV",[],"pjgm-main",1],["DIV",[],"pjgm-box",1],["DIV",[],"pjgm-content",0],["DIV",["post-4326","post","type-post","status-publish","format-standard","hentry","category-uncategorized","tag-long-post-is-long","tag-rationality"],"post-4326",0],["H1",["pjgm-posttitle"],null,0]]


