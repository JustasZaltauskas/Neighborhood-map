var map;
var infoWindow; // global so the info window would not dublicate at any point
var infoWindowPlaces;
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

var Category = function(name) {
    this.name = name;
    this.markers = ko.observableArray([]);

    this.addMarker = function(marker) {
        this.markers.push(marker);
    };
};

// Wikipedia article object we are going to store in articles observable array
var Article = function(pageID, title) {
    this.url = 'https://en.wikipedia.org/?curid=' + pageID;
    this.title = title;
};

var ViewModel = function() {
    var self = this;

    self.moveToSecondPage = undefined; // function will be assignned

    self.places = ko.observableArray([]); // array of Category objects

    self.articles = ko.observableArray([]); // array of Article objects

    self.showMarkerByPlace = function(item, event) {
        google.maps.event.trigger(item, 'click');
    };

    self.currentFilter = ko.observable();

    self.filter = function(name) {
        self.currentFilter(name);
    };

    // filter places by selected category
    self.filteredArray = ko.computed(function() {
        if (!self.currentFilter()) {
            return [];
        } else {
            return ko.utils.arrayFilter(self.places(), function(place) {
                return place.name == self.currentFilter();
            })[0].markers();
        }
    });

    // initialize Google map and google places autocomplete which is used in main page input
    self.initMap = function() {
        try {
            map = new google.maps.Map(document.getElementById('map'), {
                center: {
                    lat: 0,
                    lng: 0
                },
                zoom: 16
            });
            self.initializeAutoComplete();
        } catch (err) {
            alert(err.message);
        }

        google.maps.event.addDomListener(window, "resize", function() {
            var center = map.getCenter();
            google.maps.event.trigger(map, "resize");
            map.setCenter(center);
        });
    };

    // search for places and wikipedia articles around the location , add click event listener on search button
    self.initializeAutoComplete = function() {
        // only search for specific area
        var options = {
            types: ['address']
        };

        var autocomplete = new google.maps.places.Autocomplete(document.getElementById('input-1'), options);

        autocomplete.bindTo('bounds', map);


        autocomplete.addListener('place_changed', function() {
            self.filter();
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

            if (self.moveToSecondPage === undefined) {
                self.moveToSecondPage = function() {
                    window.location = "index.html#secondPage";
                };
            }
            service.nearbySearch(request, self.searchPlacesNearby);
            self.makeWikipediaAjaxRequest(place.geometry.location.lat(), place.geometry.location.lng(), 5, 1000);
        });
    };

    // on location button click find up to 20 places and up to 5 wikipedia articles around current location
    self.getCurrentLocation = function() {
        self.filter();
        window.location = "index.html#secondPage";
        $('.input__field')[0].value = "";

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

                self.makeWikipediaAjaxRequest(position.coords.latitude, position.coords.longitude, 5, 1000);

                // get places around current location
                service.nearbySearch(request, self.searchPlacesNearby);
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
    };

    /**
     * searches for places around given location
     * @param {array} places
     * @param {string} status
     */
    self.searchPlacesNearby = function(places, status) {
        // remove previous markers from map and empty places array
        while (self.places().length !== 0) {
            setMapOnAll(null, self.places()[self.places().length - 1].markers());
            self.places.pop();
        }

        if (places.length === 0) {
            self.places.push(new Category('We could not find any places nearby'));
            $('.map-menu-elements')[0].style.pointerEvents = 'none';
        }

        var placeGlobal;
        // if we got place ,take its ID and form a request for service.getDetails(request, getDetailsCallback)
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            // iterate through each callback result of places
            $.each(places, function(index, place) {
                var service = new google.maps.places.PlacesService(map);

                var request = {
                    placeId: place.place_id
                };
                placeGlobal = place;
                // get place details
                service.getDetails(request, getDetailsCallback);
            });
        }

        function getDetailsCallback(placeDetailed, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                // we get create market with the place details that we got from place service
                self.createMarker(placeDetailed);
            }
            // if getDetails function unsuccessful on placeID
            // we create marker with limited details of place that we already had when called searchPlacesNearby function
            else {
                self.createMarker(placeGlobal);
            }
        }
    };
    /**
     * create a Google maps marker, assign to Category object in self.places array
     * @param {object} place
     */
    self.createMarker = function(place) {
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
            icon: mapIcons[placeType].url,
        };

        placeType = assignCategory(placeType);

        var marker = new google.maps.Marker(data);

        var found = false;

        // if places array is not empty we iterate through it and search for existing place category
        if (self.places().length !== 0) {
            self.places().forEach(function(place) {
                if (place.name === placeType) {
                    found = true;
                    place.addMarker(marker);
                }
            });
        }
        // if places array is empty or we haven't find an existing place category then we create a new one
        if (found === false || self.places().length === 0) {
            var category = new Category(placeType);
            category.addMarker(marker);
            self.places.push(category);
        }

        google.maps.event.addListener(marker, 'click', function() {
            // turn off info window bounce if info window was previously open
            google.maps.event.trigger(infoWindowPlaces, 'closeclick');
            marker.setAnimation(google.maps.Animation.BOUNCE);
            // get street view photo of a place
            var streetviewURL = 'https://maps.googleapis.com/maps/api/streetview?size=160x120&location=' +
                marker.position.lat() + ',' + marker.position.lng() + '&key=AIzaSyAVlDhJyuG8c7HoZjwU7VbE9OraSqJHZd0';
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
    };
    /**
     * show a list of markers(div#markers-menu-container) by selected category
     * @param {object} item
     */
    self.showPlacesByCategory = function(item) {
        // show markers of selected category
        self.places().forEach(function(place) {
            if (place.name !== item.name) {
                setMapOnAll(null, place.markers());
            }
        });
        // delete markers from map
        self.filter(item.name);

        if (document.getElementById('marker-menu-headline') === null) {
            var menuHeadline = document.createElement('h2');
            menuHeadline.innerHTML = item.name;
            menuHeadline.id = 'marker-menu-headline';
            $("#back-button-div").append(menuHeadline);
        } else
            document.getElementById('marker-menu-headline').innerHTML = item.name;

        $("#markers-menu-container").css('opacity', '1');
        $(".map-menu-container").css('opacity', '0');

        $("#markers-menu-container").css('right', '0');
        $(".map-menu-container").css('right', '100%');
        // remove borders on slide
        $(".map-menu-elements").css('border-style', 'none');
    };

    // create aside menu where we display markers of selected category

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
            self.places().forEach(function(place) {
                setMapOnAll(map, place.markers());
            });

            // close previously opened  infoWIndow
            infoWindowPlaces.close();
            // move aside menus
            $("#markers-menu-container").css('opacity', '0');
            $(".map-menu-container").css('opacity', '1');

            $("#markers-menu-container").css('right', '100%');
            $(".map-menu-container").css('right', '0');

            // remove added border-style none
            $('.map-menu-elements').css('border-style', '');
            // remove border from markers menu when we slide
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

        $("#markers-menu-marker-div").attr('data-bind', 'foreach:filteredArray');
        $(".markers-menu-marker-element").attr('data-bind', 'text: $data.details.name , click : $root.showMarkerByPlace');
    }

    // get wikipedia articles around current location
    self.makeWikipediaAjaxRequest = function(lat, lng, limit, radius) {
        // remove previous data acquired
        if (self.articles.length === 0)
            self.articles.removeAll();

        wikipediaAjax(lat, lng, limit, radius).done(function(articles) {
            // if we did not find any articles we create announce it to the user
            if (articles.hasOwnProperty('query') === false) {
                var nonExistingArticle = {};
                nonExistingArticle.title = 'Wikipedia articles were not found';
                nonExistingArticle.url = '#';

                self.articles.push(nonExistingArticle);
                $('.map-menu-elements a')[0].style.pointerEvents = 'none';
                $('.wikipedia-articles-container .map-menu-elements')[0].style.cursor = 'default';
                return;
            }
            // ajax request return an object with pages property which has array of articles
            for (var property in articles.query.pages) {
                if (articles.query.pages.hasOwnProperty(property)) {
                    // we form an object with wikipedia URL(from returned page id) and title
                    var wikipediaArticle = new Article(articles.query.pages[property].pageid, articles.query.pages[property].title);
                    self.articles.push(wikipediaArticle);
                }
            }
        }).fail(function() {
            var nonExistingArticle = {};
            nonExistingArticle.title = 'Wikipedia API does not work';
            nonExistingArticle.url = '#';

            self.articles.push(nonExistingArticle);
            $('.wikipedia-articles-container .map-menu-elements')[0].style.cursor = 'default';
        });
    };

    self.initMap();

    createMarkersToDisplayMenu();
};

