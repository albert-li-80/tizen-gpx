(function(){
	
	var map;
	var landPath;
	var landPathCoordinates = [];
	var GeoMarker;
	var routePoints = [];
	var elePoints = [];
	var routePointDistance = [];
	var gpxRouteDistance = 0;
	var elePoints100 = new Array(100);
	
	/**
	 * page - More option page element
	 * popup - More option popup element for rectangular devices
	 * handler - Element for opening more option popup
	 * popupCircle - More option popup element for circular devices
	 * elSelector - Selector element in the circular popup
	 * selector - TAU selector instance
	 */
	var page = document,
		handler = page.querySelector("#settings_button"),
		popupCircle = page.querySelector("#moreoptionsPopupCircle"),
		elSelector = page.querySelector("#selector"),
		selector,
		clickHandlerBound;

	/* For Notification */
	
	var nextNotificationTime = tizen.time.getCurrentDateTime();
	var gpsCallbackInterval = 10000;
	var gpsSampleInterval = 10000;

			
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

	function onsuccessCB() {
	    console.log('gps started');
	}

	function onchangedCB(info) {
		
		var lat, lng;
		var latlng = null;
		
	    console.log('gps on change: ');
	    console.log(info);
	    
	    for (var index = 0; index < info.gpsInfo.length; index++) {
	    	console.log("latitude: " + info.gpsInfo[index].latitude);
	    	console.log("longitude: " + info.gpsInfo[index].longitude);

	    	lat = info.gpsInfo[index].latitude;
	    	lng = info.gpsInfo[index].longitude;

	    	if (lat != 200) {
	    		latlng = new google.maps.LatLng(lat, lng);
			    landPathCoordinates.push(latlng);	 
				localStorage.setItem("lastKnownPosition", latlng);
	    	}
	    }

	    var now = tizen.time.getCurrentDateTime();
	    console.log("Now " + now.toLocaleString());
	    console.log("NNT " + nextNotificationTime.toLocaleString());
	    var nearestPt;
	    
		if ((document.webkitHidden) && (latlng != null) && ((localStorage.getItem("off_track") != '0') ||  (localStorage.getItem("show_distance") == 'true')) && (routePoints != null) && (routePoints.length > 0)) {
	    	nearestPt = geolib.findNearest(latlng.toJSON(), routePoints, 0, 1);
	    	console.log("nearest :" + nearestPt.distance);
	    		    	
	    	if  (localStorage.getItem("show_distance") == 'true') {
	    		tizen.preference.setValue("nearestPoint", nearestPt.distance);
	    		tizen.preference.setValue("lastUpdateTime", JSON.stringify(new Date()));	
	    		
	    		var remainingDist = getRemainingDistance(nearestPt.key);
	    		console.log(remainingDist);
	    		tizen.preference.setValue("distanceRemaining", remainingDist);
	    	}
	    }
		
		if ((now.laterThan(nextNotificationTime)) && (document.webkitHidden) && (latlng != null) && (localStorage.getItem("off_track") != '0') && (routePoints != null) && (routePoints.length > 0)) {
			
			var off_track = localStorage.getItem("off_track");
			if (nearestPt.distance > off_track) {
				   
				try {
				      // Gets the current application information with tizen.application.getAppInfo
				      var myappInfo = tizen.application.getAppInfo();
				      
				      var notificationContent = 'You are off track by ' + nearestPt.distance + " meters";
				      var appControl = new tizen.ApplicationControl('http://tizen.org/appcontrol/operation/view',
                              null, null, null, null);
				      
				      var notificationDict = {
				    		  
				    		  content : notificationContent,
				    		  iconPath : myappInfo.iconPath,
				              vibration : true,
				              appControl: appControl,
				              appId : myappInfo.id };

				      var notification = new tizen.StatusNotification("SIMPLE",
				                  "GPX Tracker", notificationDict);

				      tizen.notification.post(notification);
				      nextNotificationTime = now.addDuration(new tizen.TimeDuration(30, "MINS"));
				      
				   } catch (err) {
					  console.log("Notification failed!");
				      console.log (err.name + ": " + err.message);
				   }
			   	}
		   }

	}

	function onerrorCB(error) {
	    console.log('Error occurred. Name:' + error.name + ', message: ' + error.message);
	}

    function getRegularLocation() {

	    nextNotificationTime = tizen.time.getCurrentDateTime();

    	var option = {
    	    'callbackInterval': gpsCallbackInterval,
    	    'sampleInterval': gpsSampleInterval
    	};
    	console.log("before setting HAM");
    	tizen.humanactivitymonitor.start('GPS', onchangedCB, onerrorCB, option);
    	console.log("after setting HAM");
    };
        
    function init() {
    	var screen_on = localStorage.getItem("screen_on");
    	
    	if (screen_on == null) {
    		localStorage.setItem("screen_on", "true");
    		screen_on = "true";
    	}

    	if (screen_on == "true") {
    		tizen.power.request("SCREEN", "SCREEN_NORMAL");
    	}
    	
    	var location_on = localStorage.getItem("location_on");
    	
    	if (location_on == null) {
    		localStorage.setItem("location_on", "true");
    		location_on = "true";
    	}

    	if (location_on == "true") 
    		document.getElementById("acquire_signal").innerHTML = 'Waiting for GPS Signal...<p><p><p>';

    	var follow_heading = localStorage.getItem("follow_heading");
    	
    	if (follow_heading == null) {
    		localStorage.setItem("follow_heading", "false");
    		follow_heading = "false";
    	}    

    	if (follow_heading == "true") 
    		document.getElementById("map_canvas").style.transition = "ease all 1s";

    	var draw_trace = localStorage.getItem("draw_trace");
    	
    	if (draw_trace == null) {
    		localStorage.setItem("draw_trace", "true");
    		draw_trace = "true";
    	}    

    	var center_on = localStorage.getItem("center_on");
    	
    	if (center_on == null) {
    		localStorage.setItem("center_on", "true");
    		center_on = "true";
    	}

    	var show_distance = localStorage.getItem("show_distance");
    	
    	if (show_distance == null) {
    		localStorage.setItem("show_distance", "true");
    		show_distance = "true";
    	}

    	var off_track = localStorage.getItem("off_track");
    	
    	if (off_track == null) {
    		localStorage.setItem("off_track", "0");
    		off_track = 0;
    	}
    };
    
    // Function Starts //
    
    function registerEventHandlers() {
    	// add eventListener for tizenhwkey
    	document.addEventListener('tizenhwkey', function(e) {
    		if(e.keyName == "back") {
    			
				var openDrawer = document.querySelector('.ui-popup-active');
				console.log("open?: "+ openDrawer);
				
				if (!openDrawer) {
					try {
						tau.openPopup("#sideBtnPopup");
					} catch (ignore) {
					}
				} else {
					tau.closePopup(popupCircle);
				}
    		}
    	});    	
    
    	// confirm exit
    	document.getElementById("sideBtn-ok").addEventListener("click", function(){
    		console.log('OK clicked');
			tizen.power.release("SCREEN");
			tizen.humanactivitymonitor.stop('GPS');
			tizen.application.getCurrentApplication().exit();
    	});

    	// cancel exit
    	document.getElementById("sideBtn-cancel").addEventListener("click", function(){
    		console.log('Cancel clicked');
    		tau.closePopup();    		
    	});

    	// cancel exit
    	document.getElementById("dismissBtn").addEventListener("click", function(){
    		console.log('Dismiss clicked');
    		tau.closePopup();    		
    	});
    	
    	// add eventListener for hidden
    	document.addEventListener('webkitvisibilitychange', function() {
    	   
    		/* Check whether the page is hidden */
            if ((!(document.webkitHidden)) && (localStorage.getItem("screen_on") == 'true')) {
				tizen.power.request("SCREEN", "SCREEN_NORMAL");
            } else {
				tizen.power.release("SCREEN");
            }
    	});    	

    	window.addEventListener('appcontrol', function onAppControl() {
    		console.log("inside app control");
//    	    var reqAppControl = tizen.application.getCurrentApplication.getRequestedAppControl();
//    	    if (reqAppControl) {
//    	        console.log("inside app control");
//    	    }
    	});
    };
    
    function getLastPosition() {
    	
    	var lastPosition = localStorage.getItem("lastKnownPosition");

    	console.log("Last Position: ");
    	console.log(lastPosition);
    	
    	if (lastPosition != null) {
    		var lat = lastPosition.split(",").shift();
    		lat = lat.substring(1);

    		var lng = lastPosition.split(",").pop();
    		lng = lng.substring(0,lng.length - 1);
    		
    		console.log("lat: ", lat);
    		console.log("lng: ", lng);

    		var latlng = new google.maps.LatLng(lat, lng);
    		return latlng;
    	}
    	else return null;
    }
    
    function initializeMap()
    {
//    	var lastPosition = localStorage.getItem("lastKnownPosition");
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
		   
		   landPathCoordinates.push(currentPos);
		   
		   if (localStorage.getItem("center_on") == "true")
			   map.setCenter(currentPos);

		   if ((localStorage.getItem("show_distance") == 'true') && (routePoints != null) && (routePoints.length > 0)) {
			   var nearestPt = geolib.findNearest(currentPos.toJSON(), routePoints, 0, 1);
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
		   
		   localStorage.setItem("lastKnownPosition", currentPos);

		   if (localStorage.getItem("draw_trace") == "true") {
			   landPath.setPath(landPathCoordinates);
			   landPath.setMap(map);
		   }
    	   
	   };
	   
   function traceCurrentLocation() {
	   
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

   function getRemainingDistance(point) {
	   var distance = 0;
	   
	   for (var i=point; i<routePointDistance.length; i++)
		   distance = distance + routePointDistance[i];   	
	   
	   return distance;
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

       map.setCenter(new google.maps.LatLng(routePoints[0].lat, routePoints[0].lng));
	   
	   var polyline = new google.maps.Polyline({
	        path: routePoints,
	        strokeColor: "#ff0000",
	        strokeWeight: 5,
	        map: map
	    });
	   


	    /*
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
       */
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
   
	/**
	 * Click event handler for opening more option popup
	 */
	function clickHandler() {
		if (tau.support.shape.circle) {
			tau.openPopup(popupCircle);
		} else {
//			tau.openPopup(popup);
		}
	}

	function registerPopupEvents() {

		var radius = window.innerHeight / 2 * 0.8;
		selector = tau.widget.Selector(elSelector, {itemRadius: radius});

		/**
		 * pagebeforeshow event handler
		 * Do preparatory works and adds event listeners
		 */
/*		page.addEventListener( "pagebeforeshow", function() {
			var radius = window.innerHeight / 2 * 0.8;

			clickHandlerBound = clickHandler.bind(null);
			handler.addEventListener("click", clickHandlerBound);
			if (tau.support.shape.circle) {
				selector = tau.widget.Selector(elSelector, {itemRadius: radius});
			}
		});
*/
    	document.getElementById("settings_button").addEventListener("click", function(){
    		console.log('settings clicked');
			tau.openPopup(popupCircle);    		
    	});
    	
		/**
		 * pagebeforehide event handler
		 * Destroys and removes event listeners
		 */
/*		page.addEventListener( "pagebeforehide", function() {
			tizen.power.release("SCREEN");
			handler.removeEventListener("click", clickHandlerBound);
			if (tau.support.shape.circle) {
				selector.destroy();
			}
		});
*/
		/**
		 * When user click the indicator of Selector, drawer will close.
		 */
		elSelector.addEventListener("click", function(event) {
			var target = event.target;

			if (tau.support.shape.circle) {
				// 'ui-selector-indicator' is default indicator class name of Selector component
				if (target.classList.contains("ui-selector-indicator")) {
					console.log(elSelector.querySelector(".ui-item-active").getAttribute("id"));
					
					switch(elSelector.querySelector(".ui-item-active").getAttribute("id")) {
				    case 'gpx_route':
				        gpxRouteHandler();
				        break;
				    case 'screen_on':
				        screenOnHandler();
				        break;
				    case 'location_on':
				        locationOnHandler();
				        break;
				    case 'follow_heading':
				        followHeadingHandler();
				        break;
				    case 'center_on':
				        centerOnHandler();
				        break;
				    case 'draw_trace':
				        drawTraceHandler();
				        break;
				    case 'show_distance':
				        showDistanceHandler();
				        break;
				    case 'off_track':
				        offTrackHandler();
				        break;
				    default:
				    	tau.closePopup(popupCircle);
					}
					
				}
			}
		});
	}
	
	/**
	 * Back key event handler
	 */
	
	function gpxRouteHandler(){
		console.log('files clicked');
		window.location.href = 'files.html';
	}
	
	function screenOnHandler(){
		console.log("screen on toggle clicked");
		
		if (localStorage.getItem("screen_on") == 'true') {
				localStorage.setItem("screen_on", 'false');
	    		document.getElementById('screen_on').setAttribute("data-title", "Screen: Normal" );
	    		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = "Screen: Normal";
    			tizen.power.release("SCREEN");
		} else if (localStorage.getItem("screen_on") == 'false') {
			localStorage.setItem("screen_on", 'true');
    		document.getElementById('screen_on').setAttribute("data-title", "Screen: Always On" );
    		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = "Screen: Always On";
			tizen.power.request("SCREEN", "SCREEN_NORMAL");
		} 
	}
	
	function locationOnHandler() {
		
		if (localStorage.getItem("location_on") == 'true') {
			localStorage.setItem("location_on", 'false');
    		document.getElementById('location_on').setAttribute("data-title", "Show Current Position: Off" );
    		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = "Show Current Position: Off";
    		
    		if (GeoMarker!= null)
    			GeoMarker.setMap(null);

		} else if (localStorage.getItem("location_on") == 'false') {
			localStorage.setItem("location_on", 'true');
			document.getElementById('location_on').setAttribute("data-title", "Show Current Position: On" );
    		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = "Show Current Position: On";

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
    		document.getElementById('follow_heading').setAttribute("data-title", "Map Orientation: North" );
    		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = "Map Orientation: North";
    		
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
			document.getElementById('follow_heading').setAttribute("data-title", "Map Orientation: Direction of Travel" );
    		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = "Map Orientation: Direction of Travel";
    		
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
    		document.getElementById('draw_trace').setAttribute("data-title", "Trace Current Route: Off" );
       		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = "Trace Current Route: Off";
    		landPath.setMap(null);
		} else if (localStorage.getItem("draw_trace") == 'false') {
			localStorage.setItem("draw_trace", 'true');
			document.getElementById('draw_trace').setAttribute("data-title", "Trace Current Route: On" );
	   		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = "Trace Current Route: On";
    		landPath.setMap(map);
		}
	}
	
	function centerOnHandler() {
		console.log("center_on toggle clicked");
		
		if (localStorage.getItem("center_on") == 'true') {
			localStorage.setItem("center_on", 'false');
    		document.getElementById('center_on').setAttribute("data-title", "Set Center to Current Location: Off" );
	   		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = "Set Center to Current Location: Off";
		} else if (localStorage.getItem("center_on") == 'false') {
			localStorage.setItem("center_on", 'true');
			document.getElementById('center_on').setAttribute("data-title", "Set Center to Current Location: On" );
	   		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = "Set Center to Current Location: On";
		} 
	}
	
	function showDistanceHandler() {
		console.log("show_distance toggle clicked");
		
		if (localStorage.getItem("show_distance") == 'true') {
			localStorage.setItem("show_distance", 'false');
    		document.getElementById('show_distance').setAttribute("data-title", "Follow Route: Off" );
			document.getElementById("acquire_signal").innerHTML = '';
	   		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = "Follow Route: Off";
		} else if (localStorage.getItem("show_distance") == 'false') {
			localStorage.setItem("show_distance", 'true');
			document.getElementById('show_distance').setAttribute("data-title", "Follow Route: On" );
	   		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = "Follow Route: On";
		} 
	}

	function offTrackHandler() {
		console.log("off_track toggle clicked");
		
		var off_track = localStorage.getItem("off_track");
		
		switch(off_track) {
			case '0': off_track = 10; break;
			case '10': off_track = 20; break;
			case '20': off_track = 50; break;
			case '50': off_track = 100; break;
			case '100': off_track = 200; break;
			case '200': off_track = 500; break;
			case '500': off_track = 0; break;
			default: off_track = 0;
		}
		
		if (off_track == 0) {
			document.getElementById('off_track').setAttribute("data-title", "Off Track Notification: Off" );
	   		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = "Off Track Notification: Off";			
		}
		else {
			document.getElementById('off_track').setAttribute("data-title", "Off Track Notification: " + off_track + " M");
	   		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = "Off Track Notification: " + off_track + " M";						
		}
		
		localStorage.setItem("off_track", off_track);
	}

    function registerSettingsEventHandlers() {
    	
    	document.getElementById("gpx_route").addEventListener("click", gpxRouteHandler);   	
    	document.getElementById("screen_on").addEventListener("click", screenOnHandler);
    	document.getElementById("location_on").addEventListener("click", locationOnHandler);
    	document.getElementById("follow_heading").addEventListener("click", followHeadingHandler);
    	document.getElementById("draw_trace").addEventListener("click", drawTraceHandler);
        document.getElementById("center_on").addEventListener("click", centerOnHandler);
    	document.getElementById("show_distance").addEventListener("click", showDistanceHandler);
    	document.getElementById("off_track").addEventListener("click", offTrackHandler);

    };

    function getGPXFile() {
    	var gpxFile = localStorage.getItem("currentGPXName");
    	
    	if (gpxFile != null)
    		tizen.preference.setValue('currentGPXName', gpxFile);
  		
    	if ((gpxFile != null) && (gpxFile != "")) {
    		document.getElementById('gpx_route').setAttribute("data-title", "Route: " + gpxFile);
      		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = "Route: " + gpxFile;
    	}
    	else {
    		document.getElementById('gpx_route').setAttribute("data-title", "Route: Not Set");
    		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = "Route: Not Set";
    	}
    };
    
    function setToggles() {
    	var screen_on = localStorage.getItem("screen_on");
    	var location_on = localStorage.getItem("location_on");
    	var follow_heading = localStorage.getItem("follow_heading");
    	var draw_trace = localStorage.getItem("draw_trace");
    	var center_on = localStorage.getItem("center_on");
    	var show_distance = localStorage.getItem("show_distance");
    	var off_track = localStorage.getItem("off_track");
    	
    	if (screen_on == "true")
    		document.getElementById('screen_on').setAttribute("data-title", "Screen: Always On" );
    	else 
    		document.getElementById('screen_on').setAttribute("data-title", "Screen: Normal" );

    	if (location_on == "true")
    		document.getElementById('location_on').setAttribute("data-title", "Show Current Position: On" );
    	else {
    		document.getElementById('location_on').setAttribute("data-title", "Show Current Position: Off" );
    	}

    	if (follow_heading == "true")
    		document.getElementById('follow_heading').setAttribute("data-title", "Map Orientation: Direction of Travel" );
    	else 
    		document.getElementById('follow_heading').setAttribute("data-title", "Map Orientation: North" );

    	if (draw_trace == "true")
    		document.getElementById('draw_trace').setAttribute("data-title", "Trace Current Route: On" );
    	else 
    		document.getElementById('draw_trace').setAttribute("data-title", "Trace Current Route: Off" );

    	if (center_on == "true")
    		document.getElementById('center_on').setAttribute("data-title", "Set Center to Current Location: On" );
    	else 
    		document.getElementById('center_on').setAttribute("data-title", "Set Center to Current Location: Off" );

    	if (show_distance == "true")
    		document.getElementById('show_distance').setAttribute("data-title", "Follow Route: On" );
    	else 
    		document.getElementById('show_distance').setAttribute("data-title", "Follow Route: Off" );

    	if (off_track == "0")
    		document.getElementById('off_track').setAttribute("data-title", "Off Track Notification: Off" );
    	else 
    		document.getElementById('off_track').setAttribute("data-title", "Off Track Notification: " + off_track + " M" );

    };
}());
