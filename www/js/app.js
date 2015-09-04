var app = angular.module('starter', ['ionic', 'firebase', 'ngCordova', 'ngCordovaOauth'])


app.config(function($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise('/')

    $stateProvider.state("detail", {
        url: "/detail/:isbn",
        templateUrl: "detail.html",
        controller: "bookCtrl"
    })

    $stateProvider.state("home", {
        url: "/",
        templateUrl: "home.html",
        controller: "ListCtrl"
    })

    $stateProvider.state("scan", {
        url: "/scan",
        templateUrl: "scan.html",
        controller: "scanCtrl"
    })

    $stateProvider.state("random", {
        url: "/random",
        templateUrl: "detail.html",
        controller: "randomCtrl"
    })



    $stateProvider.state("stream", {
        url: "/stream",
        templateUrl: "stream.html",
        controller: "streamCtrl"
    })

})


.factory("Books", function($firebaseArray) {

    var itemsRef = new Firebase("https://seewardbooks.firebaseio.com/Library");

    $.each(itemsRef, function() {

    })
    return $firebaseArray(itemsRef);

})

.factory("Config", function($firebaseArray) {

    var itemsRef = new Firebase("https://seewardbooks.firebaseio.com/Subjects");

    return $firebaseArray(itemsRef);

})

.controller("streamCtrl", function($scope, $http) {

    $scope.feedData = {};
    //alert(JSON.stringify(window.localStorage['accessToken']));
    if (window.localStorage.hasOwnProperty("accessToken") === true) {
        //alert("intoFunction");
        $http.get("https://graph.facebook.com/v2.2/me/feed", {
            params: {
                access_token: window.localStorage['accessToken'],
                format: "json"
            }
        }).then(function(result) {
            $scope.feedData = result.data.data;

            alert("got result!" + JSON.stringify(result));

        }, function(error) {
            alert("There was a problem getting your profile.  Check the logs for details.");
            console.log(error);
        });
    } else {
        alert("Not signed in");

    }


})


.controller("bookCtrl", function($scope, Books, $stateParams, $ionicSideMenuDelegate) {

    var all = Books;


    for (i = 0; i < all.length; i++) {

        if ($stateParams.isbn == all[i].ISBN) {

            if (!all[i].hasOwnProperty('comments')) {
                all[i].comments = [];
            }
            if (!all[i].hasOwnProperty('fav')) {
                all[i].fav = false;
            }
            $scope.book = all[i];
        }
    }

    $scope.postToFB = function() {

        if (window.localStorage.hasOwnProperty("accessToken") === true) {
            $http.post("https://graph.facebook.com/v2.2/me/feed", {
                params: {
                    access_token: window.localStorage['accessToken'],
                    format: "json",
                    message: "This is a test!"
                }
            }).then(function(result) {
                alert(JSON.stringify(result));
            });
        } else {
            alert("Not signed in");

        }

    }

    $scope.toggleLeft = function() {
        $ionicSideMenuDelegate.toggleLeft();
    };

    $scope.closeSlider = function() {
        $ionicSideMenuDelegate.toggleLeft();
    }



    $scope.favBook = function() {

        if ($scope.book.fav == false) {
            $(".ion-ios-star-outline").removeClass("ion-ios-star-outline").addClass("ion-ios-star");
            $scope.book.fav = true;
            all.$save($scope.book);
            $scope.$apply();
        } else {
            $(".ion-ios-star").removeClass("ion-ios-star").addClass("ion-ios-star-outline");
            $scope.book.fav = false;
            all.$save($scope.book);
            $scope.$apply();
        }



    }


    $scope.setBook = function() {

        all.$save($scope.book);

    }

    $scope.clearComments = function() {
        $scope.book.comments = [];
        all.$save($scope.book);
    }

    $scope.addComment = function() {


        var comment = prompt("What would you like to say?");

        if (comment) {

            $scope.book.comments.push(comment)
            all.$save($scope.book);

        }



    }

})

.controller("scanCtrl", function($scope, $cordovaBarcodeScanner, Books) {

    $scope.foundBook = false;

    $scope.bookNew = {};

    $scope.addBook = function() {

        Books.$add($scope.bookNew)
    }

    $scope.scanBarcode = function() {

        $cordovaBarcodeScanner.scan().then(function(imageData) {


            $.ajax({
                url: "https://www.googleapis.com/books/v1/volumes?q=isbn:" + imageData.text,
                type: "GET",
                dataType: 'json',

            }).done(function(response) {


                for (var i = 0; i < response.items.length; i++) {
                    var item = response.items[i];
                    $scope.bookNew.NAME = item.volumeInfo.title;
                    $scope.bookNew.AUTHOR = item.volumeInfo.authors[0]
                    $scope.bookNew.THUMB = item.id
                    $scope.bookNew.DATE = item.volumeInfo.publishedDate
                    $scope.bookNew.DESCRIPTION = item.volumeInfo.description
                    $scope.bookNew.ISBN = item.volumeInfo.industryIdentifiers[1].identifier
                    $scope.bookNew.SUBJECT = item.volumeInfo.categories[0];

                    $scope.foundBook = true;
                    $scope.$apply()
                }


            });


        }, function(error) {
            alert("An error happened -> " + error);
        });
    };


})

