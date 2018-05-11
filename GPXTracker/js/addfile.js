(function() {
	
    // initialize with a little help of jQuery
    $(document).ready(function() {
    	console.log("init: addfiles ready");
    	registerEventHandlers();
    });
    
	function parseGpxXmlToData(file) {
		console.log('inside parseGpxXmlToData');
		file.readAsText(function(data) { 
			try {
				var xmlDoc = jQuery.parseXML(data); 
				console.log("xml data loaded"); 
				
	             var xml_parser = new GPXFileParser(xmlDoc);
	             xml_parser.addTrackpoints();         // Add the trackpoints

	             var point_array = xml_parser.getPointArray();
	             console.log('Point array');
	             console.log(JSON.stringify(point_array));

	             var distance_array = xml_parser.getDistanceArray();
	             console.log('Distance array');
	             console.log(distance_array);
	             
	             var ele_array = xml_parser.getEleArray();
	             console.log('Ele Array');
	             console.log(ele_array);

	             var map_info = {points: point_array, distances: distance_array, elevations: ele_array};
	             
	             console.log("map_info");
	             console.log(JSON.stringify(map_info));
	             
	             storeFilelistAndRedirect(file.fullPath);
			}
			catch (err) {
				console.log("Error in parseXmlToData: ", err.toString());
			}
		});
		
		
	};
    
    function parseXMLfile(filename) {
    	
    	console.log('inside parseXMLfile');
    	tizen.filesystem.resolve(
				filename,
				parseGpxXmlToData, 
				function(e) {console.log("Error" + e.message);},
				"rw"
			 );	
    }
    
    function storeFilelistAndRedirect(fileName) {
    
    	var gpxFilelist = localStorage.getItem("gpxFilelist");    			    	
		var route_name = document.getElementById("route_name_input").value;
    	var parsedFileList;
    	
    	document.getElementById("save_file_btn").innerHTML = "File Added";
    	
    	if (gpxFilelist != null)
    		parsedFileList = JSON.parse(gpxFilelist);
    	else {
			parsedFileList = [];
		}
    		
    	parsedFileList.push({file:route_name, filename:fileName, status:"A"});
    	    
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
    	
    	window.addEventListener('tizenhwkey', function(ev) {
		if (ev.keyName === "back")
			window.history.back();
    	});
    	
    	/**
    	 * Save File event handler
    	 */
    	
    	document.getElementById("save_file_btn").addEventListener("click", function(){
    		console.log("save file button clicked");
    		
		    document.getElementById("save_file_btn").innerHTML = "Downloading...";
		    document.getElementById("save_file_btn").disabled = true;
		    
		    tau.openPopup("#download_popup");
	        document.getElementById("download_popup_content").innerHTML = "Initializing Download";
		    
    		var route_name = document.getElementById("route_name_input").value;
    		var gpx_url = document.getElementById("gpx_url_input").value;
	    	var gpxFilelist = localStorage.getItem("gpxFilelist");    			    	
	    	var parsedFileList;
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
    				    
    				    // END CODE FOR PARSING XML'
    				    
    				    //storeFilelistAndRedirect(fileName);
    				    
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
    	
    };
    
}());
