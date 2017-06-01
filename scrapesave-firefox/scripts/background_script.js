function injectScrapesave(e){
	browser.tabs.executeScript(null, { 
      	file: "/libraries/jquery-2.1.4.js" 
    });
    browser.tabs.executeScript(null, { 
      	file: "/libraries/FileSaver.min.js" 
    });
	browser.tabs.executeScript(null, { 
      	file: "/scripts/content_script.js" 
    });
};

browser.browserAction.onClicked.addListener(injectScrapesave);

