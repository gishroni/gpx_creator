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
    	// get waypoint name from text box
    	coordObj.wptName = document.querySelector("#wptName").value;
    	// check if a name was entered
    	if (coordObj.wptName == "") {
    		// no name was entered
    		coordObj.wptName = "(no name)";
    	};
        browser.tabs.sendMessage(tabs[0].id, {
          command: "add",
          coord: coordObj
        });
        updateCoordinates(tabs);
    }
    
    /**
	 * Remove the page-hiding CSS from the active tab, send a "reset" message to
	 * the content script in the active tab.
	 */
    function reset(tabs) {
	// TODO export coordinates
    	
    	// get the list from background script
    	var response = browser.tabs.sendMessage(tabs[0].id, {
    		command: "resetList",
    	});
    	response.then(updateCoordinates(tabs)).catch((error) => {
        console.log("could not clear list of saved coordinates: " + error);
    	});
    }

    /**
	 * Just log the error to the console.
	 */
    function reportError(error) {
      console.error(`command failed: ${error}`);
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
 * gets list of saved coordinates and display them in popup
 */
function updateCoordinates(tabs) {
	var div = document.querySelector("#savedCoord");
	// first clear the displayed waypoints
	div.innerHTML = "";
	
	// get the list from background script
	var response = browser.tabs.sendMessage(tabs[0].id, {
		command: "getCoord",
	});

	// parse the list and display it
	response.then((jsonString) => {
		var coordArray = JSON.parse( jsonString );	
		var length = coordArray.length;
		
		if (length == 0) {
			// no saved coordiates
			div.innerHTML = "(No coordinates are listed)";
		} else {
			// display saved coordiates
			var combinedCoord = [];
			for (var i = 0; i < length; i++) {
				div.innerHTML += "<div class=\"coord\"><span class=\"coord-number\">"+ i + ": </span>" + coordArray[i].wptName + ", " + coordArray[i].lat + ", " + coordArray[i].lon +"<\div>";
			}
		}

	}).catch((error) => {
		div.innerHTMLL = "Could not list saved coordinates.";
        console.log("could not list saved coordinates: " + error);
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


/**
 * get current coordinates from webpage and display them in the popup
 */
var response = browser.tabs.executeScript({file: "/content_scripts/get_coordinates.js"});
listenForClicks();
addCoordToPopup(response);
var tabs = browser.tabs.query({currentWindow: true, active: true});
tabs.then(updateCoordinates);

function addCoordToPopup(message) {
	message.then((coordJson) => {
		coordObj = JSON.parse(coordJson);	
		document.querySelector("#lat").innerHTML = coordObj.lat;
		document.querySelector("#lon").innerHTML = coordObj.lon;
		document.querySelector("#ele").innerHTML = coordObj.ele;
	}).catch((error) => {
		document.querySelector("#coordinatesDetails").innerHTML = error.message;
        console.log("No coordinates could be obtained from webpage: " + error);
	});
}



