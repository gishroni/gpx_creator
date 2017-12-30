var coordArray = [];
var fileName = "waypoints.gpx"
const parser = new DOMParser();

/**
 * Listen for clicks on the buttons, and send the appropriate message to the
 * content script in the page.
 */
function listenForClicks() {
  document.addEventListener("click", (e) => {
	  
    /**
     * creates a .gpx file from the saved waypoints and download it to browser
     */
    function download(tabs) {
    	// create XML
		var length = coordArray.length;

    	var XML = new XMLWriter();
    	XML.BeginNode("gpx");
    	XML.Attrib("version", "1.1");
    	XML.Attrib("creator", "GPX creator");
    	
    	XML.BeginNode("metadata");
    	XML.Node("name", fileName);
    	XML.Node("author", "This file was generated from the Swisstopo online map using the 'GPX creator' Firefox extension");
//    	XML.Node("link", "link to add on");
    	XML.EndNode();

    	for (var i = 0; i < length; i++) {
	    	XML.BeginNode("wpt");
	    	XML.Attrib("lat", coordArray[i].lat.trim());
	    	XML.Attrib("lon", coordArray[i].lon.trim());
	    	XML.Node("ele", coordArray[i].ele.trim());
	    	XML.Node("name", coordArray[i].wptName.trim());
	    	XML.EndNode();
    	}
    	
    	XML.EndNode();
    	
    	var xml = jQuery.parseXML( XML.XML.join("") );
    	var fileAsString = new XMLSerializer().serializeToString(xml);
    	
    	downloadWaypoints(fileAsString);
    	
    	// clear the coordinates' list
    	var response = browser.tabs.sendMessage(tabs[0].id, {
    		command: "resetList",
    	});
    	response.then(updateSavedWaypoints(tabs)).catch((error) => {
        console.log("could not clear list of saved coordinates: " + error);
    	});
    	
    	// close the popup
    	window.close();
    }

    if (e.target.classList.contains("add")) {
      var tabs = browser.tabs.query({active: true, currentWindow: true})
        tabs.then(addCoord).catch(reportError);
    }
    else if (e.target.classList.contains("download")) {
    	 browser.tabs.query({active: true, currentWindow: true})
         .then(download)
         .catch(reportError);
    } 
  });
  
  // checks length of name and enables adding a waypoint with ENTER key
  var el = document.querySelector("#wptName");
  
  el.addEventListener("keydown", (e) => {
	  // if ENTER was pressed - add waypoint
	  if (e.keyCode == 13) {
		  e.preventDefault();
		  var tabs = browser.tabs.query({active: true, currentWindow: true})
	      tabs.then(addCoord).catch(reportError);
	  } else {
		  // count the name of the entered length and warn if too long
		  var cs = document.querySelector("#wptName").value.length;
		    if (cs > 16) {
		    	document.querySelector("#nameWarning").style.display='block';
		    } else {
		    	document.querySelector("#nameWarning").style.display='none';
		    }
	  }
  });
}

/**
 * Just log the error to the console.
 */
function reportError(error) {
  console.error(`command failed: ${error}`);
}

/**
 * add coordinates to list in background script
 */
function addCoord(tabs) {
	// get waypoint name from text box
	currentCoord.wptName = document.querySelector("#wptName").value;
	// check if a name was entered
	if (currentCoord.wptName == "") {
		// no name was entered
		currentCoord.wptName = "(no name)";
	};
    browser.tabs.sendMessage(tabs[0].id, {
      command: "add",
      coord: currentCoord
    });
    updateSavedWaypoints(tabs);
    
    // waypoint added - remove button and add message
    var addButton = document.querySelector("#addButton");
    addButton.innerHTML = "The current coordinates were successfully added to your waypoint's list";
    addButton.className = "coordinate-added-message";
    // disable textbox
    document.querySelector("#wptName").disabled = true;
}

/**
 * gets list of saved coordinates and display them in popup
 */
