/**
 * CSS to hide everything on the page, except for elements that have the
 * "beastify-image" class.
 */
const hidePage = `body > :not(.beastify-image) {
                    display: none;
                  }`;


/**
 * Listen for clicks on the buttons, and send the appropriate message to the
 * content script in the page.
 */
function listenForClicks() {
  document.addEventListener("click", (e) => {
	  
    /**
     * add coordinates to list in background script
     */
    function addCoord(tabs) {
        browser.tabs.sendMessage(tabs[0].id, {
          command: "add",
          coord: coordObj
        });
        updateCoordinates(tabs);
    }
    
    function updateCoordinates(tabs) {
    	var response = browser.tabs.sendMessage(tabs[0].id, {
    		command: "getCoord",
    	});
//    	message.then((response) => {
//    		coordObj = JSON.parse(response);	
//    	});
    	
   	document.querySelector("#savedCoord").innerHTML = "coordObj";
   }

    /**
	 * Remove the page-hiding CSS from the active tab, send a "reset" message to
	 * the content script in the active tab.
	 */
    function reset(tabs) {
      browser.tabs.removeCSS({code: hidePage}).then(() => {
        browser.tabs.sendMessage(tabs[0].id, {
          command: "reset",
        });
      });
    }

    /**
	 * Just log the error to the console.
	 */
    function reportError(error) {
      console.error(`Could not beastify: ${error}`);
    }

    /**
	 * Get the active tab, then call "beastify()" or "reset()" as appropriate.
	 */
    if (e.target.classList.contains("add")) {
      browser.tabs.query({active: true, currentWindow: true})
        .then(addCoord)
        .catch(reportError);
    }
    else if (e.target.classList.contains("export")) {
      browser.tabs.query({active: true, currentWindow: true})
        .then(reset)
        .catch(reportError);
    }
  });
}


/**
 * There was an error executing the script. Display the popup's error message,
 * and hide the normal UI.
 */
function reportExecuteScriptError(error) {
  document.querySelector("#popup-content").classList.add("hidden");
  document.querySelector("#error-content").classList.remove("hidden");
  console.error(`Failed to execute beastify content script: ${error.message}`);
}

///**
// * When the popup loads, inject a content script into the active tab, and add a
// * click handler. If we couldn't inject the script, handle the error.
// */
//browser.tabs.executeScript({file: "/content_scripts/manage_waypoint.js"})
//.then(listenForClicks)
//.catch(reportExecuteScriptError);

/**
 * get current coordinates from webpage and display them in the popup
 */
var response = browser.tabs.executeScript({file: "/content_scripts/get_coordinates.js"});
listenForClicks();
addCoordToPopup(response);

function addCoordToPopup(message) {
	message.then((coordJson) => {
		coordObj = JSON.parse(coordJson);	
		document.querySelector("#lat").innerHTML = coordObj.lat;
		document.querySelector("#lon").innerHTML = coordObj.lon;
		document.querySelector("#ele").innerHTML = coordObj.ele;
	}).catch((error) => {
		document.querySelector("#coordinateData").innerHTML = "No coordinates are available";
        console.log("No coordinates could be obtained from webpage: " + reason);
	});
}



