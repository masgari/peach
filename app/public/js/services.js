'use strict';


angular.module('myApp.services', ['ngResource'])
    .factory('Todo', function ($resource) {
        return $resource('api/Todo/:id', {}, {
        });
    });

angular.module('myApp.services', ['ngResource'])
    .factory('PeachImage', function ($resource) {
        return $resource('api/Image/:id', {}, {
        });
    });