function updateSavedWaypoints(tabs) {
	var div = document.querySelector("#savedCoord");
	// first clear the displayed waypoints
	div.innerHTML = "";
	
	// get the list from background script
	var response = browser.tabs.sendMessage(tabs[0].id, {
		command: "getWpts",
	});

	// parse the list and display it
	response.then((jsonString) => {
		coordArray = JSON.parse( jsonString );	
		var length = coordArray.length;
		
		if (length == 0) {
			// no saved coordiates
			div.innerHTML = "<div class=\"no-saved-wpt\">Your waypoint's list is empty</div>";
		} else {
			var coordHtml = "<div class=\"saved-wpt\">";

			// display saved coordiates
			for (var i = 0; i < length; i++) {
				coordHtml += "<div";
				if (i > 0) {
					// add gap above coordinate
					coordHtml += " class=\"coord-gap\"";
				}
				coordHtml += "><img class=\"btn-icon\" src=\"/icons/place.png\"/><span class=\"coord-name\"> " + coordArray[i].wptName + "</span>: " + coordArray[i].lat + ", " + coordArray[i].lon +"</div>";
			}
			coordHtml += "</div>";
			div.appendChild(parseHTML(coordHtml));
		}

	}).catch((error) => {
		div.innerHTMLL = "Could not list saved coordinates.";
        console.log("could not list saved coordinates: " + error);
	});
	
}

/**
 * download the waypoints to the browser as a .gpx file
 * @param string
 * @returns
 */
function downloadWaypoints(string) {
	 var element = document.createElement('a');
	  element.setAttribute('href', 'data:text/xml;charset=utf-8,' + encodeURIComponent(string));
	  element.setAttribute('download', fileName);
	  element.style.display = 'none';
	  document.body.appendChild(element);
	  element.click();
	  document.body.removeChild(element);
}

function addCoordToPopup(message) {
	message.then((coordJson) => {
		currentCoord = JSON.parse(coordJson);
		document.querySelector("#lat").innerHTML = "";
		document.querySelector("#lat").appendChild(parseHTML(currentCoord.lat));
		
		document.querySelector("#lon").innerHTML = "";
		document.querySelector("#lon").appendChild(parseHTML(currentCoord.lon));
		
		document.querySelector("#ele").innerHTML = "";
		document.querySelector("#ele").appendChild(parseHTML(currentCoord.ele));
	}).catch((error) => {
		document.querySelector("#coordinatesDetails").innerHTML = "";
		document.querySelector("#coordinatesDetails").appendChild(parseHTML(error.message));
		document.querySelector("#coordinatesDetails").className = "no-coordinates-message border";

        console.log("No coordinates could be obtained from webpage: " + error);
	});
}

function loadSwisstopoAndclosePopup() {
	window.open("https://map.geo.admin.ch");
	window.close();
}

/**
 * parse an HTML string to element to avoid direct assignment
 * @param htmlString HTML element
 * @returns
 */
function parseHTML(htmlString) {
	var parsed = parser.parseFromString(htmlString, "text/html");
	return parsed.getElementsByTagName("body")[0].firstChild;
}

/**
 * run the extension only if the current tab is the Swiss topo website otherwise
 * show error message
 */
function checkUrl(tabs) {
	var url = tabs[0].url;
	var l = document.createElement("a");
    l.href = url;
    if (l.hostname == "map.geo.admin.ch") {
    	// we are on the right webpage - get current coordinates from map and
		// display them in the popup
    	var response = browser.tabs.executeScript({file: "/content_scripts/get_coordinates.js"});
    	listenForClicks();
    	addCoordToPopup(response);
    	updateSavedWaypoints(tabs);
    	} else {
    		document.querySelector("body").innerHTML = "<div class=\"wrong-page border\">This extension will only work in combination with the online map on the Swisstopo website:" +
    				"<br><a style='font-weight:bold' href=\"https://map.geo.admin.ch\" id=\"swisstopoLink\">https://map.geo.admin.ch</a></div>";
    		var el = document.querySelector("#swisstopoLink");
    		el.onclick = loadSwisstopoAndclosePopup;
    	}
}

var tabs = browser.tabs.query({currentWindow: true, active: true});
tabs.then(checkUrl);

