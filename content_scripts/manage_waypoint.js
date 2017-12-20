(function() {
	var coordinates = [];
	  /**
		 * Check and set a global guard variable. If this content script is
		 * injected into the same page again, it will do nothing next time.
		 */
	  if (window.hasRun) {
	    return;
	  }
	  window.hasRun = true;

	  function addCoordToList(coord) {
		  coordinates.push(coord);
	  }

	  /**
		 * Listen for messages from the background script. Call "beastify()" or
		 * "reset()".
		 */
	  browser.runtime.onMessage.addListener((message) => {
		if (message.command === "add") {
	      addCoordToList(message.coord);
	    } else if (message.command === "getCoord") {
	    	// send all the current saved coordinates
	    	return new Promise((resolve, reject) => {
	    		var jsonString = JSON.stringify( coordinates );
	    	    resolve(jsonString); // fulfilled
	    	    // or
	    	    reject("Error while obtaining saved coordiates"); // rejected
	    	});
    	} else if (message.command === "resetList") {
    		coordinates = [];
    	}
	  });

})();


