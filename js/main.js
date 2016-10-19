var map;
var infoWindow; // global so the info window would not dublicate at any point
var infoWindowPlaces;
var markers = []; // obejcts of place markers
var placeTypes = ['restaurant', 'bar', 'cafe', 'shopping_mall', 'clothing_store', 'shoe_store', 'park', 'night_club', 'museum', 'bowling_alley', 'movie_theater'];
var mapIcons = {
    park: {
        url: 'https://dl.dropboxusercontent.com/s/3laoawqp3rqe7qo/park.png?'
    },
    restaurant: {
        url: 'https://dl.dropboxusercontent.com/s/7ytjih4f3wpw88d/restaurant.png'
    },
    bar: {
        url: 'https://dl.dropboxusercontent.com/s/f56xn24ksthxyv7/bar.png'
    },
    cafe: {
        url: 'https://dl.dropboxusercontent.com/s/5p321qt0uqy7occ/coffee.png'
    },
    shopping_mall: {
        url: 'https://dl.dropboxusercontent.com/s/pmavimzs6fk10u0/shopping_mall.png'
    },
    clothing_store: {
        url: 'https://dl.dropboxusercontent.com/s/pmavimzs6fk10u0/shopping_mall.png'
    },
    shoe_store: {
        url: 'https://dl.dropboxusercontent.com/s/iqzf8qhdrtlh2nj/clothes.png'
    },
    night_club: {
        url: 'https://dl.dropboxusercontent.com/s/h2zvglegbons4x9/entertainment.png'
    },
    museum: {
        url: 'https://dl.dropboxusercontent.com/s/h2zvglegbons4x9/entertainment.png'
    },
    bowling_alley: {
        url: 'https://dl.dropboxusercontent.com/s/h2zvglegbons4x9/entertainment.png'
    },
    movie_theater: {
        url: 'https://dl.dropboxusercontent.com/s/h2zvglegbons4x9/entertainment.png?'
    }
};
// Wikipedia article object we are going to store in articles observable array
function article(pageID, title) {
    this.url = 'https://en.wikipedia.org/?curid=' + pageID;
    this.title = title;
}
var wikipediaArticles = [];

