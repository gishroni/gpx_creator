(function() {

	try {
		// see if coordinate popover is active
		var popover = $(".popover.bottom.ng-isolate-scope").css('display');
		if (popover != "block") {
			// popover is not active
			var textHead = 	browser.i18n.getMessage("noCoordHead");
			var text = 	browser.i18n.getMessage("noCoord");
			var html =  "<div style='margin-bottom:5px;font-weight:bold;'>" + textHead + "<br>"
					+ "<span style='font-size:0.9em;font-weight:normal'>" + text + "</span></div>";
			return Promise.reject(new Error(html));
		}

		// gets the table row with the WGS coordinates
		var table = $('tr:contains("WGS 84")');
		// parse the coordinates
		var coord = table[0].cells[1].innerText.split(",");
		var lat = coord[0];
		var lon = coord[1];

		// get the altitude string
		var ele = $("[ng-if=altitude]");
		// parse altitude
		var ele = ele.text().match(/\d+\.?\d/)[0];

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
		var textHead = browser.i18n.getMessage("noCoordError");
		return Promise.reject(new Error(textHead));
	}

})();
