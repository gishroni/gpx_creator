var coordArray = [];
const parser = new DOMParser();

/**
 * Listen for clicks on the buttons, and send the appropriate message to the
 * content script in the page.
 */
function listenForClicks() {
	document.addEventListener("click", (e) => {

		/**
		 * create a .gpx file from the saved waypoints and download it to browser
		 */
		function download(tabs) {
			try {
				var xml = createGpx(coordArray);

				var fileAsString = new XMLSerializer().serializeToString(xml);

				downloadWaypoints(fileAsString);

				// clear the coordinates list
				var response = browser.tabs.sendMessage(tabs[0].id, {
					command: "resetList",
				});
				response.then(updateSavedWaypoints(tabs)).catch((error) => {
					console.log("could not clear list of saved coordinates: " + error);
				});
				// download successful - make sure error message is not displayed
				document.querySelector("#noDownloadWarning").style.display = 'none';
				// close the popup - but first sleep a bit to allow browser to open save dialog
				sleep(300).then(() => {
					window.close();
				})

			} catch (err) {
				document.querySelector("#noDownloadWarning").style.display = 'block';
			}
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
	if (el) {
		el.addEventListener("keydown", (e) => {
			// if ENTER was pressed - add waypoint
			if (e.keyCode == 13) {
				e.preventDefault();
				var tabs = browser.tabs.query({active: true, currentWindow: true})
				tabs.then(addCoord).catch(reportError);
			} else {
				// count the length of the entered name and warn if too long
				var cs = document.querySelector("#wptName").value.length;
				if (cs > 16) {
					document.querySelector("#nameWarning").style.display='block';
				} else {
					document.querySelector("#nameWarning").style.display='none';
				}
			}
		});
	}
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
	addButton.innerHTML = "";
	addButton.appendChild(parseHTML(browser.i18n.getMessage("waypointAdded")));
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
			// no saved coordinates
			var text = browser.i18n.getMessage("listEmpty");
			div.innerHTML = "";
			div.appendChild(parseHTML("<div class=\"no-saved-wpt\">" + text + "</div>"));
			document.querySelector("#downloadBox").style.display = "none";
		} else {
			var coordHtml = "<div class=\"saved-wpt\">";

			// display saved coordinates
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
			document.querySelector("#downloadBox").style.display = "block";
		}

	}).catch((error) => {
		div.innerHTML = "Could not list saved coordinates.";
		console.log("could not list saved coordinates: " + error);
	});
	
}

/**
 * download the waypoints to the browser as a .gpx file
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
	});
}

function loadSwisstopoAndClosePopup() {
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
		// we are on the right webpage - get current coordinates from map and display them in the popup
		var response = browser.tabs.executeScript({file: "/content_scripts/get_coordinates.js"});
		listenForClicks();
		addCoordToPopup(response);
		updateSavedWaypoints(tabs);
	} else {
		var text = browser.i18n.getMessage("wrongWebpage");
		document.querySelector("body").innerHTML = "";
		document.querySelector("body").appendChild(parseHTML("<div class=\"wrong-page border\">" + text +
			"<br><a style='font-weight:bold' href=\"https://map.geo.admin.ch\" id=\"swisstopoLink\">https://map.geo.admin.ch</a></div>"));
		var el = document.querySelector("#swisstopoLink");
		el.onclick = loadSwisstopoAndClosePopup;
	}
}

/**
 * inject language-adjusted texts to the popup's HTML
 */
function injectTexts() {
	var elements = ["coordinatesHead", "waypointNameLabel", "nameWarning", "addButton", "savedWaypointsHead", "downloadText", "noDownloadWarning"]

	elements.forEach(function (entry) {
		document.querySelector("#" + entry).appendChild(parseHTML(browser.i18n.getMessage(entry)));
	});

	document.querySelector("#wptName").placeholder = browser.i18n.getMessage("wptName");
}

function sleep (time) {
	return new Promise((resolve) => setTimeout(resolve, time));
}


injectTexts();
var tabs = browser.tabs.query({currentWindow: true, active: true});
tabs.then(checkUrl);

