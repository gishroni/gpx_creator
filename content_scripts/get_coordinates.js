(function() {
	
	return new Promise((resolve, reject) => {
		var lat = 46.59601;
		var lon = 9.46648;
		var ele = 466.0;
		// create a json string
		var json = { "lat":lat, "lon":lon, "ele":ele };
		var jsonString = JSON.stringify( json );
	    resolve(jsonString); // fulfilled
	    // or
	    reject("Error while obtaining coordiates"); // rejected
	});

})();
