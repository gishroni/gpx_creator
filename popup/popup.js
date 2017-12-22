var coordArray = [];

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
    	// create XML
		var length = coordArray.length;

    	var XML = new XMLWriter();
    	XML.BeginNode("gpx");
    	
    	for (var i = 0; i < length; i++) {
	    	XML.BeginNode("wpt");
	    	XML.Attrib("lat", coordArray[i].lat);
	    	XML.Attrib("lon", coordArray[i].lon);
	    	XML.Node("ele", coordArray[i].ele);
	    	XML.EndNode();
    	}
    	
    	XML.EndNode();
    	
    	var text = jQuery.parseXML( XML.XML.join("") );
    	
    	var string = new XMLSerializer().serializeToString(text);
    	
    	downloadWaypoints(string);
    	
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
		coordArray = JSON.parse( jsonString );	
		var length = coordArray.length;
		
		if (length == 0) {
			// no saved coordiates
			div.innerHTML = "(No coordinates are listed)";
		} else {
			// display saved coordiates
			for (var i = 0; i < length; i++) {
				div.innerHTML += "<div class=\"coord\"><span class=\"coord-number\">"+ i + ": </span>" + coordArray[i].wptName + ", " + coordArray[i].lat + ", " + coordArray[i].lon +"<\div>";
			}
		}

	}).catch((error) => {
		div.innerHTMLL = "Could not list saved coordinates.";
        console.log("could not list saved coordinates: " + error);
	});
	
}

function downloadWaypoints(string) {
	 var element = document.createElement('a');
	  element.setAttribute('href', 'data:text/xml;charset=utf-8,' + encodeURIComponent(string));
	  element.setAttribute('download', "waypoint.xml");
	  element.style.display = 'none';
	  document.body.appendChild(element);
	  element.click();
	  document.body.removeChild(element);
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



