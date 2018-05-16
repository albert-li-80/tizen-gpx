function leaflet_map() {
	
	var map;
	var landPath;
    var marker = null;
    var circle = null;
	
	var markerIcon = L.icon({
	    iconUrl: 'lib/leaflet/images/marker-icon.png',
	    iconSize: [30, 30]
	});
	
	var arrowIcon = L.icon({
	    iconUrl: 'lib/leaflet/images/right-arrow-icon.png',
	    iconSize: [30, 30]
	});
	
    // initialize with a little help of jQuery
    $(document).ready(function() {
    	console.log("inside leafletmap.js");
    	
    	init(); // common
    	registerEventHandlers(); // common
    	initializeMap(); // leaflet specific
    	registerMapEventHandlers(); // leaflet specific
    	
    	setToggles(); // common
    	registerPopupEvents(); // common
    	getGPXFile(); // common
    	registerSettingsEventHandlers(); // common
    	getRegularLocation(); // common
    });

    function initializeMap() {
    	map = L.map('map_canvas', {zoomControl: false}).setView([51.505, -0.09], 13);
    	
    	L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    	    attribution: '',
    	    id: 'mapbox.streets',
    	    maxZoom: 25,
    	    accessToken: 'pk.eyJ1IjoiYWxiZXJ0LWxpLTgwIiwiYSI6ImNqaDgwcDQ0cjBkcmQyd21zMGtuNnpjcTcifQ.nqH7zUFj4cVhXiR-SkF8fw'
    	}).addTo(map);    
    	
    	console.log("finished loading Map");
    	if (document.getElementById("acquire_signal").innerHTML == 'Map Loading...')
    		document.getElementById("acquire_signal").innerHTML = '';

    	if (document.getElementById("splash") != null)
    		document.getElementById("splash").style.display="none";
    	
    	loadGPXTracker();
    	
    	if (localStorage.getItem("location_on") == "true")
    		traceCurrentLocation();
    	
    	if (localStorage.getItem("draw_trace") == "true")     		
            landPath = L.polyline(landPathCoordinates, {color: '#FFFF00'}).addTo(map);
    	
    }
        
    function onLocationFound(e) {
    	 	   	
 	   if (e.latlng == null)	   
 		   return;
 	   
 	   if (marker != null) 
 		   marker.remove();
 	   else
		   document.getElementById("acquire_signal").innerHTML = '';

	   marker = L.marker(e.latlng);
	   	   
 	   console.log("position changed");
 	   console.log(e.latlng);
 	   var latlng = {lat: e.latlng.lat, lng: e.latlng.lng};
 	   
 	   landPathCoordinates.push(latlng);
		   
 	   if (localStorage.getItem("center_on") == "true")
 		   map.setView(e.latlng, map.getZoom());

 	   if ((localStorage.getItem("show_distance") == 'true') && (routePoints != null) && (routePoints.length > 0)) {
			   var nearestPt = geolib.findNearest(latlng, routePoints, 0, 1);
			   console.log("nearest :" + nearestPt.distance);
			   var remaining = getRemainingDistance(nearestPt.key);
			   var hinttext = 'Deviation: ' + nearestPt.distance + 'm<br>' ;
			   hinttext = hinttext + 'Rem Dist: ' + (remaining / 1000).toFixed(2) + '/' + (gpxRouteDistance / 1000).toFixed(2) + 'km<p><p><p>';
			   document.getElementById("acquire_signal").innerHTML = hinttext;
		   }
 	   
	   if (localStorage.getItem("follow_heading") == "true") {
		   
		   var degree = 0;
		   var heading = 0;
		   var lastPosition;

		   if (landPathCoordinates.length > 5)
			   lastPosition = landPathCoordinates[landPathCoordinates.length - 5];
		   else
			   lastPosition = landPathCoordinates[landPathCoordinates.length];

		   
		   if (lastPosition != null) {
			   console.log("last position: " + lastPosition.toString());
			   heading = geolib.getBearing(lastPosition, latlng);				   				   
			   degree = 360 - heading;
		   }
	   
		   console.log("heading: " + heading);
		   console.log("degree: " + degree);
		   
		   marker.setRotationAngle(heading);
		   marker.setIcon(arrowIcon);
		   document.getElementById("map_canvas").style.transform = "rotate(" + degree + "deg)";
	   }	

	   localStorage.setItem("lastKnownPosition", JSON.stringify(latlng));

	   // Draw trace to be implemented
	   
	   if (localStorage.getItem("draw_trace") == "true") {
		   landPath.setLatLngs(landPathCoordinates);
	   }
		   
	   marker.addTo(map);

	   var radius = e.accuracy / 2;

	   if (circle != null) circle.remove();
	   circle = L.circle(e.latlng, radius);
	   circle.addTo(map);    	   
    }
        		
    function traceCurrentLocation() {
 	
		document.getElementById("acquire_signal").innerHTML = 'Waiting for GPS Signal...<p><p><p>';
    	map.locate({watch:true});
    	map.on('locationfound', onLocationFound);
    } 
    
    function loadGPXTracker() {
    	
    	var currentGPXFilename = localStorage.getItem("currentGPXFilename");
    	var currentGPXID = localStorage.getItem("currentGPXID");
    	var xmlDoc;
    	    	
    	console.log(currentGPXFilename);
    	    	
    	if ((localStorage.getItem("currentGPXFilename") != null) && (localStorage.getItem("currentGPXFilename") != '')) {
    	
        	var gpxFileList = localStorage.getItem("gpxFilelist");
        	var parsedFileList = JSON.parse(gpxFileList);  	
        	
        	if ((parsedFileList[currentGPXID].infofile != null) && (parsedFileList[currentGPXID].infofile != '')) {
        		
        		// Info file has been stored. Get the info file

        		tizen.filesystem.resolve(
        			parsedFileList[currentGPXID].infofile,
    				function(file) 	{ 
    					file.readAsText(function(data) { 
    						try {   							
        						console.log("infofile data loaded"); 
        						loadGPXDataIntoLeafletMap(data);
    						}
    						catch (err) {
    							console.log("Error in file: " + err.toString());
    							
    							var filelist = JSON.parse(localStorage.getItem("gpxFilelist"));
    							var currentID = localStorage.getItem("currentGPXID");
    							filelist[currentID].status = "E";
    							localStorage.setItem("gpxFilelist", JSON.stringify(filelist));
    							
    			        		localStorage.setItem("currentGPXID", "");
    			        		localStorage.setItem("currentGPXName", "");
    			        		localStorage.setItem("currentGPXFilename", ""); 
    			        		
    			        		getGPXFile();

    							tau.openPopup("loadFileErrorPopup");
    						}
    					})}, 
    				function(e) {console.log("Error" + e.message);},
    				"rw"
    			 );	
        	} else {
				console.log("old format not handled, gpx not set");
			}
    	} else
    	console.log("current gpx file not set");    	
    }

    // handle zoom-in and zoom-out events
    function registerMapEventHandlers() {

    	document.addEventListener('rotarydetent', function(ev) {
    		
			var openDrawer = document.querySelector('.ui-popup-active');
			console.log("open?: "+ openDrawer);
			
			if (!openDrawer) {
				
				/* Get the direction value from the event */
				var direction = ev.detail.direction;

				if (direction == 'CW') {
					/* Add behavior for clockwise rotation */
					console.log('clockwise');
					map.setZoom(map.getZoom()+1);
				} else if (direction == 'CCW') {
					/* Add behavior for counter-clockwise rotation */
					console.log('counter-clockwise');
					map.setZoom(map.getZoom()-1);
				}
			}
		});
    };

    function addMarkers(markerPoint) {    	
    	L.marker(markerPoint.latlng).addTo(map).bindPopup(markerPoint.html);
    }

    function loadGPXDataIntoLeafletMap(data) {

 	   var infoObj = JSON.parse(data);
 	   
 	   var markerPoints = infoObj.markers;
 	   console.log("markers");
        console.log(markerPoints);

        for (var i = 0; i< markerPoints.length; i++) {   	   
     	   addMarkers(markerPoints[i]);
        };
 	    
        routePoints = infoObj.points;
        console.log("routepoints");
        console.log(routePoints);
        
        routePointDistance = infoObj.distances;
        console.log("routepointdistance");
        console.log(routePointDistance);

        gpxRouteDistance = infoObj.routeDistance;
 	   tizen.preference.setValue("gpxRouteDistance", gpxRouteDistance);
 	   console.log("Distance of route: " + gpxRouteDistance);
 	   
        elePoints = infoObj.elevations;
        console.log(elePoints);
        
        elePoints100 = infoObj.elePoints100;
        
        tizen.preference.setValue("GPXMaxEle", infoObj.maxElePoint);
        tizen.preference.setValue("GPXElePoint100", JSON.stringify(elePoints100));

        map.setView(routePoints[0], map.getZoom());
 	   
        // create a red polyline from an array of LatLng points
 
        var polyline = L.polyline(routePoints, {color: 'red'}).addTo(map);
        // zoom the map to the polyline
        map.fitBounds(polyline.getBounds());	  
    };
        
	function locationOnHandler() {
		
		if (localStorage.getItem("location_on") == 'true') {
			localStorage.setItem("location_on", 'false');
    		document.getElementById('location_on').setAttribute("data-title", "Show Current Position: Off" );
    		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = "Show Current Position: Off";
    		document.getElementById("acquire_signal").innerHTML = '';
    		
    		map.stopLocate();
    		if (marker != null) marker.remove();
    		if (circle != null) circle.remove();
    		
		} else if (localStorage.getItem("location_on") == 'false') {
			localStorage.setItem("location_on", 'true');
			document.getElementById('location_on').setAttribute("data-title", "Show Current Position: On" );
    		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = "Show Current Position: On";
			traceCurrentLocation();
		} 
		
		console.log("location on toggle clicked");
	}

	function followHeadingHandler() {
		
		console.log("follow_heading toggle clicked");

		if (localStorage.getItem("follow_heading") == 'true') {
			localStorage.setItem("follow_heading", 'false');
    		document.getElementById('follow_heading').setAttribute("data-title", "Map Orientation: North" );
    		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = "Map Orientation: North";

    		if (marker != null) {
    			marker.setRotationAngle(0);
    			marker.setIcon(markerIcon);
    		}
			document.getElementById("map_canvas").style.transform = "rotate(0deg)";

		} else if (localStorage.getItem("follow_heading") == 'false') {
			localStorage.setItem("follow_heading", 'true');
			document.getElementById('follow_heading').setAttribute("data-title", "Map Orientation: Direction of Travel" );
    		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = "Map Orientation: Direction of Travel";    		
    		if (marker != null)
    			marker.setIcon(arrowIcon);
		}     		
	};

    
	function drawTraceHandler() {
		console.log("draw_trace toggle clicked");
		
		if (localStorage.getItem("draw_trace") == 'true') {
			localStorage.setItem("draw_trace", 'false');
    		document.getElementById('draw_trace').setAttribute("data-title", "Trace Current Route: Off" );
       		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = "Trace Current Route: Off";
    		landPath.remove();
		} else if (localStorage.getItem("draw_trace") == 'false') {
			localStorage.setItem("draw_trace", 'true');
			document.getElementById('draw_trace').setAttribute("data-title", "Trace Current Route: On" );
	   		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = "Trace Current Route: On";
    		landPath = L.polyline(landPathCoordinates, {color: '#FFFF00'}).addTo(map);
		}
	}

    
	return {
		locationOnHandler : locationOnHandler,
		followHeadingHandler : followHeadingHandler,
		drawTraceHandler : drawTraceHandler
	}
};

var my_leaflet_map = leaflet_map();
