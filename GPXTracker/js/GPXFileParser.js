function GPXFileParser(xmlDoc){
		
	this.xmlDoc = xmlDoc;
//	this.map = map;
	this.trackcolour = "#ff00ff"; // red
	this.trackwidth = 5;
	this.mintrackpointdelta = 0.0001;
	this.pointarray = [];
	this.elearray = [];
	this.distancearray = [];
	
	// Set the colour of the track line segements.
	GPXFileParser.prototype.getDistanceArray = function() {
	    return this.distancearray;
	}
	
	// Set the colour of the track line segements.
	GPXFileParser.prototype.getEleArray = function() {
	    return this.elearray;
	}

	// Set the colour of the track line segements.
	GPXFileParser.prototype.getPointArray = function() {
	    return this.pointarray;
	}
	
	// Set the colour of the track line segements.
	GPXFileParser.prototype.setTrackColour = function(colour) {
	    this.trackcolour = colour;
	}

	// Set the width of the track line segements
	GPXFileParser.prototype.setTrackWidth = function(width) {
	    this.trackwidth = width;
	}

	// Set the minimum distance between trackpoints.
	// Used to cull unneeded trackpoints from map.
	GPXFileParser.prototype.setMinTrackPointDelta = function(delta) {
	    this.mintrackpointdelta = delta;
	}

	GPXFileParser.prototype.translateName = function(name) {
	    if(name == "wpt") {
	        return "Waypoint";
	    }
	    else if(name == "trkpt") {
	        return "Track Point";
	    }
	    else if(name == "rtept") {
	        return "Route Point";
	    }
	}


	GPXFileParser.prototype.createMarker = function(point) {
	    var lon = parseFloat(point.getAttribute("lon"));
	    var lat = parseFloat(point.getAttribute("lat"));
	    var html = "";

	    var pointElements = point.getElementsByTagName("html");
	    if(pointElements.length > 0) {
	        for(i = 0; i < pointElements.item(0).childNodes.length; i++) {
	            html += pointElements.item(0).childNodes[i].nodeValue;
	        }
	    }
	    else {
	        // Create the html if it does not exist in the point.
	        html = "<b>" + this.translateName(point.nodeName) + "</b><br>";
	        var attributes = point.attributes;
	        var attrlen = attributes.length;
	        for(i = 0; i < attrlen; i++) {
	            html += attributes.item(i).name + " = " +
	                    attributes.item(i).nodeValue + "<br>";
	        }

	        if(point.hasChildNodes) {
	            var children = point.childNodes;
	            var childrenlen = children.length;
	            for(i = 0; i < childrenlen; i++) {
	                // Ignore empty nodes
	                if(children[i].nodeType != 1) continue;
	                if(children[i].firstChild == null) continue;
	                html += children[i].nodeName + " = " +
	                        children[i].firstChild.nodeValue + "<br>";
	            }
	        }
	    }
/*
	    var marker = new google.maps.Marker({
	        position: new google.maps.LatLng(lat,lon),
	        map: this.map
	    });

	    var infowindow = new google.maps.InfoWindow({
	        content: html,
	        size: new google.maps.Size(50,50)
	    });

	    google.maps.event.addListener(marker, "click", function() {
	        infowindow.open(this.map, marker);
	    });
*/	}

	GPXFileParser.prototype.addTrackSegment = function(trackSegment) {

		console.log("inside addtracksegment");
		
		var trackpoints = trackSegment.getElementsByTagName("trkpt");
	    if(trackpoints.length == 0) {
	        return;
	    }

//	    var pointarray = [];

	    // process first point
	    var lastlon = parseFloat(trackpoints[0].getAttribute("lon"));
	    var lastlat = parseFloat(trackpoints[0].getAttribute("lat"));
//	    var latlng = new google.maps.LatLng(lastlat,lastlon);
//	    pointarray.push(latlng);

	    var latlng = {latitude: lastlat, longitude: lastlon};
	    this.pointarray.push(latlng);

	    // Get elevation
	    var elelist = trackpoints[0].getElementsByTagName("ele");
	    var ele = null;
	    
	    if (elelist != null)
	    	ele = elelist[0];
	    
	    if (ele != null)
	    	this.elearray.push(ele.textContent);
	    else this.elearray.push('99999');
	    
	    var outstanding_distance = 0;
	    
	    for(var i = 1; i < trackpoints.length; i++) {
	        var lon = parseFloat(trackpoints[i].getAttribute("lon"));
	        var lat = parseFloat(trackpoints[i].getAttribute("lat"));

	        // Verify that this is far enough away from the last point to be used.
	        var latdiff = lat - lastlat;
	        var londiff = lon - lastlon;

	        var lastlatlng = {latitude: parseFloat(trackpoints[i-1].getAttribute("lat")), longitude: parseFloat(trackpoints[i-1].getAttribute("lon"))};
	        var thislatlng = {latitude: lat, longitude: lon};
	        var point_distance = geolib.getDistance(lastlatlng, thislatlng);
	        outstanding_distance = outstanding_distance + point_distance;
	        
	        if(Math.sqrt(latdiff*latdiff + londiff*londiff)
	                > this.mintrackpointdelta) {
	            lastlon = lon;
	            lastlat = lat;
	    	    
	            latlng = {latitude: lat, longitude: lon};

//	            latlng = new google.maps.LatLng(lat,lon);
//	            pointarray.push(latlng);
	    	    this.pointarray.push(latlng);
	    	    
	    	    // Get elevation
	    	    var elelist = trackpoints[i].getElementsByTagName("ele");
	    	    var ele = null;
	    	    
	    	    if (elelist != null)
	    	    	ele = elelist[0];
	    	    
	    	    if (ele != null)
	    	    	this.elearray.push(ele.textContent);
	    	    else this.elearray.push('99999');	    	 
	    	    
	    	    // Calculate Distance
	    	    this.distancearray.push(outstanding_distance);
	    	    outstanding_distance = 0;
	    	    }
	        }

/*
	    var polyline = new google.maps.Polyline({
	        path: pointarray,
	        strokeColor: colour,
	        strokeWeight: width,
	        map: this.map
	    });*/
	}

	GPXFileParser.prototype.addTrack = function(track) {
	    var segments = track.getElementsByTagName("trkseg");
	    for(var i = 0; i < segments.length; i++) {
	        var segmentlatlngbounds = this.addTrackSegment(segments[i]);
	    }
	}

	GPXFileParser.prototype.addRouteToMap = function(route, colour, width) {
	    var routepoints = route.getElementsByTagName("rtept");
	    if(routepoints.length == 0) {
	        return;
	    }

	    var pointarray = [];

	    // process first point
	    var lastlon = parseFloat(routepoints[0].getAttribute("lon"));
	    var lastlat = parseFloat(routepoints[0].getAttribute("lat"));
	    var latlng = {latitude: lastlat, longitude: lastlon};
	    //= new google.maps.LatLng(lastlat,lastlon);
	    //pointarray.push(latlng);
	    this.pointarray.push(latlng);

	    for(var i = 1; i < routepoints.length; i++) {
	        var lon = parseFloat(routepoints[i].getAttribute("lon"));
	        var lat = parseFloat(routepoints[i].getAttribute("lat"));

	        // Verify that this is far enough away from the last point to be used.
	        var latdiff = lat - lastlat;
	        var londiff = lon - lastlon;
	        if(Math.sqrt(latdiff*latdiff + londiff*londiff)
	                > this.mintrackpointdelta) {
	            lastlon = lon;
	            lastlat = lat;
	            var latlng = {latitude: lastlat, longitude: lastlon};
//	            latlng = new google.maps.LatLng(lat,lon);
//	            pointarray.push(latlng);
	    	    this.pointarray.push(latlng);
	        }

	    }
/*
	    var polyline = new google.maps.Polyline({
	        path: pointarray,
	        strokeColor: colour,
	        strokeWeight: width,
	        map: this.map
	    });*/
	}

	GPXFileParser.prototype.addTrackpoints = function() {
	    var tracks = this.xmlDoc.documentElement.getElementsByTagName("trk");
	    for(var i = 0; i < tracks.length; i++) {
	        this.addTrack(tracks[i]);
	    }
	}

	GPXFileParser.prototype.addWaypointsToMap = function() {
	    var waypoints = this.xmlDoc.documentElement.getElementsByTagName("wpt");
	    for(var i = 0; i < waypoints.length; i++) {
	        this.createMarker(waypoints[i]);
	    }
	}

	GPXFileParser.prototype.addRoutepointsToMap = function() {
	    var routes = this.xmlDoc.documentElement.getElementsByTagName("rte");
	    for(var i = 0; i < routes.length; i++) {
	        this.addRouteToMap(routes[i], this.trackcolour, this.trackwidth);
	    }
	}
    
};