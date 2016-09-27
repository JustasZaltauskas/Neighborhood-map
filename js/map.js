var map;
var infoWindow; // global so the info window would not dublicate at any point
var infoWindowPlaces;
var locationCoord; // current location coordinates

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 0,
            lng: 0
        },
        zoom: 14
    });

    var geoloccontrol = new klokantech.GeolocationControl(map, 14);

    var autocomplete = new google.maps.places.Autocomplete(document.getElementById('input-1'));

    autocomplete.bindTo('bounds', map);

    // var infowindow = new google.maps.InfoWindow();
    // var marker = new google.maps.Marker({
    //     map: map,
    //     anchorPoint: new google.maps.Point(0, -29)
    // });
    // $('#location-btn')[0].bind("click", getCurrentLocation(map), false);
    $('#location-btn').on("click", function() {
        getCurrentLocation(map);
        window.location = "index.html#secondPage"
    });

    autocomplete.addListener('place_changed', function() {
        // infowindow.close();
        // marker.setVisible(false);
        var place = autocomplete.getPlace();
        if (!place.geometry) {
            window.alert("Autocomplete's returned place contains no geometry");
            return;
        }

        // If the place has a geometry, then present it on a map.
        if (place.geometry.viewport) {
            window.location = "index.html#secondPage"
            map.fitBounds(place.geometry.viewport);
        } else {
            window.location = "index.html#secondPage"
            map.setCenter(place.geometry.location);
            map.setZoom(17);
        }
        $('#search-btn').on("click", function() {
        //window.location.replace("file:///C:/Users/User/Desktop/Neighborhood%20map/index.html#secondPage");
        window.location = "index.html#secondPage";
    });
    });

    google.maps.event.addDomListener(window, "resize", function() {
        var center = map.getCenter();
        google.maps.event.trigger(map, "resize");
        map.setCenter(center);
    });

    //getCurrentLocation(map);

}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
        'Error: Your browser doesn\'t support geolocation.');
}

function getCurrentLocation(map) {
    // Try HTML5 geolocation.
    // window.loc;
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            if (infoWindow) {
                infoWindow.close();
            }

            infoWindow = new google.maps.InfoWindow({
                map: map
            });

            infoWindow.setPosition(pos);
            infoWindow.setContent('Your location.');
            map.setCenter(pos);

            locationCoord = pos;

            var request = {
                location: locationCoord,
                radius: '2500',
                 types: ['restaurant' , 'bar' , 'cafe' , 'shopping_mall','clothing_store' ,'park' , 'night_club']
            };

            infoWindowPlaces = new google.maps.InfoWindow();
            var service = new google.maps.places.PlacesService(map);
            service.nearbySearch(request, callback);


        }, function() {
            if (infoWindow) {
                infoWindow.close();
            }
            infoWindow = new google.maps.InfoWindow({
                map: map
            });
            handleLocationError(true, infoWindow, map.getCenter());
            map.setZoom(3);
        });
    } else {
        if (infoWindow) {
            infoWindow.close();
        }
        infoWindow = new google.maps.InfoWindow({
            map: map
        });
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter());
    }


}
// Get places nearby
function callback(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
            var place = results[i];
            createMarker(results[i]);
        }
    }
}
// Create a marker for every place found
function createMarker(place) {
    var placeLoc = place.geometry.location;
    var marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location
        // icon: 'https://mapicons.mapsmarker.com/wp-content/uploads/mapicons/shape-default/color-8c4eb8/shapecolor-color/shadow-1/border-dark/symbolstyle-white/symbolshadowstyle-dark/gradient-no/restaurant.png'
    });

    google.maps.event.addListener(marker, 'click', function() {
        infoWindowPlaces.setContent(place.name);
        infoWindowPlaces.open(map, this);

        var service = new google.maps.places.PlacesService(map);
        service.getDetails({
          placeId: place.place_id
      }, function(place, status) {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
                console.log(place);
          };
      });
  });
}