'use strict';


angular.module('myApp.services', ['ngResource'])
    .factory('Todo', function ($resource) {
        return $resource('/api/Todo/:id', {}, {
        });
    });

angular.module('myApp.peachImageService', ['ngResource'])
    .factory('PeachImage', function ($resource) {
        var PeachImage =  $resource('/api/Image/:id');
        return PeachImage;
    });
