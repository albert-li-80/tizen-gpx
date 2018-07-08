/*
 * We must declare global variables to let the validator know the
 * global variables we use.
 * To declare global variables, write global variables along with
 * default values inside a comment on top of each source code.
 * The comment should start with the keyword, global.
 */

(function() {
	var received_time = null;
	var interval_id = null;
	var currentGPXName = null;
	var distanceRemaining = null;
	var gpxRouteDistance = null;
	var oldDistanceRemaining = null;
	
    /**
     * Launches the world clock application
     * @private
     */
    function launchApp(){
    	console.log("inside launch app");

        var app = window.tizen.application.getCurrentApplication();
        var appId = app.appInfo.id.substring(0, (app.appInfo.id.lastIndexOf('.')) );
        window.tizen.application.launch(appId);
    }

    /**
     * Handles the back key event
     * @private
     */
    function keyEventHandler(event) {
        if (event.keyName === "back") {
            try {
                tizen.application.getCurrentApplication().exit();
            } catch (ignore) {}
        }
    }

    function setWidget() {
    	console.log("inside setwidget");
    	
    	var nearestPoint, lastUpdateTime;
    	
    	if (tizen.preference.exists('currentGPXName'))
    		currentGPXName = tizen.preference.getValue('currentGPXName');
    	
  		if ((currentGPXName != null) && (currentGPXName != ''))
  	        document.getElementById('route-name').textContent = currentGPXName;
  		else 
  			document.getElementById('route-name').textContent = 'GPX Tracker';

  		if (tizen.preference.exists('nearestPoint'))
  			nearestPoint = tizen.preference.getValue('nearestPoint');

  		if ((nearestPoint != null) && (nearestPoint != ''))
  	        document.getElementById('distance').textContent = nearestPoint;
  		else 
  			document.getElementById('distance').textContent = '-';

 		if (tizen.preference.exists('distanceRemaining'))
 			distanceRemaining = tizen.preference.getValue('distanceRemaining') / 1000;

 		if (tizen.preference.exists('gpxRouteDistance'))
 			gpxRouteDistance = tizen.preference.getValue('gpxRouteDistance') / 1000;
 		
 		if ((distanceRemaining != null) && (distanceRemaining != '')) {
  			var hinttext = distanceRemaining.toFixed(1) + ' / ' + gpxRouteDistance.toFixed(1);
  	        document.getElementById('remaining').textContent = hinttext;
  		}
  		else 
  			document.getElementById('remaining').textContent = '-';
  		
  		if (tizen.preference.exists('lastUpdateTime'))
  			received_time = tizen.preference.getValue('lastUpdateTime');
  		
  	    getLastUpdateTime();  
    }
    
    /**
     * Initializes the application
     * @private
     */
    
    function getLastUpdateTime() {
    	
    	if ((received_time != null) && (received_time != '')) {
    	
    		var update_time = new Date(JSON.parse(received_time));
    		var time_diff = new Date(new Date() - update_time);
    		var hours = time_diff.getUTCHours();
    		var minutes = time_diff.getMinutes();
    		var seconds = time_diff.getSeconds();
    		document.getElementById('last_update').textContent = TIZEN_L10N['last_updated'] + ': ' + hours + 'h ' + minutes + 'm ' + seconds + 's ago';   
    	}
    	else if (currentGPXName == null)
    		document.getElementById('last_update').textContent = TIZEN_L10N['set_route'];
    	else
    		document.getElementById('last_update').textContent = TIZEN_L10N['no_data'];
    }
    
    function setPreferenceListeners() {

    	var listener = function(data) {
            console.log('Preference with the key: ' + data.key + ' has a new value: ' + data.value);

            switch (data.key) {
            	case 'currentGPXName':
            		currentGPXName = data.value;

              		if ((currentGPXName != null) && (currentGPXName != ''))
              			document.getElementById('route-name').textContent = data.value; 
              		else 
              			document.getElementById('route-name').textContent = 'GPX Tracker';
                            		
              		break;
            	case 'nearestPoint':
            		document.getElementById('distance').textContent = data.value; break;
            	case 'distanceRemaining':
             		
             		distanceRemaining = data.value / 1000;
             		if (tizen.preference.exists('gpxRouteDistance'))
             			gpxRouteDistance = tizen.preference.getValue('gpxRouteDistance') / 1000;
             		var hinttext = distanceRemaining.toFixed(2) + ' / ' + gpxRouteDistance.toFixed(2);
              	    document.getElementById('remaining').textContent = hinttext; 
              	    
              	    if ((oldDistanceRemaining == null) || ((oldDistanceRemaining - distanceRemaining) > (gpxRouteDistance / 100)))
              	    	drawElevationProfile();
              	    break;
 
            	case 'GPXElePoint100':             		
            		drawElevationProfile(); break;             	    
            	
            	case 'lastUpdateTime':
            		received_time = data.value;
            		getLastUpdateTime(); break;
            	default: 
            };
    	};
    	
    	if (!(tizen.preference.exists('currentGPXName')))
    		tizen.preference.setValue('currentGPXName', '');
    	
    	tizen.preference.setChangeListener('currentGPXName', listener);

    	if (!(tizen.preference.exists('nearestPoint')))
    		tizen.preference.setValue('nearestPoint', '');
    	
    	tizen.preference.setChangeListener('nearestPoint', listener);

    	if (!(tizen.preference.exists('distanceRemaining')))
    		tizen.preference.setValue('distanceRemaining', '');
    	
    	tizen.preference.setChangeListener('distanceRemaining', listener);

    	if (!(tizen.preference.exists('GPXElePoint100')))
    		tizen.preference.setValue('GPXElePoint100', '');
    	
    	tizen.preference.setChangeListener('GPXElePoint100', listener);
    	
    	if (!(tizen.preference.exists('lastUpdateTime')))
    		tizen.preference.setValue('lastUpdateTime', '');
    	
    	tizen.preference.setChangeListener('lastUpdateTime', listener);
    };
    

    /* Define the event handler in the main.js file */
    function visibilitychange() {
        if (document.visibilityState === 'hidden') {
        	clearInterval(interval_id);
            /* Store shared data */
        } else {
        	interval_id = setInterval(getLastUpdateTime, 1000);
        }
    }
    
    function toggleToElevation(ev) {
    	console.log("inside toggle to ele");
    
    	document.getElementById('elevation_profile_head').style.display = 'block';
    	document.getElementById('info').style.display = 'none';
    	ev.stopPropagation();
    }

    function toggleToInfo(ev) {
    	console.log("inside toggle to info");
    	document.getElementById('info').style.display = 'block';
    	document.getElementById('elevation_profile_head').style.display = 'none';
    	ev.stopPropagation();
    }
    
    function drawElevationProfile() {
    	
    	var elepoints;
    	var maxEle = 0;
    	var elearray = [];
    	
    	if (tizen.preference.exists('GPXElePoint100')) {
     		elearray = JSON.parse(tizen.preference.getValue('GPXElePoint100'));
    		maxEle = tizen.preference.getValue('GPXMaxEle');
    	}
    	
    	var node = document.getElementById('elevation_profile');

    	if (maxEle != 0) {
    		for (var i=0; i< 100 ; i++) {
    			console.log("i: " + i + " elearray" + elearray[i]);
    			document.getElementById('s' + (i+1).toString()).style.height = elearray[i]/maxEle*100 + '%';
    			if ((distanceRemaining!= null) && ((gpxRouteDistance - distanceRemaining) > (gpxRouteDistance / 100 * i)))
    				document.getElementById('s' + (i+1).toString()).style.backgroundColor = "blue";
    		}
    		
    		oldDistanceRemaining = distanceRemaining;
    		
     		if (tizen.preference.exists('gpxRouteDistance'))
     			gpxRouteDistance = tizen.preference.getValue('gpxRouteDistance') / 1000;
     		
     		var hinttext = "Dist: " + (Math.round(gpxRouteDistance * 100) / 100) + "KM / " + "Max. Ele: " + Math.round(maxEle) + "M";
     		console.log("text " + hinttext);
     		document.getElementById('elevation_info').textContent = hinttext;
    	}
    	else document.getElementById('elevation_info').textContent = TIZEN_L10N['no_route_info'];
    }
    	    	
    function init() {
    	
    	// L10N
    	
    	var label = document.getElementById('label_deviation');
    	label.textContent = TIZEN_L10N[label.getAttribute('data-l10n')];

    	var label = document.getElementById('label_dist_rem');
    	label.textContent = TIZEN_L10N[label.getAttribute('data-l10n')];
    	
        var content_box = document.getElementById('elevation_profile_head');
        content_box.style.display = 'none';
        
		setWidget();
		console.log("after set widget");

		drawElevationProfile();
		console.log("after draw ele");
		document.getElementById('page-clock').addEventListener('click', launchApp);
		console.log("after set page clock listener");
//        window.addEventListener('tizenhwkey', keyEventHandler);
		console.log("after back listening");
        document.addEventListener('visibilitychange', visibilitychange);
		console.log("after vis change");

        document.getElementById("info").addEventListener('click', toggleToElevation, true);
        document.getElementById("elevation_profile_head").addEventListener('click', toggleToInfo, true);

		console.log("after toggle");

        setPreferenceListeners();
		console.log("after preference list");

    }

    window.onload = init();
}());