.controller("panelCtrl", function($scope, $http, $ionicScrollDelegate, $ionicSideMenuDelegate, Config, $cordovaOauth) {

    $scope.feedData = {};

    if (window.localStorage.hasOwnProperty("accessToken") === true) {
        $scope.fbLoggedIn = true;
    } else {
        $scope.fbLoggedIn = false;
    }



    $scope.feedData.myPicture = "http://seeward.com/images/web_elements/geek.png"

    if (window.localStorage.getItem('userModal')) {
        $scope.loggedIn = true;
        $scope.user = JSON.parse(window.localStorage.getItem('userModal'))
        $scope.user.img = "http://seeward.com/images/web_elements/geek.png"
    } else {
        $scope.loggedIn = false;
        $scope.user = {};
        $scope.user.img = "http://seeward.com/images/web_elements/geek.png"
    }

    $scope.fbLogin = function() {


        $cordovaOauth.facebook("1660612394174424", ["email", "publish_actions"]).then(function(result) {
            window.localStorage['accessToken'] = result.access_token;
            //alert(JSON.stringify(result));
            $scope.loggedIn = true;
            $scope.showLogin = false;
            $scope.fbLoggedIn = true;
            $scope.showLogin = false;
            $scope.getProfile();

        }, function(error) {
            alert(JSON.stringify(error));
            console.log(error);
        });


    }

    $scope.getProfile = function() {
        if (window.localStorage.hasOwnProperty("accessToken") === true) {
            $http.get("https://graph.facebook.com/v2.2/me/feed", {
                params: {
                    access_token: window.localStorage['accessToken'],
                    format: "json"
                }
            }).then(function(result) {
                $scope.feedData = result.data.data;
                // alert(result)
                $http.get("https://graph.facebook.com/v2.2/me", {
                    params: {
                        access_token: window.localStorage['accessToken'],
                        fields: "picture, name, birthday, hometown",
                        format: "json"
                    }
                }).then(function(result) {
                    //alert(JSON.stringify(result))
                    $scope.feedData.myPicture = result.data.picture.data.url;
                    $scope.feedData.name = result.data.name;
                    $scope.user.img = result.data.picture.data.url;
                    $scope.user.name = result.data.name;

                    $scope.apply();

                    window.localStorage['userModal'] = JSON.stringify($scope.user);
                    
                });
            }, function(error) {
                alert("There was a problem getting your profile.  Check the logs for details.");
                console.log(error);
            });
        } else {
            alert("Not signed in");

        }
    }





    $scope.newCategory = function() {

        result = prompt("Name category to add.");

        if (result) {
            Config.push(result);
        }

    }


    $scope.createUser = function() {

        var ref = new Firebase("https://seewardbooks.firebaseio.com");
        ref.createUser({
            email: $scope.user.email,
            password: $scope.user.pass
        }, function(error, userData) {
            if (error) {
                alert("Error creating user:", error);
            } else {

                $scope.showLogin = false;
                $scope.loggedIn = true;
                $scope.user.userData = userData.uid;

                window.localStorage['userModal'] = JSON.stringify($scope.user);
                $scope.$apply();
            }
        });



    }





    $scope.doLogout = function() {
        $scope.loggedIn = false;
        $scope.fbLoggedIn = false;
        $scope.user.name = "";
        $scope.user.email = "";
        $scope.user.pass = "";
        $scope.user.img = "http://seeward.com/images/web_elements/geek.png"

        window.localStorage.removeItem('userModal');
        window.localStorage.removeItem('accessToken');
        $scope.$apply();
    }

    $scope.doLogin = function() {

        $scope.showLogin = true;
    }
    $scope.toggleLeft = function() {
        $ionicSideMenuDelegate.toggleLeft();
    }

})


.controller("randomCtrl", function($scope, Books, $ionicSideMenuDelegate) {

    $scope.book = Books[Math.floor(Math.random() * Books.length)];

    $scope.favBook = function() {

        if ($scope.book.fav == false) {
            $(".ion-ios-star-outline").removeClass("ion-ios-star-outline").addClass("ion-ios-star");
            $scope.book.fav = true;
            all.$save($scope.book);
            $scope.$apply();
        } else {
            $(".ion-ios-star").removeClass("ion-ios-star").addClass("ion-ios-star-outline");
            $scope.book.fav = false;
            all.$save($scope.book);
            $scope.$apply();
        }



    }


    $scope.setBook = function() {

        all.$save($scope.book);

    }

    $scope.clearComments = function() {
        $scope.book.comments = [];
        all.$save($scope.book);
    }

    $scope.addComment = function() {


        var comment = prompt("What would you like to say?");

        if (comment) {

            $scope.book.comments.push(comment)
            all.$save($scope.book);

        }



    }


})


.controller("FeedController", function($scope, $http, $localStorage, $location) {

    $scope.init = function() {

    };

})


.controller("ListCtrl", function($scope, Books, $filter) {

    $scope.books = Books;

    $scope.favState = false;

    // alert("test: " + window.localStorage['accessToken']);

    $scope.showFavs = function() {
        if ($scope.favState == false) {

            $scope.books = $filter('filter')($scope.books, {
                fav: true
            });


            $(".fav").removeClass("ion-ios-star-outline").addClass("ion-ios-star").addClass("calm");

            $scope.favState = !$scope.favState
        } else {
            $(".fav").removeClass("ion-ios-star").addClass("ion-ios-star-outline").addClass("calm");


            $scope.favState = !$scope.favState
            $scope.books = Books;
            $scope.$apply();
        }

    }

    $scope.addItem = function() {
        var name = prompt("What Book to add?");
        if (name) {
            $scope.books.$add({
                "NAME": name,
            });
        }
    };
})



.run(function($ionicPlatform) {
    $ionicPlatform.ready(function() {

        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            StatusBar.styleDefault();
        }
    });
})