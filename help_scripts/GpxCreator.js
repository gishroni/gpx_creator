var fileName = "waypoints.gpx"

function createGpx(coordArray) {
	// create XML
	var length = coordArray.length;

	var XML = new XMLWriter();
	
	// start gpx
	XML.BeginNode("gpx");
	XML.Attrib("version", "1.1");
	XML.Attrib("creator", "GPX creator Switzerland");
	XML.Attrib("xsi:schemaLocation", "http://www.topografix.com/GPX/1/1/gpx.xsd");
	XML.Attrib("xmlns", "http://www.topografix.com/GPX/1/1" );
	XML.Attrib("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");

	// start metadata
	XML.BeginNode("metadata");
	XML.Node("name", fileName);
	
	// start link
	XML.BeginNode("link");
	XML.Attrib("href", "https://addons.mozilla.org/firefox/addon/gpx-creator/");
	XML.Node("text", "GPX creator Switzerland");
	// end link
	XML.EndNode();
	
	// end metadata
	XML.EndNode();

	for (var i = 0; i < length; i++) {
    	XML.BeginNode("wpt");
    	XML.Attrib("lat", coordArray[i].lat.trim());
    	XML.Attrib("lon", coordArray[i].lon.trim());
    	XML.Node("ele", coordArray[i].ele.trim());
    	XML.Node("name", coordArray[i].wptName.trim());
    	XML.EndNode();
	}
	
	// end gpx
	XML.EndNode();
	
	return jQuery.parseXML( XML.XML.join("") );
}