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
	//console.log("Level " + idx + " with a confidence of " + confidence * 100 + "%.");

	if (idx == attrs.length){
		//console.log("Reached bottom.");
		return prev;
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

	return recurseWalk(children[children.length - 1].originalObject, attrs, idx + 1, confidence * children[children.length - 1].searchRank);
}

function getSelectorPath(e) {
    if ($(e).prop('tagName')) {
        //console.log(getFindSelector(e));

        var path = getSelectorPath($(e).parent());
        if($(e).attr('id') != "scrapesave-wrapper"){
        	path.push(getFindSelector(e));
        }
        
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

function getSelectedBox(DOM){
	return DOM.find("#chooseelement input[type='radio']:checked").val();
}

function extractURLList(thisDOM){
	var links = [];
	$(thisDOM).find("a").each(function(index){
		if($(this).attr('href')){
			links.push({"url": $(this).attr('href')});
		}
	});

	return links;
}

function scan(paths, list){
	var title, body, next;
	parser = new DOMParser();

	for(var idx = 0; idx < list.length; idx++){
		console.log(idx + " idx");
		$.get(list[idx].url, function(idx){return function(data){
			data = $(parser.parseFromString(data, "text/html"));
			
			title = $(recurseWalk(data, paths.title, 0, 1)).text();
			body = recurseWalk(data, paths.body, 0, 1);
			next = recurseWalk(data, paths.next, 0, 1);
			
			list[idx] = {"title":title, "body":body, "next":next, "url":list[idx].url};
			updateTable(idx, list);


		}}(idx)).fail(function(){
			console.log("Scan failed for URL(s): " + url);
		});	
	}
}

function updateTable(idx, list){
	console.log(idx, list[idx]);
	var text;
	
	if(list[idx].title){
		text = list[idx].title;
	}
	else{
		text = list[idx].url;
	}

	console.log(text);
	while($(sideDOM).find("#table-found tr").length < idx + 1){
		console.log("ADDING");
		$(sideDOM).find("#table-found").append("<tr><td></tr></td>");
	}

	sideDOM.find("#table-found tr").eq(idx).html("<td>" + text + "</td>");
}

sideDOM = null;
urls = [];
$(document).ready(function(){
	var sidebarUrl = chrome.extension.getURL("scripts/sidebar.html");
	var pageStyleUrl = chrome.extension.getURL("scripts/page_style.css");
	
	var loc = {
		"title": null,
		"body": null,
		"next": null,
		"pageslist": null
	}

	//Add custom css styling for highlighted sections
	//I would just link a css file, but for some reason firefox dosen't apply the rules.
	$("head").append("<style id='scrapesave-style'> .scrapesave-pageslist {background-color: pink !important;border: 1px solid black;}.scrapesave-title {background-color: orange !important;border: 1px solid black;}.scrapesave-body {background-color: yellow !important;border: 1px solid black;}.scrapesave-next {background-color: green !important;border: 1px solid black;}</style>");

	//Wrap page and create sidebar
	$('body').wrapInner("<div id='scrapesave-wrapper'></div>");
	$('body').append("<iframe id='scrapesave-sidebar' scrolling='no' src='" + sidebarUrl + "' style='position:fixed;z-index:99999999;bottom:0;right:0;height:50vh;'></iframe>");

	//Prevent clicking links
	$("#scrapesave-wrapper").click(function(e){
		e.preventDefault();
		
		var sel = getSelectedBox(sideDOM);

		if(sel == "next" && e.target.tagName.toLowerCase() != "a"){
			return;
		}

		e.stopPropagation();

		$(e.target).addClass("scrapesave-" + sel);
		$(loc[sel]).removeClass("scrapesave-" + sel);
		
		
		loc[sel] = e.target;
	});
	

	$('#scrapesave-sidebar').on("load", function(){
		sideDOM = $("#scrapesave-sidebar").contents();
		var pageDOM = $("#scrapesave-wrapper").contents();

		sideDOM.find("#tabbar button").click(function(e){
			var sel = $(e.target).attr("id").replace("button-", "");

			sel = "#tab-" + sel;

			sideDOM.find(".activeTab").removeClass("activeTab");
			sideDOM.find(sel).addClass("activeTab");

		});

		sideDOM.find('#deselect').click(function(e){
			
			var sel = getSelectedBox(sideDOM);
			$(loc[sel]).removeClass("scrapesave-" + sel);
			loc[sel] = null;
		});

		sideDOM.find("#up").click(function(e){
			
			var sel = getSelectedBox(sideDOM);
			var parent = $(loc[sel]).parent();

			$(loc[sel]).removeClass("scrapesave-" + sel);
			
			if($(parent).attr('id') == "scrapesave-wrapper"){
				loc[sel] = null;
			}
			else{
				$(parent).addClass("scrapesave-" + sel);
				loc[sel] = parent;
			}
		});

		sideDOM.find("#begin-scan").click(function(e){
			var paths = [];
			for(var i in loc){
				paths.push(getSelectorPath(loc[i]));
			}
			
			scan(new PagePaths(paths[0], paths[1], paths[2]), urls);
		})

		sideDOM.find("#pages-scan").click(function(e){
			sideDOM.find("#table-found").empty();
			
			console.log(loc["pageslist"])
			urls = extractURLList($(loc["pageslist"]));
			console.log(urls);
			
			for(var i = 0; i < urls.length; i++){
				sideDOM.find("#table-found").append("<tr><td>" + urls[i].url + "</tr></td>");
			}
		});

		sideDOM.find("#close").click(function(e){
			$("#scrapesave-wrapper").replaceWith($("#scrapesave-wrapper").contents());
			$("#scrapesave-style").remove();
			$("#scrapesave-sidebar").remove();
			for(var i in loc){
				$(loc[i]).removeClass("scrapesave-" + i);
			}
		});
	});
});