// categories of markers being displayed on the map
// categories:
// -restaurants : 'restaurant'
// -bars : 'bar'
// -cafes : 'cafe'
// -shopping : 'shopping_mall', 'clothing_store', 'shoe_store'
// -parks : 'park'
// -entertainment : 'night_club', 'museum', 'bowling_alley','movie_theater'
var markersByCategory = {};
// viewModel for the aside list
// model is markersByCategory and wikipediaArticles array
var viewModel = function() {
    var self = this;

    self.categories = ko.observableArray([]);

    self.markersToDisplay = ko.observableArray([]);

    self.articles = ko.observableArray([]);

    for (var property in markersByCategory) {
        if (markersByCategory.hasOwnProperty(property))
            self.categories.push(property);
    }

    wikipediaArticles.forEach(function(article) {
        self.articles.push(article);
    });

    createMarkersToDisplayMenu();

    self.showPlacesByCategory = function(item, event) {
        self.markersToDisplay.removeAll();
        markersByCategory[item].forEach(function(marker) {
            self.markersToDisplay.push(marker);
        });

        if (document.getElementById('marker-menu-headline') === null) {
            var menuHeadline = document.createElement('h2');
            menuHeadline.innerHTML = item;
            menuHeadline.id = 'marker-menu-headline';
            $("#back-button-div").append(menuHeadline);
        } else
        document.getElementById('marker-menu-headline').innerHTML = item;

        $("#markers-menu-container").css('opacity' , '1');
        $(".map-menu-container").css('opacity', '0');

        $("#markers-menu-container").css('right', '0');
        $(".map-menu-container").css('right', '100%');
        // remove borders on slide
        $(".map-menu-elements").css('border-style', 'none');
        // delete markers from map
        setMapOnAll(null, markers);
        // display markers who have selected category
        setMapOnAll(map, markersByCategory[item]);
    };

    self.showMarkerByPlace = function(item, event) {
        google.maps.event.trigger(item, 'click');
    };

    function createMarkersToDisplayMenu() {
        var containerDiv = document.createElement('div');
        containerDiv.id = 'markers-menu-container';
        containerDiv.style.width = '100%';
        containerDiv.style.height = '100%';
        containerDiv.style.position = 'absolute';
        containerDiv.style.zIndex = '1';
        containerDiv.style.top = '0';
        containerDiv.style.right = '100%';

        $('#map-menu').append(containerDiv);
        //create back button
        var buttonDiv = document.createElement('div');
        var backBtn = document.createElement('button');
        buttonDiv.id = 'back-button-div';
        backBtn.id = 'back-button';

        backBtn.addEventListener('click', function() {
            // show all markers on map
            setMapOnAll(map, window.markers);
            // close previously opened  infoWIndow
            infoWindowPlaces.close();
            // move aside menus
            $("#markers-menu-container").css('opacity' , '0');
            $(".map-menu-container").css('opacity', '1');

            $("#markers-menu-container").css('right', '100%');
            $(".map-menu-container").css('right', '0');

            // remove added border-style none
            $('.map-menu-elements').css('border-style', '');
            // remove border from markers menu when we slide
            $(".markers-menu-marker-element").css('border-style', 'none');
        });

        //create list of places by category
        var markersDiv = document.createElement("div");
        markersDiv.id = 'markers-menu-marker-div';

        var markers = document.createElement("div");
        markers.classList.add('markers-menu-marker-element');

        containerDiv.appendChild(buttonDiv);
        containerDiv.appendChild(markersDiv);
        buttonDiv.appendChild(backBtn);
        markersDiv.appendChild(markers);

        $("#markers-menu-marker-div").attr('data-bind', 'foreach:markersToDisplay');
        $(".markers-menu-marker-element").attr('data-bind', 'text: $data.details.name , click : $root.showMarkerByPlace');
    }
};
// Google map and first page buttons,input initialization
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 0,
            lng: 0
        },
        zoom: 16
    });

    var options = {
        types: ['address']
    };

    var autocomplete = new google.maps.places.Autocomplete(document.getElementById('input-1'), options);

    autocomplete.bindTo('bounds', map);

    $('#location-btn').on("click", function() {
        getCurrentLocation(map);
        window.location = "index.html#secondPage";
    });

    autocomplete.addListener('place_changed', function() {
        var place = autocomplete.getPlace();
        if (!place.geometry) {
            window.alert("Autocomplete's returned place contains no geometry");
            return;
        }

        // If the place has a geometry, then present it on a map.
        if (place.geometry.viewport) {
            window.location = "index.html#secondPage";
            map.fitBounds(place.geometry.viewport);
        } else {
            window.location = "index.html#secondPage";
            map.setZoom(16);
            map.setCenter(place.geometry.location);
        }

        infoWindowPlaces = new google.maps.InfoWindow();
        var service = new google.maps.places.PlacesService(map);

        var pos = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
        };

        var request = {
            location: pos,
            radius: '500',
            types: placeTypes
        };

        makeWikipediaAjaxRequest(place.geometry.location.lat(), place.geometry.location.lng(), 5, 1000);

        service.nearbySearch(request, callback);

        $('#search-btn').on("click", function() {
            window.location = "index.html#secondPage";
        });
    });

    google.maps.event.addDomListener(window, "resize", function() {
        var center = map.getCenter();
        google.maps.event.trigger(map, "resize");
        map.setCenter(center);
    });
}
// Google map geolocation error handling
function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
        'Error: Your browser doesn\'t support geolocation.');
}

