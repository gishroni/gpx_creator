(function() {

	try {
		// see if coordiante popover is active
		var popover = $(".popover.bottom.ng-isolate-scope").css('display');
		if (popover != "block") {
			// popover is not active
			var html =  "<div style='margin-bottom:5px;font-weight:bold;'>No coordinates chosen<br>"
					+ "<span style='font-size:0.9em;font-weight:normal'>Make sure you right-click the desired location on the map before you open this extension</span></div>";
			return Promise.reject(new Error(html));
		}

		// gets the table raw with the WGS coordiates
		var table = $('tr:contains("WGS 84")');
		// parse the coordinates
		var coord = table[0].cells[1].innerText.split(",");
		var lat = coord[0];
		var lon = coord[1];

		// gets the table raw with elevation
		var table = $('tr:contains("Elevation")');
		// parse elevation
		var elevation = table[0].cells[1].innerText.split(" ");
		var ele = elevation[0];

		// create a json string
		var json = {
			"lat" : lat,
			"lon" : lon,
			"ele" : ele
		};
		var jsonString = JSON.stringify(json);
		return jsonString;

	} catch (err) {
		return Promise.reject(new Error("Could not get coordiates from webpage: " + err));
	}

})();
