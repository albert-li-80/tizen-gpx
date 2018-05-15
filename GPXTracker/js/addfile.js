(function() {
	
	var distance_array = [];
	var ele_array = [];
	var gpxRouteDistance = 0;
	
    // initialize with a little help of jQuery
    $(document).ready(function() {
    	console.log("init: files ready");
    	
    	if (document.title == "Files") {
    		getGPXFilelist();
    		registerFileEventHandlers();
    	} else
    		registerEventHandlers();
    });
    
    function getGPXFilelist() {
    	
    	var gpxFileList = localStorage.getItem("gpxFilelist");
		var innerHTML = '';
		var d1 = document.getElementById("filelist");
		
    	console.log("getGPXFilelist");
    	
    	if (gpxFileList != null) {
    		
    		var parsedFileList = JSON.parse(gpxFileList);  	
    	
    		for (var i = 0; i < parsedFileList.length; i++) {
    			console.log("File " + i + ":" + parsedFileList[i].file);
    			console.log("File " + i + ":" + parsedFileList[i].filename);
    			console.log("File " + i + ":" + parsedFileList[i].status);
    			
    			if (parsedFileList[i].status == "A") {
    				
    				var check = '';    				
    				if ((localStorage.getItem("currentGPXID") != null) && (i == localStorage.getItem("currentGPXID")) && (localStorage.getItem("currentGPXID") != ""))
    					check = ' checked="checked"';
    		
    				innerHTML = innerHTML + '<li class="li-has-radio" value="' + i + '"><label><div class="ui-marquee ui-marquee-gradient">' + parsedFileList[i].file + '</div><input type="radio" name="radio-sample"' + check + '/></label></li>';
    			}
    		}

    		if (innerHTML == '')
    			innerHTML = '<li class="li-has-multiline"><a href="#">No Files Exist.</a></li>';
 
    	} else {
    		innerHTML = '<li><a href="#">No Routes</a></li>';
		}

		console.log(innerHTML);    		
		d1.insertAdjacentHTML('afterbegin', innerHTML);
    }
    
    function registerFileEventHandlers() {

    	/**
    	 * Back key event handler
    	 */
    	
    	window.addEventListener('tizenhwkey', function(ev) {
		if ((ev.keyName === "back") && (document.title == "Files")) {
			localStorage.setItem("firstPass", "N");
			window.location.href = 'index.html';
//			window.history.back();
		}
    	});

    	
    	/**
    	 * GPX File event handler
    	 */

    	var userSelection = document.getElementsByClassName('li-has-radio');
    	var clicked = false;
    	
    	for(var i = 0; i < userSelection.length; i++) {
    		userSelection[i].addEventListener("click", function() {
    			
    			if (clicked) return;
    			
    			clicked = true;
    			var index = this.getAttribute("value");
    			console.log(index);

    	    	var gpxFileList = localStorage.getItem("gpxFilelist");
    	    	var parsedFileList = JSON.parse(gpxFileList);
     			
        		localStorage.setItem("currentGPXID", index);
        		localStorage.setItem("currentGPXName", parsedFileList[index].file);
        		localStorage.setItem("currentGPXFilename", parsedFileList[index].filename);
        		        		
        		// Add an event listener
        		document.addEventListener("setFileComplete", function(e) {
        			console.log("back to event");   			
        			if ((e.detail != null) && (e.detail != '')) {
        					console.log("infofile: " + e.detail);
        					console.log("index: " + index);
        					
//        					var gpxFileList = localStorage.getItem("gpxFilelist");
//        	    	    	var parsedFileList = JSON.parse(gpxFileList);        	    	    	
        					console.log("list before: " + parsedFileList[index]);
        					
        					parsedFileList[index].infofile = e.detail;
        					console.log("list after: " + parsedFileList[index]);
        					localStorage.setItem("gpxFilelist", JSON.stringify(parsedFileList));
        				}
        			console.log("back to event 2");
        		    document.getElementById("file_popup_content").innerHTML = "Route has been set to " + parsedFileList[index].file;
            		tau.openPopup("#file_popup");
        		    
    			    setTimeout(function(){ 
    		    		tau.closePopup();},	 // Alert Popup Toast
    		    		1000);
            		
        			localStorage.setItem("firstPass", "N");
        			window.location.href = 'index.html';
        		});

        		if ((parsedFileList[index].infofile == null) || (parsedFileList[index].infofile == ''))
        			parseXMLfile(parsedFileList[index].filename);
        		else {
        			
        			// Create the event
        			var event = new CustomEvent("setFileComplete", null);

        			// Dispatch/Trigger/Fire the event
        			document.dispatchEvent(event);
        		}
    		})
    	}

    	/**
    	 * Add File event handler
    	 */
    	
    	document.getElementById("add_file_btn").addEventListener("click", function(){
    		console.log("add file button clicked");    		
    		window.location.href = 'addfile.html';
    	});
    	
    	var listHelper;
    	
    	document.getElementById('files_page').addEventListener('pageshow', function() {
    		var list = document.getElementById('filelist');
    		var listHelper = tau.helper.SnapListMarqueeStyle.create(list, {marqueeDelay: 1000});
    	});

    	document.getElementById('files_page').addEventListener('pagehide', function() {
    	    listHelper.destroy();
    	});
    	    	
    };
    
    // End files.js
	/*
    // initialize with a little help of jQuery
    $(document).ready(function() {
    	console.log("init: addfiles ready");
    	registerEventHandlers();
    });
    */
    function calculateEleProfile() {
    	
    	var elePoints100 = new Array(100);
    	var maxElePoint = 0;
    	
    	for (var i = 0; i< ele_array.length; i++)
    		if (Number(ele_array[i]) > maxElePoint) maxElePoint = Number(ele_array[i]);

    	console.log("max ele: " + maxElePoint);

    	if (maxElePoint == 0) {
    		for (var i = 0; i< elePoints100.length; i++)
    			elePoints100[i] = 0;
    	} else {
    		
    		elePoints100[0] = ele_array[0];
    		elePoints100[99] = ele_array[ele_array.length-1];
    	
    		var j = 0;
    		var tmpDistance = 0;
		
    		for (var i=1; i< 99; i++) {
    			while (elePoints100[i] == null) {    			
    				console.log("i: " + i + " j: "+ j + " tmpd: " + tmpDistance + " eva: " + (gpxRouteDistance / 100 * i));
    				if ((tmpDistance + distance_array[j]) > (gpxRouteDistance / 100 * i)) 
    					elePoints100[i] = ele_array[j];
    				else {
    					tmpDistance = tmpDistance + distance_array[j];
    					j++;
    				}
    			}
    		}
    	}		
    	console.log(elePoints100);
    	
    	return {
    		maxElePoint : maxElePoint,
    		elePoints100 : elePoints100
    	}
    }

    function getRemainingDistance(point) {
 	   var distance = 0;
 	   
 	   for (var i=point; i<distance_array.length; i++)
 		   distance = distance + distance_array[i];   	
 	   
 	   return distance;
    }
    
    function calculateRouteDistance() {
 	   var gpxRouteDistance = getRemainingDistance(0);
 	   console.log("Distance of route: " + gpxRouteDistance);
 	   return gpxRouteDistance;
    }
    
	function parseGpxXmlToData(file) {
		console.log('inside parseGpxXmlToData');
		file.readAsText(function(data) { 
			try {
				var xmlDoc = jQuery.parseXML(data); 
				console.log("xml data loaded"); 
				
	             var xml_parser = new GPXFileParser(xmlDoc);
	             xml_parser.addTrackpoints();        	// Add the trackpoints
	             
	             var point_array = xml_parser.getPointArray();
	             console.log('Point array');
	             console.log(JSON.stringify(point_array));
	             
	             if (point_array.length == 0)
	            	 xml_parser.addRoutepoints();			// Add the routes only if trackpoints does not exit
	             
	             xml_parser.addWaypoints();				// Add the waypoints

	             console.log('Final Point array');
	             console.log(JSON.stringify(point_array));
	             
	             var marker_array = xml_parser.getMarkerArray();
	             console.log('Marker array');
	             console.log(JSON.stringify(marker_array));

	             distance_array = xml_parser.getDistanceArray();
	             console.log('Distance array');
	             console.log(distance_array);
	             
	             ele_array = xml_parser.getEleArray();
	             console.log('Ele Array');
	             console.log(ele_array);
	             
	             gpxRouteDistance = calculateRouteDistance();

	             var eleObj = new calculateEleProfile();
	             console.log("maxElePoint: " + eleObj.maxElePoint);
	             console.log("elePoints100: " + JSON.stringify(eleObj.elePoints100));
	             var map_info = {points: point_array, distances: distance_array, markers: marker_array, elevations: ele_array, routeDistance: gpxRouteDistance, maxElePoint: eleObj.maxElePoint, elePoints100: eleObj.elePoints100};
	             
	             console.log("map_info");
	             console.log(JSON.stringify(map_info));
	             
	             var newFile;
	             tizen.filesystem.resolve("wgt-private", function(dir) 
	                 {
	                    newFile = dir.createFile((file.name).replace(/[^\w\s]/gi, '') + ".txt");
	                    newFile.openStream(
	                     "w",
	                     function(fs) {
	                     	 fs.write(JSON.stringify(map_info));
	                     	 fs.close();

	                     	 if (document.title == "Add Files") {
	                     		 storeFilelistAndRedirect(file.fullPath, newFile.fullPath); }
	                     	 else {
	                     		
	                     		console.log("inside create custom event");
	                     		console.log("newfile: " + newFile.fullPath);
	                     		
	                     		// Create the event
	                     		var event = new CustomEvent("setFileComplete", {detail: newFile.fullPath});

	                     		// Dispatch/Trigger/Fire the event
	                     		document.dispatchEvent(event);
	                     	 }
							}
	                     , function(e) {
	                     	 console.log("Error " + e.message);
	                     }, "UTF-8");
	                 });       
			}
			catch (err) {
				console.log("Error in parseXmlToData: ", err.toString());
			}
		});
	}
    
    function parseXMLfile(filename) {
    	
    	console.log('inside parseXMLfile');
    	tizen.filesystem.resolve(
				filename,
				parseGpxXmlToData, 
				function(e) {console.log("Error" + e.message);},
				"rw"
			 );	
    }
    
    function storeFilelistAndRedirect(fileName, infofile) {
    
    	var gpxFilelist = localStorage.getItem("gpxFilelist");    			    	
		var route_name = document.getElementById("route_name_input").value;
    	var parsedFileList;
    	
    	document.getElementById("save_file_btn").innerHTML = "File Added";
    	
    	if (gpxFilelist != null)
    		parsedFileList = JSON.parse(gpxFilelist);
    	else {
			parsedFileList = [];
		}
    		
    	parsedFileList.push({file:route_name, filename:fileName, status:"A", infofile: infofile});
    	    
    	localStorage.setItem("gpxFilelist", JSON.stringify(parsedFileList));
    		
    	localStorage.setItem("currentGPXID", parsedFileList.length - 1);
    	localStorage.setItem("currentGPXName", route_name);
    	localStorage.setItem("currentGPXFilename", fileName);  	
    	
    	document.getElementById("download_popup_content").innerHTML = 'Download Completed';
    	
    	setTimeout(function(){ 
    		tau.closePopup();},	 // Alert Popup Toast
    		1000);
    	
		localStorage.setItem("firstPass", "N");
    	window.location.href = 'index.html';
    	
    }
    
    function registerEventHandlers() {

    	/**
    	 * Back key event handler
    	 */
    	if (document.title == "Add Files") {
    		window.addEventListener('tizenhwkey', function(ev) {
    		if (ev.keyName === "back")
    				window.history.back();
    		});
    	}
    	
    	/**
    	 * Save File event handler
    	 */
    	if (document.title == "Add Files") {
    	document.getElementById("save_file_btn").addEventListener("click", function(){
    		console.log("save file button clicked");
    		
		    document.getElementById("save_file_btn").innerHTML = "Downloading...";
		    document.getElementById("save_file_btn").disabled = true;
		    
		    tau.openPopup("#download_popup");
	        document.getElementById("download_popup_content").innerHTML = "Initializing Download";
		    
    		var route_name = document.getElementById("route_name_input").value;
    		var gpx_url = document.getElementById("gpx_url_input").value;
//	    	var gpxFilelist = localStorage.getItem("gpxFilelist");    			    	
//	    	var parsedFileList;
	    	var input_filename = gpx_url.split('/').pop();
	    	
    		console.log(route_name);
    		console.log(gpx_url);
    		console.log(input_filename);
    		
    		// Check if Download API is supported not on a device.
    		var download_api_capability = tizen.systeminfo.getCapability("http://tizen.org/feature/download");
    		
    		if (download_api_capability === false) {
    		    console.log("Download API is not supported on this device.");
    		}

    		var listener = {
    				  onprogress: function(id, receivedSize, totalSize) {
      			    	var percentage = Math.round(receivedSize / totalSize * 100) + '%';
    			        document.getElementById("save_file_btn").innerHTML = percentage;
    			        document.getElementById("download_popup_content").innerHTML = percentage;
    			        console.log("percent:" + percentage);
    				    console.log('Received with id: ' + id + ', ' + receivedSize + '/' + totalSize);
    				  },
    				  onpaused: function(id) {
    				    console.log('Paused with id: ' + id);
    				  },
    				  oncanceled: function(id) {
    				    console.log('Canceled with id: ' + id);
    				  },
    				  oncompleted: function(id, fileName) {
    				    console.log('Completed with id: ' + id + ', file name: ' + fileName);
    				    
    				    // CODE FOR PARSING XML
    				    
    				     parseXMLfile(fileName);
    				     document.getElementById("download_popup_content").innerHTML = "Analyzing route";
    				    
    				    // END CODE FOR PARSING XML
    				    
    				    
    				    
    				    // storeFilelistAndRedirect(fileName, '');
    				    
    				  },
    				  onfailed: function(id, error) {
    				    console.log('Failed with id: ' + id + ', error name: ' + error.name);
    				    document.getElementById("save_file_btn").innerHTML = "Download Failed!";

    			    	document.getElementById("download_popup_content").innerHTML = "Download Failed! <br>" + error.name;
        			    	
        			    setTimeout(function(){ 
        			    		tau.closePopup();},	 // Alert Popup Toast
        			    		3000);
        			    	
        			    window.location.href = 'files.html';

    				  }
    				};
 
    		var request = new tizen.DownloadRequest(
    			    gpx_url, // File URL
    			    'wgt-private' // Destination directory
    			);
    		    		
    		var id = tizen.download.start(request, listener);

    	});
    	}
    };
    
}());