function getCurrentLocation(map) {
    // Try HTML5 geolocation.
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

            var request = {
                location: pos,
                radius: '1000',
                types: placeTypes
            };

            infoWindowPlaces = new google.maps.InfoWindow();
            var service = new google.maps.places.PlacesService(map);

            makeWikipediaAjaxRequest(position.coords.latitude, position.coords.longitude, 5, 1000);

            // get places around current location
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
// we will apply knockout bindings once
var applied = false;

// Get places nearby
function callback(results, status) {
    setMapOnAll(null, markers);
    var place = {};
    markers = [];
    markersByCategory = {};

    if (typeof currentBinding !== 'undefined') {
        currentBinding.categories.removeAll();
        currentBinding.categories.push('We could not find any places nearby');
        $('.map-menu-elements')[0].style.pointerEvents = 'none';
    }

    function getDetailsCallback(placeDetailed, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            // we get create market with the place details that we got from place service
            createMarker(placeDetailed);

            // if we already got details of all places
            if (markers.length === results.length) {
                // if binding has not been applied ,apply
                if (applied === false) {
                    window.currentBinding = new viewModel();
                    ko.applyBindings(currentBinding);
                    applied = true;
                }
                // if binding was already applied then refresh our observable array
                window.currentBinding.categories.removeAll();
                // placeCategories.forEach(function(category) {
                //     window.currentBinding.Categories.push(category);
                // });
                for (var property in markersByCategory) {
                    if (markersByCategory.hasOwnProperty(property))
                        window.currentBinding.categories.push(property);
                }
            }
        }
        // if getDetails function unsuccessful on placeID
        // we create marker with limited details of place that we already had when called callback function
        else {
            createMarker(place);
        }
    }
    // if we got place ,take its ID and form a request for service.getDetails(request, getDetailsCallback)
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        // iterate through each callback result of places
        $.each(results, function(index, result) {
            place = result;
            var service = new google.maps.places.PlacesService(map);

            var request = {
                placeId: place.place_id
            };
            // get place details
            service.getDetails(request, getDetailsCallback);
        });
    }
}

function pushUniqueProperty(placeType) {
    if (markersByCategory.hasOwnProperty(placeType) === false) {
        markersByCategory[placeType] = [];
    }
}
// Assign a category for each place and push it to global array of placeCategories
function assignCategory(placeType) {
    if (placeType === 'restaurant') {
        pushUniqueProperty('Restaurants');
        return 'Restaurants';
    }
    if (placeType === 'bar') {
        pushUniqueProperty('Bars');
        return 'Bars';
    }
    if (placeType === 'cafe') {
        pushUniqueProperty('Cafes');
        return 'Cafes';
    }
    if (placeType === 'shopping_mall' || placeType === 'clothing_store' || placeType === 'shoe_store') {
        pushUniqueProperty('Shopping');
        return 'Shopping';
    }
    if (placeType === 'park') {
        pushUniqueProperty('Parks');
        return 'Parks';
    }
    if (placeType === 'night_club' || placeType === 'museum' || placeType === 'bowling_alley' || placeType === 'movie_theater') {
        pushUniqueProperty('Entertainment');
        return 'Entertainment';
    }
}
// Create a marker for every place found
function createMarker(place) {
    var placeType;

    // iterating till we find a match between placeTypes and place.types(each place has array of types)
    $.each(place.types, function(index, value) {
        if ($.inArray(value, placeTypes) !== -1) {
            placeType = value;
            return false;
        }
    });

    var data = {
        map: map,
        position: place.geometry.location,
        details: place,
        icon: mapIcons[placeType].url
    };

    var marker = new google.maps.Marker(data);

    placeType = assignCategory(placeType);
    markersByCategory[placeType].push(marker);

    google.maps.event.addListener(marker, 'click', function() {
        // turn off info window bounce if info window was previously open
        google.maps.event.trigger(infoWindowPlaces, 'closeclick');
        marker.setAnimation(google.maps.Animation.BOUNCE);
        // get street view photo of a place
        streetviewURL = 'https://maps.googleapis.com/maps/api/streetview?size=160x120&location=' + marker.position.lat() + ',' + marker.position.lng();
        // the content we are going to present of info window might not be available
        if (marker.details.vicinity === undefined)
            marker.details.vicinity = '';

        if (marker.details.international_phone_number === undefined)
            marker.details.international_phone_number = '';

        if (marker.details.website === undefined)
            marker.details.website = '';

        // set info window content
        var contentString =
        '<h2 id="infoWindow-h2">' + place.name + '</h2>' +
        '<div id="infoWindow-container">' +
        '<div id="infoWindow-img-div">' +
        '<img src=' + streetviewURL + '></img>' +
        '</div>' +
        '<div id="infoWindow-content-div">' +
        '<span>' + marker.details.vicinity + '</span>' + '<br>' +
        '<span>' + marker.details.international_phone_number + '</span>' + '<br>' +
        '<a href="' + marker.details.website + '" target="_blank">' + marker.details.website + '</a>' +
        '</div>' +
        '</div>';

        infoWindowPlaces.setContent(contentString);
        infoWindowPlaces.open(map, this);

        google.maps.event.addListener(infoWindowPlaces, 'closeclick', function() {
            marker.setAnimation(null);
        });
    });

    markers.push(marker);
}
//set or remove markers on map
function setMapOnAll(map, array) {
    for (var i = 0; i < array.length; i++) {
        array[i].setMap(map);
    }
}
// // get wikipedia articles by geolocation and return and array of of articles
function wikipediaAjax(lat, lng, limit, radius) {
    //WIKI API
    return $.ajax({
        type: "GET",
        url: 'https://en.wikipedia.org/w/api.php?action=query&prop=coordinates%7Cpageimages%7Cpageterms&colimit=50&piprop=thumbnail&pithumbsize=144&pilimit=50&wbptterms=description&generator=geosearch&ggscoord=' +
        lat + '%7C' + lng + '&ggsradius=' + radius + '&ggslimit=' + limit + '&format=json&callback',
        dataType: "jsonp"
    });
}

