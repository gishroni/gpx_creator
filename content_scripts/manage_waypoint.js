document.body.style.border = "5px solid blue";


(function() {
	var coordinates = [];
	  /**
	   * Check and set a global guard variable.
	   * If this content script is injected into the same page again,
	   * it will do nothing next time.
	   */
	  if (window.hasRun) {
	    return;
	  }
	  window.hasRun = true;

	  /**
	   * Given a URL to a beast image, remove all existing beasts, then
	   * create and style an IMG node pointing to
	   * that image, then insert the node into the document.
	   */
	  function insertBeast(beastURL) {
	    removeExistingBeasts();
	    let beastImage = document.createElement("img");
	    beastImage.setAttribute("src", beastURL);
	    beastImage.style.height = "100vh";
	    beastImage.className = "beastify-image";
	    document.body.appendChild(beastImage);
	  }

	  /**
	   * Remove every beast from the page.
	   */
	  function removeExistingBeasts() {
	    let existingBeasts = document.querySelectorAll(".beastify-image");
	    for (let beast of existingBeasts) {
	      beast.remove();
	    }
	  }
	  
	  function addCoordToList(coord) {
		  coordinates.push(coord);
	  }

	  /**
	   * Listen for messages from the background script.
	   * Call "beastify()" or "reset()".
	  */
	  browser.runtime.onMessage.addListener((message) => {
	    if (message.command === "beastify") {
	      insertBeast(message.beastURL);
	    } else if (message.command === "reset") {
	      removeExistingBeasts();
	    }  else if (message.command === "add") {
	      addCoordToList(message.coord);
	    } else if (message.command === "getCoord") {
	    	return new Promise((resolve, reject) => {
	    		var lat = "getCoord";
	    		var lon = "getCoord";
	    		var ele = "getCoord";
	    		// create a json string
	    		var json = { "lat":lat, "lon":lon, "ele":ele };
	    		var jsonString = JSON.stringify( json );
	    	    resolve(jsonString); // fulfilled
	    	    // or
	    	    reject("Error while obtaining saved coordiates"); // rejected
	    	});	    } 
	  });

})();


