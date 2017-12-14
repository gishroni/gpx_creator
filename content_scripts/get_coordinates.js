(function() {
	
	return new Promise((resolve, reject) => {
		  // do something asynchronous which eventually calls either:
		  //
		    resolve("lat: 46.59601<br>lon: 9.46648<br>ele: 466.0"); // fulfilled
		  // or
		    reject("failure reason"); // rejected
		});

//	browser.runtime.sendMessage({
//		contents : "coordinates"
//	});

})();
