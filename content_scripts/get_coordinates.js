(function() {

	try {
		// see if coordiante popover is active
		var popover = $(".popover.bottom.ng-isolate-scope").css('display');
		if (popover != "block") {
			// popover is not active
			var html =  "<div style='margin-bottom:5px;font-weight:bold;'>No coordinates selected<br>"
					+ "<span style='font-size:0.9em;font-weight:normal'>Make sure you right-click the desired location on the map before you open this extension</span></div>";
			return Promise.reject(new Error(html));
		}

		// gets the table raw with the WGS coordiates
		var table = $('tr:contains("WGS 84")');
		// parse the coordinates
		var coord = table[0].cells[1].innerText.split(",");
		var lat = coord[0];
		var lon = coord[1];

		// get the altitude string
		var ele = $("[ng-if=altitude]");
		// parse altitude
		var ele = ele.text().match(/\d+\.?\d/);
		
		// create a json string
		var json = {
			"lat" : lat,
			"lon" : lon,
			"ele" : ele
		};
		var jsonString = JSON.stringify(json);
		return jsonString;

	} catch (err) {        
		console.log("No coordinates could be obtained from webpage: " + err);
		return Promise.reject(new Error("Error: could not read coordiates from webpage."));
	}

})();
