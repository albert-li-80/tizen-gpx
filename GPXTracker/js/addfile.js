(function() {
	
	var distance_array = [];
	var ele_array = [];
	var gpxRouteDistance = 0;
	
    // initialize with a little help of jQuery
    $(document).ready(function() {
    	console.log("init: files ready");
    	
    	// L10N
    	
    	for (var i = 0; i < document.querySelectorAll('[data-l10n]').length; i++) {
    	    var elem = document.querySelectorAll('[data-l10n]')[i];
    	    elem.innerHTML = TIZEN_L10N[elem.getAttribute('data-l10n')];
    	}
    	
    	if ((document.title == "Files") || (document.title == "Remove Routes")) {
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
    				if ((document.title != "Remove Routes") && (localStorage.getItem("currentGPXID") != null) && (i == localStorage.getItem("currentGPXID")) && (localStorage.getItem("currentGPXID") != ""))
    					check = ' checked="checked"';
    		
    				innerHTML = innerHTML + '<li class="li-has-radio" value="' + i + '"><label><div style="width: 220px" class="ui-marquee ui-marquee-gradient">' + parsedFileList[i].file + '</div><input type="radio" name="radio-sample"' + check + '/></label></li>';
    			}
    		}

    		if (innerHTML == '')
    			innerHTML = '<li><a href="#">' +  TIZEN_L10N['no_route'] + '</a></li>';
 
    	} else {
    		innerHTML = '<li><a href="#">' +  TIZEN_L10N['no_route'] + '</a></li>';
		}

		console.log(innerHTML);    		
		d1.insertAdjacentHTML('afterbegin', innerHTML);
    }
    
    function registerFileEventHandlers() {

    	/**
    	 * Back key event handler
    	 */
    	
    	window.addEventListener('tizenhwkey', function(ev) {
    		console.log("title: " + document.title);
    		
    		if ((ev.keyName === "back") && (document.title == "Files")) {
    			localStorage.setItem("firstPass", "N");
    			window.location.href = 'index.html';
    			//			window.history.back();
    		}
    		else if ((ev.keyName === "back") && (document.title == "Remove Routes")) {
    			localStorage.setItem("firstPass", "N");
    			window.location.href = 'index.html';
//    			window.history.back();
    		}
    		else if ((ev.keyName === "back") && (document.title == "Add Files")) {
    			console.log("add files back button (unused)");
        		window.history.back();
        	}
        	else {
        		console.log("unknown back button");
        		window.history.back();
        	}
    	});

    	
    	/**
    	 * GPX File event handler
    	 */

    	var userSelection = document.getElementsByClassName('li-has-radio');
    	var clicked = false;
    	var removeSelection = null;
    	
    	for(var i = 0; i < userSelection.length; i++) {
    		userSelection[i].addEventListener("click", function() {
    			
    			if (document.title == 'Remove Routes') {
    				removeSelection = this.getAttribute("value");
    				document.getElementById("remove_file_btn").disabled = false;
    				return;
    			}
    			
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
    		    		tau.closePopup();
            			localStorage.setItem("firstPass", "N");
            			window.location.href = 'index.html';},	 // Alert Popup Toast
    		    		500);            		
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
    	if (document.getElementById("add_file_btn") != null)
    		document.getElementById("add_file_btn").addEventListener("click", function(){
    			console.log("add file button clicked");    		
    			window.location.href = 'addfile.html';
    		});

    	if (document.getElementById("remove_file_btn") != null)
    		document.getElementById("remove_file_btn").addEventListener("click", function(){
    			console.log("remove file button clicked");
    			console.log(removeSelection);
    			
    			if (removeSelection != null) {
    				var filelist = JSON.parse(localStorage.getItem("gpxFilelist"));
    				var currentID = localStorage.getItem("currentGPXID");

    				filelist[removeSelection].status = "E";
    				localStorage.setItem("gpxFilelist", JSON.stringify(filelist));
			
    				if (removeSelection == currentID) {
    					localStorage.setItem("currentGPXID", "");
    					localStorage.setItem("currentGPXName", "");
    					localStorage.setItem("currentGPXFilename", ""); 
    				}	
    			
    				window.location.href = 'removefile.html';
    			}
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
	            	 xml_parser.addRoutepoints();			// Add the routes only if trackpoints does not exist
	             
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
	                     	 console.log("Error in writing file: ", e.toString());
	        				
	                     	 document.getElementById("save_file_btn").innerHTML = "Cannot Save File";
	                     	 document.getElementById("download_popup_content").innerHTML = "Cannot Save File! <br>" + e.toString();
	        			    	
	                     	 setTimeout(function(){ 
	        			    		tau.closePopup();
	        			    		document.getElementById("save_file_btn").innerHTML = "Save";
	        			    		document.getElementById("save_file_btn").disabled = false;
	        			    		window.location.href = 'files.html';},	 // Alert Popup Toast
	        			    		3000);
	        			    	
	                     	 

	                     }, "UTF-8");
	                 });       
			}
			catch (err) {
				console.log("Error in parseXmlToData: ", err.toString());
				
			    document.getElementById("save_file_btn").innerHTML = "GPX File Format Error";
		    	document.getElementById("download_popup_content").innerHTML = "GPX File Format Error! <br>" + err.toString();
			    	
			    setTimeout(function(){ 
			    		tau.closePopup();
			    		document.getElementById("save_file_btn").innerHTML = "Save";
			    		document.getElementById("save_file_btn").disabled = false;
			    		window.location.href = 'files.html';},	 // Alert Popup Toast
			    		3000);
			    	
			    

			}
		});
	}
    
    function parseXMLfile(filename) {
    	
    	console.log('inside parseXMLfile');
    	tizen.filesystem.resolve(
				filename,
				parseGpxXmlToData, 
				function(e) {
					console.log("Error" + e.message);
					console.log("Error in writing file: ", e.toString());
     				
					document.getElementById("save_file_btn").innerHTML = "Cannot Save GPS File";
					document.getElementById("download_popup_content").innerHTML = "Cannot Save GPS File! <br>" + e.toString();
    			    	
					setTimeout(function(){ 
    			    		tau.closePopup();
    			    		document.getElementById("save_file_btn").innerHTML = "Save";
    			    		document.getElementById("save_file_btn").disabled = false;
    			    		window.location.href = 'files.html';},	 // Alert Popup Toast
    			    		3000);
    			   				
				},
				"rw"
			 );	
    }
    
    function storeFilelistAndRedirect(fileName, infofile) {
    
    	var gpxFilelist = localStorage.getItem("gpxFilelist");    			    	
		var route_name = document.getElementById("route_name_input").textContent;
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
    	
    	document.getElementById("download_popup_content").innerHTML = TIZEN_L10N['download_completed'];
    	
    	setTimeout(function(){
    		tau.closePopup();},	 // Alert Popup Toast
    		500);    	

		localStorage.setItem("firstPass", "N");
    	window.location.href = 'index.html';

    }
    
    function registerEventHandlers() {

    	/**
    	 * Back key event handler
    	 */
    	
//    	if (document.title == "Add Files") {
    		window.addEventListener('tizenhwkey', function(ev) {
    			if (ev.keyName === "back") {
    				console.log("add files back button");
    				window.history.back();
    			}
    		});
//    	}

    		
    	/**
    	 * Route Name Input event handler
    	 */
    	
    	var nameAppControlReplyCB = {
    		    onsuccess: function(reply) {

   		         	console.log('The launch application control returned');
   		         
    		    	for (var num = 0; num < reply.length; num++) {
    		            if (reply[num].key == 'http://tizen.org/appcontrol/data/text') {
    		                console.log('input text: ' + reply[num].value);
    		                document.getElementById("route_name_input").textContent = reply[num].value;
    		            }
    		        }
    		    },
    		    onfailure: function() {
    		         console.log('The launch application control failed');
    		         window.location.href = 'addfile.html';
    		    }
    		}
    	
    	if (document.title == "Add Files") {
    		document.getElementById("route_name_box").addEventListener("click", function(){
    			console.log("route name box clicked");
    			
    			var input_type = new tizen.ApplicationControlData('http://tizen.org/appcontrol/data/input_type', ['input_keyboard']);
    			var guide_text = new tizen.ApplicationControlData('http://tizen.org/appcontrol/data/input_default_text', [document.getElementById("route_name_input").textContent]);
    			
    			var appControl = new tizen.ApplicationControl('http://tizen.org/appcontrol/operation/get_input',
//                        null, null, null, [input_type, guide_text], 'GROUP');
    					null, null, null, [guide_text], 'GROUP');
    			
    			tizen.application.launchAppControl(appControl, null, function() {
    			    console.log('launch application control succeed');
    			}, function(e) {
    			    console.log('launch application control failed. reason: ' + e.message);
    			}, nameAppControlReplyCB);
    		});
    	}

    	/**
    	 * URL Input event handler
    	 */
    	
    	var urlAppControlReplyCB = {
    		    onsuccess: function(reply) {
    		        for (var num = 0; num < reply.length; num++) {
    		            if (reply[num].key == 'http://tizen.org/appcontrol/data/text') {
    		                console.log('url text: ' + reply[num].value);
    		                document.getElementById("gpx_url_input").textContent = reply[num].value;
    		            }
    		        }
    		    },
    		    onfailure: function() {
   		         console.log('The launch application control failed');
   		         window.location.href = 'addfile.html';
    		    }
    		}
    	
    	if (document.title == "Add Files") {
    		document.getElementById("gpx_url_box").addEventListener("click", function(){
    			console.log("url box clicked");
    			
    			var input_type = new tizen.ApplicationControlData('http://tizen.org/appcontrol/data/input_type', ['input_keyboard']);
    			var guide_text = new tizen.ApplicationControlData('http://tizen.org/appcontrol/data/input_default_text', [document.getElementById("gpx_url_input").textContent]);
    			
    			var appControl = new tizen.ApplicationControl('http://tizen.org/appcontrol/operation/get_input',
    			                                              null, null, null, [guide_text], null);
    			
    			tizen.application.launchAppControl(appControl, null, function() {
    			    console.log('launch application control succeed');
    			}, function(e) {
    			    console.log('launch application control failed. reason: ' + e.message);
    			}, urlAppControlReplyCB);
    		});
    	}

    	if (document.title == "Add Files") {
    		document.getElementById("file_receive_box").addEventListener("click", function(){
    			console.log("file receive box clicked");
    			window.location.href = 'filetransfer.html';
    		});
    	}
    	
    	if ((localStorage.getItem("receiveFilePath") !== null) && (localStorage.getItem("receiveFilePath") != '')) {
    		document.getElementById("gpx_url_input").textContent = localStorage.getItem("receiveFilePath");
    		localStorage.setItem("receiveFilePath", '');
    	}

    	if ((localStorage.getItem("receiveRouteName") !== null) && (localStorage.getItem("receiveRouteName") != '')) {
    		document.getElementById("route_name_input").textContent = localStorage.getItem("receiveRouteName");
    		localStorage.setItem("receiveRouteName", '');
    	}

/*    	var height = window.innerHeight;
    	
    	if (document.title == "Add Files") {
    		window.addEventListener("resize", function() {
    			if (window.innerHeight < height) {
    				console.log("keyboard active");
    				document.getElementById("save_file_btn").style.display = "none";
    				document.activeElement.scrollIntoView(false);
    			} else if (window.innerHeight >= height) {
    				console.log("keyboard inactive");
    				document.getElementById("save_file_btn").style.display = "block";
    		 	}
    		});
    	};
 */   	
    	/**
    	 * Save File event handler
    	 */
    	if (document.title == "Add Files") {
    	document.getElementById("save_file_btn").addEventListener("click", function(){
    		console.log("save file button clicked");
    		
		    document.getElementById("save_file_btn").innerHTML = "Downloading...";
		    document.getElementById("save_file_btn").disabled = true;
		    
		    tau.openPopup("#download_popup");
	        document.getElementById("download_popup_content").innerHTML = TIZEN_L10N['initializing_download'];
		    
//    		var route_name = document.getElementById("route_name_input").textContent;
    		var gpx_url = document.getElementById("gpx_url_input").textContent;
//	    	var gpxFilelist = localStorage.getItem("gpxFilelist");    			    	
//	    	var parsedFileList;
//	    	var input_filename = gpx_url.split('/').pop();
	    	
//    		console.log(route_name);
    		console.log(gpx_url);
//    		console.log(input_filename);

    		if (gpx_url.substring(0, 4) == 'file') {
    			// CODE FOR PARSING XML
			    document.getElementById("download_popup_content").innerHTML = TIZEN_L10N['analyzing_route'];

			    try {
			    	parseXMLfile(gpx_url);
			    }
				catch (err) {
					console.log("Error in parseXMLfile: ", err.toString());
					
				    document.getElementById("save_file_btn").innerHTML = "GPX File Format Error";
			    	document.getElementById("download_popup_content").innerHTML = "GPX File Format Error! <br>" + err.toString();
				    	
				    setTimeout(function(){ 
				    		tau.closePopup();
    			    		document.getElementById("save_file_btn").innerHTML = "Save";
    			    		document.getElementById("save_file_btn").disabled = false;
				    		window.location.href = 'files.html';},	 // Alert Popup Toast
				    		3000);				    
				}
			    return;
    		}
    		

    		gpx_url = encodeURI(document.getElementById("gpx_url_input").textContent);
    		
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
    				    document.getElementById("download_popup_content").innerHTML = TIZEN_L10N['analyzing_route'];
    				    parseXMLfile(fileName);
    				    
    				    // END CODE FOR PARSING XML
    				    // storeFilelistAndRedirect(fileName, '');
    				    
    				  },
    				  onfailed: function(id, error) {
    				    console.log('Failed with id: ' + id + ', error name: ' + error.name);
    				    document.getElementById("save_file_btn").innerHTML = "Download Failed!";

    			    	document.getElementById("download_popup_content").innerHTML = TIZEN_L10N['download_failed']  + "! <br>" + error.name;
        			    	
        			    setTimeout(function(){ 
        			    		tau.closePopup();	 // Alert Popup Toast
        			    		document.getElementById("save_file_btn").innerHTML = "Save";
        			    		document.getElementById("save_file_btn").disabled = false;
                			    window.location.href = 'files.html';},
        			    		2000);       			    	
    				  }
    				};
 
    		var request = new tizen.DownloadRequest(
    			    gpx_url, // File URL
    			    "wgt-private" // Destination directory
    			);
    		    		
    		console.log("URL: " + gpx_url);
    		
    		var id = null;
    		
    		try {
    			id = tizen.download.start(request);  		
    			tizen.download.setListener(id, listener);
    		}
    		catch (error) {
			    console.log('Failed with download start id: ' + id + ', error name: ' + error.name);
			    document.getElementById("save_file_btn").innerHTML = "Download Failed!";

		    	document.getElementById("download_popup_content").innerHTML = TIZEN_L10N['download_failed'] +  "!<br>" + TIZEN_L10N['try_again'] + "<br>" + error.name;
			    	
			    setTimeout(function(){ 
			    		tau.closePopup();
			    		document.getElementById("save_file_btn").innerHTML = "Save";
			    		document.getElementById("save_file_btn").disabled = false;
			    		window.location.href = 'files.html';},	 // Alert Popup Toast
			    		3000);			    			       			
    		}
    	});
    	}
    };
    
}());
