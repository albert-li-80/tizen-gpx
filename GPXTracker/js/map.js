function google_map() {
	
	var map;
	var landPath;
	var GeoMarker;
			
    // initialize with a little help of jQuery
    $(document).ready(function() {
    	
    	if (map == null) {
    		init();
    		registerEventHandlers();
    	
    		initializeMap();
    		registerMapEventHandlers();
    	
    		setToggles();
    		registerPopupEvents();
    		getGPXFile();
    		registerSettingsEventHandlers();
    		getRegularLocation();
    	}
    	else {
			loadGPXTracker();
		}
    });
    
    function initializeMap()
    {
    	var mapCenter;
    	
    	mapCenter = getLastPosition();

    	if (mapCenter == null)
    		mapCenter = new google.maps.LatLng(22.4, 114.1);

    	map = new google.maps.Map(document.getElementById('map_canvas'), {
           zoom: 14,
           center: mapCenter,
           mapTypeId: google.maps.MapTypeId.TERRAIN,           
           mapTypeControl: false,
           zoomControl: false,
           scaleControl: true,
           streetViewControl: false,
           fullscreenControl: false
         });
  	
    	console.log("finished initializeMap");
    	if (document.getElementById("acquire_signal").innerHTML == 'Map Loading...')
    		document.getElementById("acquire_signal").innerHTML = '';
    	
    	loadGPXTracker();

    	if (localStorage.getItem("location_on") == "true")
    		traceCurrentLocation();

    	if (localStorage.getItem("draw_trace") == "true") {
    		
    		landPath = new google.maps.Polyline({
    			path: landPathCoordinates,
    			geodesic: true,
    			strokeColor: '#FFFF00',
    			strokeOpacity: 1.0,
    			strokeWeight: 5
    		});

    		landPath.setMap(map);
    	}
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
        						loadGPXDataIntoGoogleMap(data);
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

        		tizen.filesystem.resolve(
    				currentGPXFilename,
    				function(file) 	{ 
    					file.readAsText(function(data) { 
    						try {
    							xmlDoc = jQuery.parseXML(data); 
        						console.log("data loaded"); 
        						loadGPXFileIntoGoogleMap(xmlDoc);
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
        	
        		console.log("gpx file loaded");
        	}
    	} else
    	console.log("current gpx file not set");    	
    }

    function calculateEleProfile() {
    	
    	var maxElePoint = 0;
    	
    	for (var i = 0; i< elePoints.length; i++)
    		if (Number(elePoints[i]) > maxElePoint) maxElePoint = Number(elePoints[i]);

    	console.log("max ele: " + maxElePoint);

    	tizen.preference.setValue("GPXMaxEle", maxElePoint);

    	elePoints100[0] = elePoints[0];
    	elePoints100[99] = elePoints[elePoints.length-1];
    	    	
    	var j = 0;
		var tmpDistance = 0;
		
    	for (var i=1; i< 99; i++) {
    		while (elePoints100[i] == null) {    			
    			console.log("i: " + i + " j: "+ j + " tmpd: " + tmpDistance + " eva: " + (gpxRouteDistance / 100 * i));
    			if ((tmpDistance + routePointDistance[j]) > (gpxRouteDistance / 100 * i)) 
    				elePoints100[i] = elePoints[j];
    			else {
    				tmpDistance = tmpDistance + routePointDistance[j];
    				j++;
    			}
    		}
    	}
    				
    	console.log(elePoints100);
    	tizen.preference.setValue("GPXElePoint100", JSON.stringify(elePoints100));
    }
    
    function positionChangedHandler() {
		   
    	   var currentPos = this.getPosition();
    	   
    	   if (currentPos == null)	   
    		   return;
    	   
		   console.log("position changed");
		   console.log(currentPos);
		   
		   landPathCoordinates.push(currentPos.toJSON());
		   
		   if (localStorage.getItem("center_on") == "true")
			   map.setCenter(currentPos);

		   if ((localStorage.getItem("show_distance") == 'true') && (routePoints != null) && (routePoints.length > 0)) {
			   var nearestPt = geolib.findNearest(currentPos.toJSON(), routePoints, 0, 1);
			   console.log("nearest :" + nearestPt.distance);
			   var remaining = getRemainingDistance(nearestPt.key);
			   var hinttext = TIZEN_L10N['distance_remaining'] + ": " + (remaining / 1000).toFixed(2) + '/' + (gpxRouteDistance / 1000).toFixed(2) + 'km<br>';
			   hinttext = hinttext + TIZEN_L10N['deviation'] + ": " + nearestPt.distance + 'm<p><p><p>' ;
			   
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
				   heading = google.maps.geometry.spherical.computeHeading(lastPosition, currentPos);				   				   
				   degree = 360 - heading;
			   }
		   
			   console.log("heading: " + heading);
			   console.log("degree: " + degree);
	//		   console.log("distance: " + distance);
			   
			   GeoMarker.setMarkerOptions({icon: {
				   'path': google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
				   'fillColor': '#4285F4',
				   'fillOpacity': 1,
				   'scale': 6,
				   'strokeColor': 'white',
				   'strokeWeight': 2,
				   'rotation' : heading,
			   }});
		   		   
			   document.getElementById("map_canvas").style.transform = "rotate(" + degree + "deg)";
		   }	
		   
		   localStorage.setItem("lastKnownPosition", JSON.stringify(currentPos.toJSON()));

		   if (localStorage.getItem("draw_trace") == "true") {
			   landPath.setPath(landPathCoordinates);
			   landPath.setMap(map);
		   }
    	   
	   };
	   
   function traceCurrentLocation() {
	   
	   document.getElementById("acquire_signal").innerHTML = TIZEN_L10N['wait_gps'] + '...<p><p><p>';
	   
	   GeoMarker = new GeolocationMarker();
	   GeoMarker.setCircleOptions({fillColor: '#808080'});
	   
	   if (localStorage.getItem("follow_heading") == "true")
		   GeoMarker.setMarkerOptions({icon: {
			   'path': google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
			   'fillColor': '#4285F4',
			   'fillOpacity': 1,
			   'scale': 6,
			   'strokeColor': 'white',
			   'strokeWeight': 2,
		   }});
	   
	   google.maps.event.addListener(GeoMarker, 'position_changed', positionChangedHandler);

	   google.maps.event.addListenerOnce(GeoMarker, 'position_changed', function() {
		   
    	   var currentPos = this.getPosition();
    	   if (currentPos == null)	   
    		   return;
    	   
		   document.getElementById("acquire_signal").innerHTML = '';
		   map.fitBounds(this.getBounds());
	   });
	   
	   google.maps.event.addListener(GeoMarker, 'geolocation_error', function(e) {
		   alert('There was an error obtaining your position. Message: ' + e.message);
	   });

	   GeoMarker.setMap(map);
	   console.log("geomarker finished");        	   
   } 
   
   function calculateRouteDistance() {
	   gpxRouteDistance = getRemainingDistance(0);
	   tizen.preference.setValue("gpxRouteDistance", gpxRouteDistance);
	   console.log("Distance of route: " + gpxRouteDistance);
   }

   function addMarkers(markerPoint) {
	       var marker = new google.maps.Marker({
    		   position: markerPoint.latlng,
    		   map: map
    	   });
	    
    	   var infowindow = new google.maps.InfoWindow({
    		   content: markerPoint.html,
    		   size: new google.maps.Size(50,50)
    	   });

    	   google.maps.event.addListener(marker, "click", function() {
    		   infowindow.open(map, marker);
    	   });	   
   }
   
   function loadGPXDataIntoGoogleMap(data) {

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

       var bounds = new google.maps.LatLngBounds();
       
       for (var k=0; k< routePoints.length; k++) 
    	   bounds.extend({lat: routePoints[k].lat, lng: routePoints[k].lng});
       
       map.fitBounds(bounds);       
       map.setCenter(bounds.getCenter());

	   var polyline = new google.maps.Polyline({
	        path: routePoints,
	        strokeColor: "#ff0000",
	        strokeWeight: 5,
	        map: map
	    });
	  
};

   
   function loadGPXFileIntoGoogleMap(data) {

             var parser = new GPXParser(data, map);
             parser.setTrackColour("#ff0000");     // Set the track line colour
             parser.setTrackWidth(5);          // Set the track line width
             parser.setMinTrackPointDelta(0.001);      // Set the minimum distance between track points
             parser.centerAndZoom(data);
             parser.addTrackpointsToMap();         // Add the trackpoints
             parser.addRoutepointsToMap();         // Add the routepoints
             parser.addWaypointsToMap();           // Add the waypoints
             routePoints = parser.getPointArray();
             console.log("routepoints");
             console.log(routePoints);
             routePointDistance = parser.getDistanceArray();
             console.log("routepointdistance");
             console.log(routePointDistance);
             calculateRouteDistance();
             elePoints = parser.getEleArray();
             console.log(elePoints);
             calculateEleProfile();
   };

   
   /* POPUP */
   /* POPUP */   
   /* POPUP */
   /* POPUP */
   
	
	function locationOnHandler() {
		
		if (localStorage.getItem("location_on") == 'true') {
			localStorage.setItem("location_on", 'false');
    		document.getElementById('location_on').setAttribute("data-title", TIZEN_L10N['show_current_position'] + ": " + TIZEN_L10N['off']);
    		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = TIZEN_L10N['show_current_position'] + ": " + TIZEN_L10N['off'];
    		document.getElementById("acquire_signal").innerHTML = '';
    		
    		if (GeoMarker!= null)
    			GeoMarker.setMap(null);

		} else if (localStorage.getItem("location_on") == 'false') {
			localStorage.setItem("location_on", 'true');
			document.getElementById('location_on').setAttribute("data-title", TIZEN_L10N['show_current_position'] + ": " + TIZEN_L10N['on'] );
    		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = TIZEN_L10N['show_current_position'] + ": " + TIZEN_L10N['on'];

			if (GeoMarker != null)
				GeoMarker.setMap(map);
			else 
				traceCurrentLocation();
		} 
		
		console.log("location on toggle clicked");
	}
	
	function followHeadingHandler() {
		
		console.log("follow_heading toggle clicked");

		if (localStorage.getItem("follow_heading") == 'true') {
			localStorage.setItem("follow_heading", 'false');
    		document.getElementById('follow_heading').setAttribute("data-title", TIZEN_L10N['map_orientation'] + ": " + TIZEN_L10N['north']  );
    		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = TIZEN_L10N['map_orientation'] + ": " + TIZEN_L10N['north'] ;
    		
    		if (GeoMarker != null)	    			
    			GeoMarker.setMarkerOptions({icon: {
    				'path': google.maps.SymbolPath.CIRCLE,
    				'fillColor': '#4285F4',
    				'fillOpacity': 1,
    				'scale': 6,
    				'strokeColor': 'white',
    				'strokeWeight': 2,
    				'rotation' : 0
    			}});
 		   
			document.getElementById("map_canvas").style.transform = "rotate(0deg)";

		} else if (localStorage.getItem("follow_heading") == 'false') {
			localStorage.setItem("follow_heading", 'true');
			document.getElementById('follow_heading').setAttribute("data-title", TIZEN_L10N['map_orientation'] + ": " + TIZEN_L10N['direction_of_travel']  );
    		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = TIZEN_L10N['map_orientation'] + ": " + TIZEN_L10N['direction_of_travel'];
    		
    		if (GeoMarker != null)
    			GeoMarker.setMarkerOptions({icon: {
				   'path': google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
				   'fillColor': '#4285F4',
				   'fillOpacity': 1,
				   'scale': 6,
				   'strokeColor': 'white',
				   'strokeWeight': 2
    			}});

		}     		
	};
	
	function drawTraceHandler() {
		console.log("draw_trace toggle clicked");
		
		if (localStorage.getItem("draw_trace") == 'true') {
			localStorage.setItem("draw_trace", 'false');
    		document.getElementById('draw_trace').setAttribute("data-title", TIZEN_L10N['trace_current_route'] + ": " + TIZEN_L10N['off'] );
       		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = TIZEN_L10N['trace_current_route'] + ": " + TIZEN_L10N['off'];
    		landPath.setMap(null);
		} else if (localStorage.getItem("draw_trace") == 'false') {
			localStorage.setItem("draw_trace", 'true');
			document.getElementById('draw_trace').setAttribute("data-title", TIZEN_L10N['trace_current_route'] + ": " + TIZEN_L10N['on'] );
	   		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = TIZEN_L10N['trace_current_route'] + ": " + TIZEN_L10N['on'];
    		landPath.setMap(map);
		}
	}

	return {
		locationOnHandler : locationOnHandler,
		followHeadingHandler : followHeadingHandler,
		drawTraceHandler : drawTraceHandler
	}

};

var my_google_map = google_map();