// Google map geolocation error handling
function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
        'Error: Your browser doesn\'t support geolocation.');
}
/**
 * return a category for each place type
 * @param {string} placeType
 * @return {string} category name
 */
function assignCategory(placeType) {
    if (placeType === 'restaurant') {
        return 'Restaurants';
    }
    if (placeType === 'bar') {
        return 'Bars';
    }
    if (placeType === 'cafe') {
        return 'Cafes';
    }
    if (placeType === 'shopping_mall' || placeType === 'clothing_store' || placeType === 'shoe_store') {
        return 'Shopping';
    }
    if (placeType === 'park') {
        return 'Parks';
    }
    if (placeType === 'night_club' || placeType === 'museum' || placeType === 'bowling_alley' || placeType === 'movie_theater') {
        return 'Entertainment';
    }
}

/**
 * display or remove markers array on google map
 * @param {object} map
 * @param {array} array
 */
function setMapOnAll(map, array) {
    for (var i = 0; i < array.length; i++) {
        array[i].setMap(map);
    }
}

/**
 * get wikipedia articles around given location within radius
 * @param {number} lat
 * @param {number} lng
 * @param {number} limit
 * @param {number} radius
 * @return {object} object with a property which has a reference to article array
 */
function wikipediaAjax(lat, lng, limit, radius) {
    //wikipedia API
    return $.ajax({
        type: "GET",
        url: 'https://en.wikipedia.org/w/api.php?action=query&prop=coordinates%7Cpageimages%7Cpageterms&colimit=50&piprop=thumbnail&pithumbsize=144&pilimit=50&wbptterms=description&generator=geosearch&ggscoord=' +
            lat + '%7C' + lng + '&ggsradius=' + radius + '&ggslimit=' + limit + '&format=json&callback',
        dataType: "jsonp"
    });
}

function startApp() {
    ko.applyBindings(new ViewModel());
}