function injectScrapesave(e){
	browser.tabs.executeScript({ 
      	file: "/libraries/jquery-2.1.4.js",
      	runAt: "document_end" 
    }).then(

    browser.tabs.executeScript({ 
        file: "/scripts/content_script.js",
        runAt: "document_end"  
    }))

    //browser.tabs.insertCSS({file: "/resources/page_style.css"})

    browser.tabs.executeScript({ 
      	file: "/libraries/FileSaver.min.js",
      	runAt: "document_end"  
    });
	
};

browser.browserAction.onClicked.addListener(injectScrapesave);

