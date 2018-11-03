function leaflet_map() {
	
	var map;
	var layer;
	var landPath;
    var marker = null;
    var circle = null;

	var bluedotIcon = L.icon({
	    iconUrl: 'lib/leaflet/images/bluedot-icon.png',
	    iconSize: [30, 30],
		iconAnchor: [15,15]
	});
	
	var markerIcon = L.icon({
	    iconUrl: 'lib/leaflet/images/marker-icon.png',
	    iconSize: [20, 40],
		iconAnchor: [10,40]
	});
	
	var arrowIcon = L.icon({
	    iconUrl: 'lib/leaflet/images/right-arrow-icon.png',
	    iconSize: [40, 40],
	    iconAnchor: [20,3]
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
    	map = L.map('map_canvas', {zoomControl: false}).setView([22.4,114.1], 13);
    	
    	layer = L.tileLayer('https://tile.thunderforest.com/{id}/{z}/{x}/{y}.png?apikey={accessToken}', {
    	    attribution: '© <a href="https://www.thunderforest.com">Thunderforest</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    	    id: localStorage.getItem("map_type"),
    	    maxZoom: 25,
    	    useCache: true,
    	    crossOrigin: true,
    	    maxAge: 30 * 1000 * 60 * 60 * 24,	// 30 days
    	    accessToken: 'cf24ff10559d44dfabfeaa0a57541b4e'
    	}).addTo(map);    
    	
    	console.log("finished loading Map");

		// Listen to cache hits and misses and spam the console
		// The cache hits and misses are only from this layer, not from the WMS layer.
		layer.on('tilecachehit',function(ev){
			console.log('Cache hit: ', ev.url);
		});
		layer.on('tilecachemiss',function(ev){
			console.log('Cache miss: ', ev.url);
		});
		layer.on('tilecacheerror',function(ev){
			console.log('Cache error: ', ev.tile, ev.error);
		});
		
    	document.getElementById("acquire_signal").innerHTML = '';

    	if (document.getElementById("splash") != null)
    		document.getElementById("splash").style.display="none";
    	
    	loadGPXTracker();
    	
    	if (localStorage.getItem("location_on") == "true")
    		traceCurrentLocation();
    	
    	if (localStorage.getItem("draw_trace") == "true")     		
            landPath = L.polyline(landPathCoordinates, {color: '#e542f4'}).addTo(map);
    	
    }
        
    function updateLocation(latlng, accuracy) {		

    	if (localStorage.getItem("location_on") == 'false') {
    		document.getElementById("acquire_signal").innerHTML = '';
    		return;
    	}

    	if (marker != null)  
    		marker.remove();
    	else 
    		document.getElementById("acquire_signal").innerHTML = '';
  	   
    	marker = L.marker(latlng, {icon: bluedotIcon, opacity: 0.8});
	   	    	   
 	   	if (localStorage.getItem("center_on") == "true")
 	   		map.setView(latlng, map.getZoom());
 	   
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
 	   		marker.setRotationOrigin('top center');
 	   		marker.setIcon(arrowIcon);
 	   		document.getElementById("map_canvas").style.transform = "rotate(" + degree + "deg)";
 	   	}	

	   // Draw trace to be implemented
	   
	   if (localStorage.getItem("draw_trace") == "true") {
		   landPath.setLatLngs(landPathCoordinates);
	   }
		   
	   marker.addTo(map);

	   var radius = accuracy / 2;

	   if (circle != null) circle.remove();
	   circle = L.circle(latlng, radius);
	   circle.addTo(map);    	       	
    }
    
    function onLocationFound(e) {
    	 	   	
 	   if (e.latlng == null)	   
 		   return;

 	   console.log("position changed");
 	   console.log(e.latlng);

 	   var latlng = {lat: e.latlng.lat, lng: e.latlng.lng};
 	   
 	   landPathCoordinates.push(latlng);
 	   localStorage.setItem("lastKnownPosition", JSON.stringify(latlng));

 	   updateLocation(latlng, e.accuracy);

 	   if ((localStorage.getItem("show_distance") == 'true') && (routePoints != null) && (routePoints.length > 0)) {
		   var nearestPt = geolib.findNearest(latlng, routePoints, 0, 1);
		   console.log("nearest :" + nearestPt.distance);
		   var remaining = getRemainingDistance(nearestPt.key);
		   
		   tizen.preference.setValue("nearestPoint", nearestPt.distance);
		   tizen.preference.setValue("lastUpdateTime", JSON.stringify(new Date()));	
		   tizen.preference.setValue("distanceRemaining", remaining);
		   
		   var hinttext = TIZEN_L10N['distance_remaining'] + ": " + (remaining / 1000).toFixed(2) + '/' + (gpxRouteDistance / 1000).toFixed(2) + 'KM<br>';
		   hinttext = hinttext + TIZEN_L10N['deviation'] + ": " + nearestPt.distance + 'M<p><p><p>' ;

		   document.getElementById("acquire_signal").innerHTML = hinttext;
	   }
    }
        		
    function traceCurrentLocation() {
 	
		document.getElementById("acquire_signal").innerHTML = TIZEN_L10N['wait_gps'] + '...<p><p><p>';
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
        
        var latlng = polyline.getBounds();
        map.fitBounds(latlng);	  
        layer.seed(latlng, map.getZoom(), map.getZoom()+1);
        
    	// Display seed progress on console
		layer.on('seedprogress', function(seedData){
			var percent = 100 - Math.floor(seedData.remainingLength / seedData.queueLength * 100);
			console.log('Seed queue: ' + seedData.queueLength);
			console.log('Seed remaining: ' + seedData.remainingLength);
			console.log('Seeding ' + percent + '% done');
		});
		
		layer.on('seedend', function(seedData){
			console.log('Cache seeding complete');
		});
    };
        
	function locationOnHandler() {
		
		if (localStorage.getItem("location_on") == 'true') {
			localStorage.setItem("location_on", 'false');
    		document.getElementById('location_on').setAttribute("data-title", TIZEN_L10N['show_current_position'] + ": " + TIZEN_L10N['off'] );
    		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = TIZEN_L10N['show_current_position'] + ": " + TIZEN_L10N['off'];
    		document.getElementById("acquire_signal").innerHTML = '';
    		
    		map.stopLocate();
    		if (marker != null) marker.remove();
    		if (circle != null) circle.remove();
    		
		} else if (localStorage.getItem("location_on") == 'false') {
			localStorage.setItem("location_on", 'true');
			document.getElementById('location_on').setAttribute("data-title", TIZEN_L10N['show_current_position'] + ": " + TIZEN_L10N['on'] );
    		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = TIZEN_L10N['show_current_position'] + ": " + TIZEN_L10N['on'];
			traceCurrentLocation();
		} 
		
		console.log("location on toggle clicked");
	}

	function followHeadingHandler() {
		
		console.log("follow_heading toggle clicked");

		if (localStorage.getItem("follow_heading") == 'true') {
			localStorage.setItem("follow_heading", 'false');
    		document.getElementById('follow_heading').setAttribute("data-title", TIZEN_L10N['map_orientation'] + ": " + TIZEN_L10N['north'] );
    		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = TIZEN_L10N['map_orientation'] + ": " + TIZEN_L10N['north'];

    		if (marker != null) {
    			marker.setRotationAngle(0);
    			marker.setRotationOrigin('top center');
    			marker.setIcon(bluedotIcon);
    		}
			document.getElementById("map_canvas").style.transform = "rotate(0deg)";

		} else if (localStorage.getItem("follow_heading") == 'false') {
			localStorage.setItem("follow_heading", 'true');
			document.getElementById('follow_heading').setAttribute("data-title", TIZEN_L10N['map_orientation'] + ": " + TIZEN_L10N['direction_of_travel'] );
    		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = TIZEN_L10N['map_orientation'] + ": " + TIZEN_L10N['direction_of_travel'];    		
    		if (marker != null)
    			marker.setIcon(arrowIcon);
		}     		
	};

    
	function drawTraceHandler() {
		console.log("draw_trace toggle clicked");
		
		if (localStorage.getItem("draw_trace") == 'true') {
			localStorage.setItem("draw_trace", 'false');
    		document.getElementById('draw_trace').setAttribute("data-title", TIZEN_L10N['trace_current_route'] + ": " + TIZEN_L10N['off'] );
       		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = TIZEN_L10N['trace_current_route'] + ": " + TIZEN_L10N['off'];
    		landPath.remove();
		} else if (localStorage.getItem("draw_trace") == 'false') {
			localStorage.setItem("draw_trace", 'true');
			document.getElementById('draw_trace').setAttribute("data-title", TIZEN_L10N['trace_current_route'] + ": " + TIZEN_L10N['on']);
	   		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = TIZEN_L10N['trace_current_route'] + ": " + TIZEN_L10N['on'];
    		landPath = L.polyline(landPathCoordinates, {color: '#e542f4'}).addTo(map);
		}
	}

    
	return {
		locationOnHandler : locationOnHandler,
		followHeadingHandler : followHeadingHandler,
		drawTraceHandler : drawTraceHandler,
		updateLocation : updateLocation
	}
};

var my_leaflet_map = leaflet_map();
