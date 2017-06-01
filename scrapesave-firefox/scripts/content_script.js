function NodeAttributes(nodeType, classes, id, index, orig) {
    this.nodeType = nodeType;
    this.classes = classes;
    this.id = id;
    this.index = index;
    this.searchRank = null;
    this.originalObject = orig;
}

function getScrollbarWidth() {
    var outer = document.createElement("div");
    outer.style.visibility = "hidden";
    outer.style.width = "100px";

    document.body.appendChild(outer);

    var widthNoScroll = outer.offsetWidth;
    // force scrollbars
    outer.style.overflow = "scroll";

    // add innerdiv
    var inner = document.createElement("div");
    inner.style.width = "100%";
    outer.appendChild(inner);        

    var widthWithScroll = inner.offsetWidth;

    // remove divs
    outer.parentNode.removeChild(outer);

    return widthNoScroll - widthWithScroll;
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

function getAbsolutePath(href) {
    var link = document.createElement("a");
    link.href = href;
    return (window.location.protocol+"//"+link.host+link.pathname+link.search+link.hash);
}

function extractURLList(DOM){
	var links = [];
	$(DOM).find("a").each(function(index){
		if($(this).attr('href')){
			links.push({"url": getAbsolutePath($(this).attr("href"))});
		}
	});

	return links;
}

function refreshElements(list, idx, paths){
	data = list[idx].html;

	list[idx].title = $(recurseWalk(data, paths.title, 0, 1)).text();
	list[idx].body = recurseWalk(data, paths.body, 0, 1);
	list[idx].next = recurseWalk(data, paths.next, 0, 1);
	

	savedpages[list[idx].url] = list[idx];

	updateTable(idx, list);
}

function scanItemCompleted(requestsCompleted, requestsTotal){

	if(requestsCompleted == requestsTotal){
		sideDOM.find("#save").prop("disabled", false);
	}
}

function scan(paths, list){
	parser = new DOMParser();

	var requestsCompleted = 0;
	var requestsTotal = list.length;

	for(var idx = 0; idx < list.length; idx++){
		if (list[idx].url in savedpages){
			list[idx] = savedpages[list[idx].url];
			refreshElements(list, idx, paths);

			requestsCompleted += 1;
			scanItemCompleted(requestsCompleted, requestsTotal);
		}

		else if (!(list[idx].html)){
			console.log("Getting " + list[idx].url);
			$.get(list[idx].url, function(idx){return function(data){
				console.log("Got");
				list[idx].html = $(parser.parseFromString(data, "text/html"));
				refreshElements(list, idx, paths);

			}}(idx)).fail(function(){
				console.log("Scan failed for URL(s): " + url);
			}).always(function(){
				
				requestsCompleted += 1;
				scanItemCompleted(requestsCompleted, requestsTotal);
			});	
		}

		else{
			refreshElements(list, idx, paths);
			
			requestsCompleted += 1;
			scanItemCompleted(requestsCompleted, requestsTotal);
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
	return '<svg viewBox="0 0 8 8" class="pictogram"><use xlink:href="' +
			chrome.extension.getURL("icons/open-iconic.min.svg") +
			'#' + name + '" class="icon-account-login pictogram"></use></svg>'

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

	sideDOM.find("#table-found tr").eq(idx).html(
		"<td>" + text + 
		"</td><td class='view-button'>" + getIconString("eye") + 
		"</td><td class='x-button'>" + getIconString("x") + 
		"</td>");
}

function parseTextList(text){
	var pages = [];
	var a = text.split("\n");

	//Read each line as a url. Ignore empty lines.
	for(var i = 0; i < a.length; i++){
		var url = a[i];
		if(url == "" || url == "\n"){
			continue;
		}

		url = $.trim(url);
		pages.push({"url":getAbsolutePath(url)});
	}

	return pages;
}

function createTextList(pages){
	var text = "";
	//Add each url separated by a newline
	for(var i = 0; i < pages.length; i++){
		text = text + pages[i].url + "\n";
	}

	return text;
}

function pageClickCallback(e){
	e.preventDefault();
		
	var sel = getSelectedBox(sideDOM);

	//The next item must always be a link.
	if(sel == "next" && e.target.tagName.toLowerCase() != "a"){
		return;
	}

	e.stopPropagation();
	
	if(e.target == loc[sel]){
		return
	}
	

	$(loc[sel]).removeClass("scrapesave-" + sel);
	$(e.target).addClass("scrapesave-" + sel);
	
	
	loc[sel] = e.target;

	sideDOM.find("#save").prop("disabled", true);

}

function applyPagePaths(loc, DOM){
	var paths = generatePagePaths(loc);

}

function injectCSS(DOM){
	
	$.get(chrome.extension.getURL("resources/page_style.css"), function(data){
		$(DOM).find("head").append("<style id='scrapesave-style'>" + data + "</style>");
	});


}


//Important global variables
sideDOM = null;
pages = [];
savedpages = {};

//Locations of the currently selected nodes
var loc = {
	"title": null,
	"body": null,
	"next": null,
	"pageslist": null
}


$(document).ready(function(){
	var sidebarUrl = chrome.extension.getURL("resources/sidebar.html");
	

	//Add custom css styling for highlighted sections
	//I would just link a css file, but for some reason firefox dosen't apply it.
	injectCSS(document);
	

	//Wrap page and create sidebar
	$('body').wrapInner("<div id='scrapesave-wrapper'></div>");
	$('body').append("<iframe id='scrapesave-sidebar' scrolling='no' src='" + sidebarUrl + "'></iframe>");
	$('body').append("<iframe id='scrapesave-preview' src=''></iframe>");

	//Prevent clicking links
	$("#scrapesave-wrapper").click(pageClickCallback);
	

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

		//Save pages
		sideDOM.find("#save").click(function(e){
			//Construct the saved html
			console.log("SAVE");
			var a = [];
			for(var idx = 0; idx < pages.length; idx++){
				console.log("LOOPING " + idx);
				var page = pages[idx];
				var title = '<h1 class="chapter">' + page.title + '</h1>';
				var body = $(page.body).html();
				a.push(title + "<br>" + body);
			}
			
			console.log("SAVE");
			//Save the data

			var blob = new Blob(a, {type: "text/html;charset=utf-8"});
			console.log("BLOB");
			console.log(a);
			try{
				saveAs(blob, "saved_site.html");
			}
			catch (err){
				console.log(err);
			}
			console.log("DONE");
		});


		//Allow highlighting by click
		/*sideDOM.on('click', "#table-found tr", function(e){
			sideDOM.find("#table-found tr.highlight").removeClass("highlight");
			sideDOM.find(e.target).closest("tr").addClass('highlight');
		});*/

		//X-Button on table entries. Removes entry.
		sideDOM.on('click', "#table-found td.x-button", function(e){
			var idx = sideDOM.find("#table-found tr").index($(e.target).closest("tr"));

			sideDOM.find("#table-found tr").eq(idx).remove();
			pages.splice(idx, 1);
		});

		//Preview-button on table entries. Opens page in iframe
		sideDOM.on("click", "#table-found td.view-button", function(e){
			
			e.stopPropagation();
			var idx = sideDOM.find("#table-found tr").index($(e.target).closest("tr"));

			//Remove old highlight
			$(sideDOM).find("#table-found .activeIcon").removeClass("activeIcon");

			//Clicking on already opened preview button means close the preview
			if($("#scrapesave-preview").attr("src") == pages[idx].url){
				
				//Allow scrolling on body again
				$("body").css("overflow", "auto");
				
				//Hide and remove iframe source
				$("#scrapesave-preview").css("display", "none");
				$("#scrapesave-preview").attr("src", "");
				
				//Move sidebar back to right of screen
				$("#scrapesave-sidebar").css("right", "0");
				return;
			}

			//No src means no currently opened preview.
			if($("#scrapesave-preview").attr("src") == ""){
				
				//Remove scrollbar on page
				$("body").css("overflow", "hidden");

				//Display the preview iframe
				$("#scrapesave-preview").css("display", "block");
				
				//Move sidebar to left of the scrollbar.
				$("#scrapesave-sidebar").css("right", getScrollbarWidth() + "px");
			}

			//Set specified url as src
			$("#scrapesave-preview").attr("src", pages[idx].url);

			//Highlight active icon
			console.log($(e.target));
			$(e.target).closest("td").addClass("activeIcon");

			//Wait for iframe to load then inject CSS and click handlers
			$("#scrapesave-preview").on("load", function(){
				var pageDOM = $("#scrapesave-preview").contents();
				injectCSS(pageDOM);
				$(pageDOM).click(pageClickCallback);
			});
		});

		//Reverses the order of the pages
		sideDOM.find("#reverse-order").click(function(e){
			//Obvious
			pages.reverse();

			//Update table for all elements
			for(var i = 0; i < pages.length; i++){
				updateTable(i, pages);
			}
		});

		//Manually edit the list of URLs as text (newline separated)
		sideDOM.find("#manual-links").click(function(e){
			
			//If we are in text editing mode
			if(sideDOM.find("#textarea-found").hasClass("activeFound")){
				//Get the new list of pages from the textarea.
				pages = parseTextList(sideDOM.find("#textarea-found").val());
				
				//Update the whole table with new page information.
				for(var i = 0; i < pages.length; i++){
					updateTable(i, pages);
				}

				//Enable all of the editing buttons
				sideDOM.find("#tab-found .button-panel button, #save").prop("disabled", false);
				
				//Switch the visibility back to the table.
				sideDOM.find("#textarea-found").removeClass("activeFound");
				sideDOM.find("#table-found").addClass("activeFound");
			}
			
			//If we are in table mode
			else{
				//Put the current list of URLs into the textarea
				sideDOM.find("#textarea-found").val(createTextList(pages));

				//Disable all of the other editing buttons
				sideDOM.find("#tab-found .button-panel button, #save").not("#manual-links").prop("disabled", true);

				//Switch the visibility to the textarea
				sideDOM.find("#table-found").removeClass("activeFound");
				sideDOM.find("#textarea-found").addClass("activeFound");
			}
		});
	});
});
