function injectScrapesave(e){
	browser.tabs.executeScript(null, { 
      	file: "/libraries/jquery-2.1.4.js",
      	runAt: "document_end" 
    });
    browser.tabs.executeScript(null, { 
      	file: "/libraries/FileSaver.min.js",
      	runAt: "document_end"  
    });
	browser.tabs.executeScript(null, { 
      	file: "/scripts/content_script.js",
      	runAt: "document_end"  
    });
};

browser.browserAction.onClicked.addListener(injectScrapesave);

