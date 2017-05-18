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

	if (idx == 0 && attrs.length == 0){
		return null;
	}

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
		//console.log("Failed");
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

function refreshElements(list, idx, paths){
	data = list[idx].html;
	console.log(paths);

	list[idx].title = $(recurseWalk(data, paths.title, 0, 1)).text();
	list[idx].body = recurseWalk(data, paths.body, 0, 1);
	list[idx].next = recurseWalk(data, paths.next, 0, 1);
	

	savedpages[list[idx].url] = list[idx];
	updateTable(idx, list);
}

function scan(paths, list){
	var title, body, next;
	parser = new DOMParser();

	for(var idx = 0; idx < list.length; idx++){

		if (list[idx].url in savedpages){
			list[idx] = savedpages[list[idx].url];
			refreshElements(list, idx, paths);
		}

		else if (!(list[idx].html)){
			console.log("Getting " + list[idx].url);
			$.get(list[idx].url, function(idx){return function(data){
				list[idx].html = $(parser.parseFromString(data, "text/html"));
				refreshElements(list, idx, paths);

			}}(idx)).fail(function(){
				console.log("Scan failed for URL(s): " + url);
			});	
		}

		else{
			refreshElements(list, idx, paths);
		}
		
	}
}

function generatePagePaths(loc){
	var n = {};
	for(var prop in loc){
		if(loc.hasOwnProperty(prop)){
			n[prop] = getSelectorPath(loc[prop]);
		}
	}
	return n;
}

function getIconString(name){
	return "<img class='pictogram' src='" +
		chrome.extension.getURL("icons/open-iconic/svg/" + name + ".svg") + 
		"'>"
}

function updateTable(idx, list){
	var text;
	
	if(list[idx].title){
		text = list[idx].title;
	}
	else{
		text = list[idx].url;
	}

	while($(sideDOM).find("#table-found tr").length < idx + 1){
		$(sideDOM).find("#table-found").append("<tr><td></tr></td>");
	}

	sideDOM.find("#table-found tr").eq(idx).html("<td>" + text + 
		"</td><td class='x-button'>" + 
		getIconString("x") + "</td>");
}

function parseTextList(text){
	var pages = [];
	var a = text.split("\n");
	for(var i = 0; i < a.length; i++){
		var url = a[i];
		if(url == "" || url == "\n"){
			continue;
		}
		url = $.trim(url);

		pages.push({"url":url});
	}

	return pages;
}

function createTextList(pages){
	var text = "";
	for(var i = 0; i < pages.length; i++){
		text = text + pages[i].url + "\n";
	}
	console.log(text);
	return text;
}


//Important global variables
sideDOM = null;
pages = [];
savedpages = {};


$(document).ready(function(){
	var sidebarUrl = chrome.extension.getURL("scripts/sidebar.html");
	var pageStyleUrl = chrome.extension.getURL("scripts/page_style.css");
	

	//Locations of the currently selected nodes
	var loc = {
		"title": null,
		"body": null,
		"next": null,
		"pageslist": null
	}

	//Add custom css styling for highlighted sections
	//I would just link a css file, but for some reason firefox dosen't apply it.
	$("head").append("<style id='scrapesave-style'> .scrapesave-pageslist {background-color: pink !important;border: 1px solid black;}.scrapesave-title {background-color: orange !important;border: 1px solid black;}.scrapesave-body {background-color: yellow !important;border: 1px solid black;}.scrapesave-next {background-color: green !important;border: 1px solid black;}</style>");

	//Wrap page and create sidebar
	$('body').wrapInner("<div id='scrapesave-wrapper'></div>");
	$('body').append("<iframe id='scrapesave-sidebar' scrolling='no' src='" + sidebarUrl + "' style='position:fixed;z-index:99999999;bottom:0;right:0;height:66vh;width:33vw'></iframe>");

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
	

	//All of the event handlers for the actual sidebar
	$('#scrapesave-sidebar').on("load", function(){
		
		//The DOM for the sidebar
		sideDOM = $("#scrapesave-sidebar").contents();

		//Inject icons
		sideDOM.find("#manual-links").html(getIconString("pencil"));

		sideDOM.find("#reverse-order").html(getIconString("loop-square"));

		
		//Implement tab switching
		sideDOM.find("#tabbar button").click(function(e){
			var sel = $(e.target).attr("id").replace("button-", "");

			sel = "#tab-" + sel;

			sideDOM.find(".activeTab").removeClass("activeTab");
			sideDOM.find(sel).addClass("activeTab");

		});

		//Deselect currently selected attribute
		sideDOM.find('#deselect').click(function(e){
			
			var sel = getSelectedBox(sideDOM);
			$(loc[sel]).removeClass("scrapesave-" + sel);
			loc[sel] = null;
		});

		//Go to the parent DOM node of the currently selected attribute
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


		//Get all HTML files in the table
		sideDOM.find("#begin-scan").click(function(e){
			scan(generatePagePaths(loc), pages);
		})


		//Gets all specified links, adds them to the table
		sideDOM.find("#pages-scan").click(function(e){
			sideDOM.find("#table-found").empty();
			
			pages = extractURLList($(loc["pageslist"]));
			for(var i = 0; i < pages.length; i++){
				updateTable(i, pages);
			}

		});

		//Close by refreshing page.
		sideDOM.find("#close").click(function(e){
			history.go(0);
		});

		sideDOM.find("#save").click(function(e){
			//Perform scan
			scan(generatePagePaths(loc), pages);
			
			//Construct the saved html
			var a = [];
			for(var idx = 0; idx < pages.length; idx++){
				var page = pages[idx];
				var title = '<h1 class="chapter">' + page.title + '</h1>';
				var body = $(page.body).html();
				a.push(title + "<br>" + body);
			}
			
			//Save the data
			saveAs(new Blob(a, {type: "text/html;charset=utf-8"}), "saved_site.html");
		});


		//Allow highlighting by click
		sideDOM.on('click', "#table-found tr", function(e){
			sideDOM.find("#table-found tr.highlight").removeClass("highlight");
			sideDOM.find(e.target).closest("tr").addClass('highlight');
		});

		//X-Button on table entries. Removes entry.
		sideDOM.on('click', "#table-found td.x-button", function(e){
			var idx = sideDOM.find("#table-found tr").index($(e.target).closest("tr"));

			sideDOM.find("#table-found tr").eq(idx).remove();
			pages.splice(idx, 1);
		});

		sideDOM.find("#reverse-order").click(function(e){
			pages.reverse();
			for(var i = 0; i < pages.length; i++){
				updateTable(i, pages);
			}
		});

		sideDOM.find("#manual-links").click(function(e){
			if(sideDOM.find("#textarea-found").hasClass("activeFound")){
				pages = parseTextList(sideDOM.find("#textarea-found").val());
				
				for(var i = 0; i < pages.length; i++){
					updateTable(i, pages);
				}
				
				sideDOM.find("#textarea-found").removeClass("activeFound");
				sideDOM.find("#table-found").addClass("activeFound");
			}
			else{
				sideDOM.find("#textarea-found").val(createTextList(pages));

				sideDOM.find("#table-found").removeClass("activeFound");
				sideDOM.find("#textarea-found").addClass("activeFound");

			}
		});
	});
});