// get wikipedia articles around current location
// arguments : lat,lng,articles limit,radius
function makeWikipediaAjaxRequest(lat, lng, limit, radius) {
    // remove previous data acquired
    wikipediaArticles = [];
    if (typeof currentBinding !== 'undefined') {
        currentBinding.articles.removeAll();
    }
    wikipediaAjax(lat, lng, limit, radius).done(function(articles) {
        // if we did not find any articles we create anounce it to the user
        if (articles.hasOwnProperty('query') === false) {
            var nonExistingArticle = {};
            nonExistingArticle.title = 'Wikipedia articles were not found';
            nonExistingArticle.url = '#';

            if (typeof currentBinding !== 'undefined') {
                currentBinding.articles.push(nonExistingArticle);
                $('.map-menu-elements a')[0].style.pointerEvents = 'none';
                $('.wikipedia-articles-container .map-menu-elements')[0].style.cursor = 'default';
                return;
            }
            wikipediaArticles.push(nonExistingArticle);
            $('.map-menu-elements a')[0].style.pointerEvents = 'none';
            $('.wikipedia-articles-container .map-menu-elements')[0].style.cursor = 'default';
            return;
        }
        // ajax request return an object with pages property which has array of articles
        for (var property in articles.query.pages) {
            if (articles.query.pages.hasOwnProperty(property)) {
                // we form an object with wikipedia URL(from returned page id) and title
                var wikipediaArticle = new article(articles.query.pages[property].pageid, articles.query.pages[property].title);
                wikipediaArticles.push(wikipediaArticle);
                // if the binding was created we push to the observable array
                if (typeof currentBinding !== 'undefined') {
                    currentBinding.articles.push(wikipediaArticle);
                }
            }
        }
    }).fail(function() {
        var nonExistingArticle = {};
        nonExistingArticle.title = 'Wikipedia articles were not found';
        nonExistingArticle.url = '#';

        wikipediaArticles.push(nonExistingArticle);
        $('.wikipedia-articles-container .map-menu-elements')[0].style.cursor = 'default';
        $('.wikipedia-articles-container .map-menu-elements')[0].style.cursor = 'default';
        // if the binding was created we push to the observable array
        if (typeof currentBinding !== 'undefined') {
            currentBinding.articles.push(nonExistingArticle);
        }
    });
}
