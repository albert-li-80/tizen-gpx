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
	var gpsSampleInterval = 5000;
	var notificationID = null;

	/* For Tracking */
	
	var landPathCoordinates = [];
	var routePoints = [];
	var elePoints = [];
	var routePointDistance = [];
	var gpxRouteDistance = 0;
	var elePoints100 = new Array(100);
	
	function init() {
    	var screen_on = localStorage.getItem("screen_on");
    	
    	if (screen_on == null) {
    		localStorage.setItem("screen_on", "false");
    		screen_on = "false";
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
    		document.getElementById("acquire_signal").innerHTML = TIZEN_L10N['wait_gps'] + '...<p><p><p>';

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

    	var map_engine = localStorage.getItem("map_engine");
    	
    	if (map_engine == null) {
    		localStorage.setItem("map_engine", "leaflet");
    		map_engine = 'leaflet';
    	}

    	var map_type = localStorage.getItem("map_type");
    	
    	if (map_type == null) {
    		localStorage.setItem("map_type", "outdoors");
    		map_type = 'outdoors';
    	}

    	// L10N
    	
    	for (var i = 0; i < document.querySelectorAll('[data-l10n]').length; i++) {
    	    var elem = document.querySelectorAll('[data-l10n]')[i];
    	    elem.innerHTML = TIZEN_L10N[elem.getAttribute('data-l10n')];
    	}
    	
	};
    
	
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
    	
    	var returnScreen = false;
    	
    	// add eventListener for hidden
    	document.addEventListener('webkitvisibilitychange', function() {
    	   
    		/* Check whether the page is hidden */
            if ((!(document.webkitHidden)) && (localStorage.getItem("screen_on") == 'true')) {
				tizen.power.request("SCREEN", "SCREEN_NORMAL");
            } else {
				tizen.power.release("SCREEN");
				
				if (!(tizen.power.isScreenOn())) {
					console.log("return screen on");
					returnScreen = true;
				}
				else  {
					console.log("return screen off");
					returnScreen = false;
				}
					
            }
    	});    	

    	tizen.power.setScreenStateChangeListener( function(prevState,currState){
	        if (currState === 'SCREEN_NORMAL' && prevState === 'SCREEN_OFF' && returnScreen) {
	          //when screen woke up
	          var app = tizen.application.getCurrentApplication();
	          tizen.application.launch(app.appInfo.id);
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
     
    function setToggles() {
    	var screen_on = localStorage.getItem("screen_on");
    	var location_on = localStorage.getItem("location_on");
    	var follow_heading = localStorage.getItem("follow_heading");
    	var draw_trace = localStorage.getItem("draw_trace");
    	var center_on = localStorage.getItem("center_on");
    	var show_distance = localStorage.getItem("show_distance");
    	var off_track = localStorage.getItem("off_track");
    	var map_engine = localStorage.getItem("map_engine");
    	var map_type = localStorage.getItem("map_type");
    	
    	if (screen_on == "true")
    		document.getElementById('screen_on').setAttribute("data-title", TIZEN_L10N['screen'] + ": " + TIZEN_L10N['always_on']);
    	else 
    		document.getElementById('screen_on').setAttribute("data-title", TIZEN_L10N['screen'] + ": " + TIZEN_L10N['normal'] );

    	if (location_on == "true")
    		document.getElementById('location_on').setAttribute("data-title", TIZEN_L10N['show_current_position'] + ": " + TIZEN_L10N['on']);
    	else {
    		document.getElementById('location_on').setAttribute("data-title", TIZEN_L10N['show_current_position'] + ": " + TIZEN_L10N['off']);
    	}

    	if (follow_heading == "true")
    		document.getElementById('follow_heading').setAttribute("data-title", TIZEN_L10N['map_orientation'] + ": " + TIZEN_L10N['direction_of_travel'] );
    	else 
    		document.getElementById('follow_heading').setAttribute("data-title", TIZEN_L10N['map_orientation'] + ": " + TIZEN_L10N['north']);

    	if (draw_trace == "true")
    		document.getElementById('draw_trace').setAttribute("data-title", TIZEN_L10N['trace_current_route'] + ": " + TIZEN_L10N['on'] );
    	else 
    		document.getElementById('draw_trace').setAttribute("data-title", TIZEN_L10N['trace_current_route'] + ": " + TIZEN_L10N['off'] );

    	if (center_on == "true")
    		document.getElementById('center_on').setAttribute("data-title", TIZEN_L10N['set_center'] + ": " + TIZEN_L10N['on'] );
    	else 
    		document.getElementById('center_on').setAttribute("data-title", TIZEN_L10N['set_center'] + ": " + TIZEN_L10N['off'] );

    	if (show_distance == "true")
    		document.getElementById('show_distance').setAttribute("data-title", TIZEN_L10N['follow_route'] + ": " + TIZEN_L10N['on'] );
    	else 
    		document.getElementById('show_distance').setAttribute("data-title", TIZEN_L10N['follow_route'] + ": " + TIZEN_L10N['off'] );

    	if (off_track == "0")
    		document.getElementById('off_track').setAttribute("data-title", TIZEN_L10N['off_track_notification'] + ": " + TIZEN_L10N['off'] );
    	else 
    		document.getElementById('off_track').setAttribute("data-title", TIZEN_L10N['off_track_notification'] + ": " + off_track + " M" );

    	if (map_engine == "google")
    		document.getElementById('map_engine').setAttribute("data-title", TIZEN_L10N['map_engine'] + ": " + TIZEN_L10N['google_online'] );
    	else if (map_engine == "leaflet")
    		document.getElementById('map_engine').setAttribute("data-title", TIZEN_L10N['map_engine'] + ": " + TIZEN_L10N['leaflet_offline']);

    	if (map_type == "cycle")
    		document.getElementById('map_type').setAttribute("data-title", TIZEN_L10N['map_type'] + ": " + TIZEN_L10N['hiking'] );
    	else if (map_type == "outdoors")
    		document.getElementById('map_type').setAttribute("data-title", TIZEN_L10N['map_type'] + ": " + TIZEN_L10N['cycling'] );

		document.getElementById('remove_file').setAttribute("data-title", TIZEN_L10N['remove_route']);

    };
    
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
				    case 'remove_file':
				        removeFileHandler();
				        break;
				    case 'map_engine':
				        mapEngineHandler();
				        break;
				    case 'map_type':
				        mapTypeHandler();
				        break;
				    default:
				    	tau.closePopup(popupCircle);
					}
					
				}
			}
		});
	}

    function getGPXFile() {
    	var gpxFile = localStorage.getItem("currentGPXName");
    	
    	if (gpxFile != null)
    		tizen.preference.setValue('currentGPXName', gpxFile);
    	else {
    		tizen.preference.setValue('currentGPXName', '');    		
		}
  		
    	if ((gpxFile != null) && (gpxFile != "")) {
    		document.getElementById('gpx_route').setAttribute("data-title", TIZEN_L10N['route'] + ": " + gpxFile);
      		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = TIZEN_L10N['route'] + ": " + gpxFile;
    	}
    	else {
    		document.getElementById('gpx_route').setAttribute("data-title", TIZEN_L10N['route'] + ": " + TIZEN_L10N['not_set']);
    		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = TIZEN_L10N['route'] + ": " + TIZEN_L10N['not_set'];
    	}
    };

    function registerSettingsEventHandlers() {
    	
    	document.getElementById("gpx_route").addEventListener("click", gpxRouteHandler);   	
    	document.getElementById("screen_on").addEventListener("click", screenOnHandler);
    	document.getElementById("location_on").addEventListener("click", locationOnHandler);
    	document.getElementById("follow_heading").addEventListener("click", followHeadingHandler);
    	document.getElementById("draw_trace").addEventListener("click", drawTraceHandler);
        document.getElementById("center_on").addEventListener("click", centerOnHandler);
    	document.getElementById("show_distance").addEventListener("click", showDistanceHandler);
    	document.getElementById("off_track").addEventListener("click", offTrackHandler);
    	document.getElementById("remove_file").addEventListener("click", removeFileHandler);
    	document.getElementById("map_engine").addEventListener("click", mapEngineHandler);
    	document.getElementById("map_type").addEventListener("click", mapTypeHandler);
    };

	function removeFileHandler() {
		console.log("remove_file toggle clicked");
		window.location.href = 'removefile.html';
	}

	function mapEngineHandler() {
		console.log("map_engine toggle clicked");
		
		if (localStorage.getItem("map_engine") == 'google') {
			localStorage.setItem("map_engine", 'leaflet');
    		document.getElementById('map_engine').setAttribute("data-title", TIZEN_L10N['map_engine'] +  ": " + TIZEN_L10N['leaflet_offline'] );
	   		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = TIZEN_L10N['map_engine'] +  ": " + TIZEN_L10N['leaflet_offline'];
			window.location.href = 'index.html';
		} else if (localStorage.getItem("map_engine") == 'leaflet') {
			localStorage.setItem("map_engine", 'google');
			document.getElementById('map_engine').setAttribute("data-title", TIZEN_L10N['map_engine'] + ": " + TIZEN_L10N['google_online'] );
	   		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = TIZEN_L10N['map_engine'] + ": " + TIZEN_L10N['google_online'];
			window.location.href = 'index.html';
		} 
	}

	function mapTypeHandler() {
		console.log("map_type toggle clicked");
		
		if (localStorage.getItem("map_type") == 'cycle') {
			localStorage.setItem("map_type", 'outdoors');
    		document.getElementById('map_type').setAttribute("data-title", TIZEN_L10N['map_type'] + ": " + TIZEN_L10N['hiking'] );
	   		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = TIZEN_L10N['map_type'] + ": " + TIZEN_L10N['hiking'];
			window.location.href = 'index.html';
		} else if (localStorage.getItem("map_type") == 'outdoors') {
			localStorage.setItem("map_type", 'cycle');
			document.getElementById('map_type').setAttribute("data-title", TIZEN_L10N['map_type'] + ": " + TIZEN_L10N['cycling'] );
	   		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = TIZEN_L10N['map_type'] + ": " + TIZEN_L10N['cycling'];
			window.location.href = 'index.html';
		} 
	}

	function centerOnHandler() {
		console.log("center_on toggle clicked");
		
		if (localStorage.getItem("center_on") == 'true') {
			localStorage.setItem("center_on", 'false');
    		document.getElementById('center_on').setAttribute("data-title", TIZEN_L10N['set_center'] + ": " + TIZEN_L10N['off'] );
	   		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = TIZEN_L10N['set_center'] + ": " + TIZEN_L10N['off'];
		} else if (localStorage.getItem("center_on") == 'false') {
			localStorage.setItem("center_on", 'true');
			document.getElementById('center_on').setAttribute("data-title", TIZEN_L10N['set_center'] + ": " + TIZEN_L10N['on'] );
	   		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = TIZEN_L10N['set_center'] + ": " + TIZEN_L10N['on'];
		} 
	}
	
	function showDistanceHandler() {
		console.log("show_distance toggle clicked");
		
		if (localStorage.getItem("show_distance") == 'true') {
			localStorage.setItem("show_distance", 'false');
    		document.getElementById('show_distance').setAttribute("data-title", TIZEN_L10N['follow_route'] + ": " + TIZEN_L10N['off']  );
			document.getElementById("acquire_signal").innerHTML = '';
	   		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = TIZEN_L10N['follow_route'] + ": " + TIZEN_L10N['off'] ;
		} else if (localStorage.getItem("show_distance") == 'false') {
			localStorage.setItem("show_distance", 'true');
			document.getElementById('show_distance').setAttribute("data-title", TIZEN_L10N['follow_route'] + ": " + TIZEN_L10N['on']  );
	   		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = TIZEN_L10N['follow_route'] + ": " + TIZEN_L10N['on'];
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
			document.getElementById('off_track').setAttribute("data-title", TIZEN_L10N['off_track_notification'] + ": " + TIZEN_L10N['off'] );
	   		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = TIZEN_L10N['off_track_notification'] + ": " + TIZEN_L10N['off'];			
		}
		else {
			document.getElementById('off_track').setAttribute("data-title", TIZEN_L10N['off_track_notification'] + ": " + off_track + " M");
	   		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = TIZEN_L10N['off_track_notification'] + ": " + off_track + " M";						
		}
		
		localStorage.setItem("off_track", off_track);
	}

	function screenOnHandler(){
		console.log("screen on toggle clicked");
		
		if (localStorage.getItem("screen_on") == 'true') {
				localStorage.setItem("screen_on", 'false');
	    		document.getElementById('screen_on').setAttribute("data-title", TIZEN_L10N['screen'] + ": " + TIZEN_L10N['normal'] );
	    		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = TIZEN_L10N['screen'] + ": " + TIZEN_L10N['normal'];
    			tizen.power.release("SCREEN");
		} else if (localStorage.getItem("screen_on") == 'false') {
			localStorage.setItem("screen_on", 'true');
    		document.getElementById('screen_on').setAttribute("data-title", TIZEN_L10N['screen'] + ": " + TIZEN_L10N['always_on']);
    		elSelector.querySelector(".ui-selector-indicator-text").innerHTML = TIZEN_L10N['screen'] + ": " + TIZEN_L10N['always_on'];
			tizen.power.request("SCREEN", "SCREEN_NORMAL");
		} 
	}

	function gpxRouteHandler(){
		console.log('files clicked');
		window.location.href = 'files.html';
	}

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
    
    function locationOnHandler() {
    	if ((localStorage.getItem("map_engine") == null) || (localStorage.getItem("map_engine") == 'google')) 
    		my_google_map.locationOnHandler();
    	else if ((localStorage.getItem("map_engine") != null) && (localStorage.getItem("map_engine") == 'leaflet')) 
    		my_leaflet_map.locationOnHandler();
    }
    
    function followHeadingHandler() {
    	if ((localStorage.getItem("map_engine") == null) || (localStorage.getItem("map_engine") == 'google')) 
    		my_google_map.followHeadingHandler();
    	else if ((localStorage.getItem("map_engine") != null) && (localStorage.getItem("map_engine") == 'leaflet')) 
    		my_leaflet_map.followHeadingHandler();
    }

    function drawTraceHandler() {
    	if ((localStorage.getItem("map_engine") == null) || (localStorage.getItem("map_engine") == 'google')) 
    		my_google_map.drawTraceHandler();
    	else if ((localStorage.getItem("map_engine") != null) && (localStorage.getItem("map_engine") == 'leaflet')) 
    		my_leaflet_map.drawTraceHandler();
    }
    
    // ** GET REGULAR LOCATION ** //
    
	function onsuccessCB() {
	    console.log('gps started');
	}

	function onchangedCB(info) {
		
		var lat, lng, acc;
		var latlng = null;
		
	    console.log('gps on change: ');
	    console.log(info);
	    
	    for (var index = 0; index < info.gpsInfo.length; index++) {
	    	console.log("latitude: " + info.gpsInfo[index].latitude);
	    	console.log("longitude: " + info.gpsInfo[index].longitude);

	    	lat = info.gpsInfo[index].latitude;
	    	lng = info.gpsInfo[index].longitude;
	    	acc = info.gpsInfo[index].errorRange;
	    	
	    	if (lat != 200) {

	    		latlng = {lat: lat, lng: lng};
				  		
			    landPathCoordinates.push(latlng);	 
				localStorage.setItem("lastKnownPosition", JSON.stringify(latlng));
				
	    	}
	    }

	    var now = tizen.time.getCurrentDateTime();
	    console.log("Now " + now.toLocaleString());
	    console.log("NNT " + nextNotificationTime.toLocaleString());
	    var nearestPt;
	    
		if ((latlng != null) && ((localStorage.getItem("off_track") != '0') ||  (localStorage.getItem("show_distance") == 'true')) && (routePoints != null) && (routePoints.length > 0)) {
	    	nearestPt = geolib.findNearest(latlng, routePoints, 0, 1);
	    	console.log("nearest :" + nearestPt.distance);
	    		    	
	    	if  (localStorage.getItem("show_distance") == 'true') {
	    		tizen.preference.setValue("nearestPoint", nearestPt.distance);
	    		tizen.preference.setValue("lastUpdateTime", JSON.stringify(new Date()));	
	    		
	    		var remainingDist = getRemainingDistance(nearestPt.key);
	    		console.log(remainingDist);
	    		tizen.preference.setValue("distanceRemaining", remainingDist);
	    	}
	    }

		if ((latlng != null) && (tizen.power.isScreenOn())) {			
			if ((localStorage.getItem("map_engine") != null) && (localStorage.getItem("map_engine") == 'leaflet')) 
	    		my_leaflet_map.updateLocation(latlng, acc);			
		}
		
		if ((latlng != null) && (localStorage.getItem("off_track") != '0') && (routePoints != null) && (routePoints.length > 0)) {
			
			var off_track = localStorage.getItem("off_track");
			if (nearestPt.distance > off_track) {
				
				if ((now.laterThan(nextNotificationTime)) && (document.webkitHidden)) {

					var notification = null;
					
					if (notificationID != null) {
						try {
							notification = tizen.notification.get(notificationID);
						} catch(err) {
							console.log("Notification not found!");
							console.log (err.name + ": " + err.message);
							notificationID = null;
						}
					}
							
					if (notification != null) {
					
						notification.content = TIZEN_L10N['off_route_content'] + '. ' + TIZEN_L10N['distance_to_nearest_point'] + ': ' + nearestPt.distance + "M";
						tizen.notification.update(notification);
						notificationID = notification.id;
						nextNotificationTime = now.addDuration(new tizen.TimeDuration(30, "SECS"));
						
					} else { 

						try {
							// Gets the current application information with tizen.application.getAppInfo
							var myappInfo = tizen.application.getAppInfo();
				      
							var notificationContent = TIZEN_L10N['off_route_content'] + '. ' + TIZEN_L10N['distance_to_nearest_point'] + ': ' + nearestPt.distance + "M";
							var appControl = new tizen.ApplicationControl('http://tizen.org/appcontrol/operation/view',
									null, null, null, null);
				      
							var notificationDict = {
				    		  
				    		  content : notificationContent,
				    		  iconPath : myappInfo.iconPath,
				              vibration : true,
				              appControl: appControl,
				              appId : myappInfo.id };

							notification = new tizen.StatusNotification("SIMPLE",
				                  "GPX Tracker", notificationDict);

							tizen.notification.post(notification);
				      
							notificationID = notification.id;
							nextNotificationTime = now.addDuration(new tizen.TimeDuration(30, "SECS"));
				      
						} catch (err) {
							console.log("Notification failed!");
							console.log (err.name + ": " + err.message);
						}
					}
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
    	    callbackInterval: gpsCallbackInterval,
    	    sampleInterval: gpsSampleInterval
    	};
    	console.log("before setting HAM");
    	tizen.humanactivitymonitor.start('GPS', onchangedCB, onerrorCB, option);
    	console.log("after setting HAM");
    };
    
    // Function Starts //
    
    function getLastPosition() {
    	
    	var lastPosition = localStorage.getItem("lastKnownPosition");

    	console.log("Last Position: ");
    	console.log(lastPosition);
    	
    	if (lastPosition != null) {
    		return JSON.parse(lastPosition);
    	}
    	else return null;
    }
    
    function getRemainingDistance(point) {
 	   var distance = 0;
 	   
 	   for (var i=point; i<routePointDistance.length; i++)
 		   distance = distance + routePointDistance[i];   	
 	   
 	   return distance;
    }