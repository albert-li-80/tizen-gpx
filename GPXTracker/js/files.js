(function() {
	
    // initialize with a little help of jQuery
    $(document).ready(function() {
    	console.log("init: files ready");
    	getGPXFilelist();
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
    
    function registerEventHandlers() {

    	/**
    	 * Back key event handler
    	 */
    	
    	window.addEventListener('tizenhwkey', function(ev) {
		if (ev.keyName === "back") {
			localStorage.setItem("firstPass", "N");
			window.location.href = 'index.html';
//			window.history.back();
		}
    	});

    	
    	/**
    	 * GPX File event handler
    	 */

    	var userSelection = document.getElementsByClassName('li-has-radio');

    	for(var i = 0; i < userSelection.length; i++) {
    		userSelection[i].addEventListener("click", function() {
    			
    			var index = this.getAttribute("value");
    			console.log(index);

    	    	var gpxFileList = localStorage.getItem("gpxFilelist");
    	    	var parsedFileList = JSON.parse(gpxFileList);
     			
        		localStorage.setItem("currentGPXID", index);
        		localStorage.setItem("currentGPXName", parsedFileList[index].file);
        		localStorage.setItem("currentGPXFilename", parsedFileList[index].filename);    	    
        		
    		    document.getElementById("file_popup_content").innerHTML = "Route has been set to " + parsedFileList[index].file;
        		tau.openPopup("#file_popup");
    		    
			    setTimeout(function(){ 
		    		tau.closePopup();},	 // Alert Popup Toast
		    		1000);
        		
    			localStorage.setItem("firstPass", "N");
    			window.location.href = 'index.html';
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
    
}());
