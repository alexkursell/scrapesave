
function NodeAttributes(nodeType, classes, id, index, orig) {
    this.nodeType = nodeType;
    this.classes = classes;
    this.id = id;
    this.index = index;
    this.searchRank = null;
    this.originalObject = orig;
}

function PagePaths(titlepath, bodypath, nextpath){
	this.title = titlepath;
	this.body = bodypath;
	this.next = nextpath;
}

function parse(s){
	s = JSON.parse(s);

	for (i = 0; i < s.length; i++){
		var a = s[i];

		s[i] = new NodeAttributes(a[0], a[1], a[2], a[3], null);
	}

	return s;
}


/*var jq = document.createElement('script');
jq.src = "https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js";
document.getElementsByTagName('head')[0].appendChild(jq);*/

function comapareNodeAtributes(o, n){
	var os = 0;
	var ns = 0;

	//Compare classes
	for(var i = 0; i < o.classes.length; i++){
		if(o.classes[i].includes('scrapesave')){
			continue;
		}
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

console.log("hi");
n = -1;

/*jQuery.noConflict();
$ = jQuery;*/

$(document).ready(function(){
	$("<link/>", {
	   rel: "stylesheet",
	   type: "text/css",
	   href: "sidestyle.css"
	}).appendTo("head");

	$('body').wrapInner("<div id='scrapesave-wrapper'></div>");
	$('body').append("<div id='scrapesave-sidebar'><div id='scrapesave-sidebar-fixed'</div></div>");
	$("#scrapesave-sidebar-fixed").append(`<h3 style='text-align:center;width:inherit;'>ScrapeSave</h3>
		<form id='chooseelement'>
			<input type='radio' name='item' value='title' checked="checked">Title</input><br>
			<input type='radio' name='item' value='body'>Body</input><br>
			<input type='radio' name='item' value='next'>Next Page Link</input><br>
		</form>
		<button id="up">UP</button>
		<button id="deselect">DESELECT</button>
		<button id="begin-scan">START</button>`);

	$("#scrapesave-wrapper").click(function(e){
		e.preventDefault();
		e.stopPropagation();
		a = e.target;
		

		console.log($(e.target).get(0).tagName);
		

		//Make sure that the selected 'next' is actually a link
		if($("#chooseelement input[type='radio']:checked").val() == "next"){
			while($(a).get(0).tagName.toLowerCase() != 'a'){
				a = $(a).parent();
			}
		}
		
		
		var sel = 'scrapesave-' + $("#chooseelement input[type='radio']:checked").val();

		$('.' + sel).removeClass(sel);
		$(a).addClass(sel);
	});

	$('#up').click(function(){
		var sel = 'scrapesave-' + $("#chooseelement input[type='radio']:checked").val();
		console.log(sel);
		a = $('#scrapesave-wrapper .' + sel);
		if($(a).parent().attr('id') != 'scrapesave-wrapper'){
			$(a).parent().addClass(sel);
		}
		$(a).removeClass(sel);
	});

	$('#deselect').click(function(){
		var sel = 'scrapesave-' + $("#chooseelement input[type='radio']:checked").val();
		$('#scrapesave-wrapper .' + sel).removeClass(sel);
	});

	$('#begin-scan').click(function(){
		scanPath = new PagePaths(
			getSelectorPath($('.scrapesave-title')),
			getSelectorPath($('.scrapesave-body')),
			getSelectorPath($('.scrapesave-next'))
			);

		console.log(scanPath);

		$.get($('.scra'))


	});
		
});











/*$('div').click(function(e) {
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

});*/

/**/