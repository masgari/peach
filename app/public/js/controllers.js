'use strict';


function IndexCtrl($scope, $http) {
}

function LoginCtrl($scope, $http, $rootScope, $location) {
    $scope.user = {};
    $scope.statusMessage = '';

    //figure out where we should redirect to once the user has logged in.
    if (!$rootScope.redirect || $rootScope.redirect == '/login') {
        $rootScope.redirect = '/album';
    }

    $scope.submit = function (user) {
        $http.post('/user/login', $scope.user)
            .success(function (data) {
                $rootScope.user.username = $scope.user.username;
                $location.path($rootScope.redirect);
            })
            .error(function (data, status, headers, config) {
                $scope.statusMessage = data;
            });
    }
}

function RegisterCtrl($scope, $http, $rootScope, $location) {
    $scope.user = {};
    $scope.statusMessage = '';

    $scope.submit = function (user) {
        $http.post('/user/register', $scope.user)
            .success(function (data) {
                $rootScope.user.username = $scope.user.username;
                $location.path('/album');
            })
            .error(function (data, status, headers, config) {
                $scope.statusMessage = data;
            });
    }
}

function TodosCtrl($scope, $http, Todo) {

    //get the todos from server
    getTodosFromServer();

    $scope.newTodo = {};

    //function to create a new Todo object
    $scope.createTodo = function (todo) {
        if ($scope.newTodoForm.$invalid) {
            return;
        }
        Todo.save({}, $scope.newTodo,
            function (data) {
                $scope.todos.push(data);
                $scope.statusMessage = '';
                $scope.newTodo = {};

            },
            function (data, status, headers, config) {
                $scope.statusMessage = data;
            });
    };

    //we'll call this function when the checkbox of a todo is checked
    $scope.markComplete = function (todo) {
        todo.$save({id: todo._id});
    };

    //remove complete todos
    $scope.removeComplete = function () {
        $scope.todos.forEach(function (todo) {
            if (todo.complete) {
                todo.$delete({id: todo._id}, function(){                    //delete on server
                    $scope.todos.splice( $scope.todos.indexOf(todo), 1 );   //remove from client
                });
            }
        })
    };

    function getTodosFromServer() {
        Todo.query(function (data) {
            $scope.todos = data;
        });
    }

}

function AlbumListCtrl($scope,$location, PeachImage) {

}

function AlbumCtrl($scope, PeachImage) {
    //get images from server
    getImagesFromServer();

    $scope.uploadFile = function (content, completed) {
        console.log(content);
        $scope.uploadResponse1 = content.msg;
        //on server side it will be redirected to /album
    };

    $scope.removePhoto = function(index) {
        if (!$scope.images || index < 0 || index >= $scope.images.length) {
            return;
        }
        var del = $scope.images[index];
        console.log('deleting image:'+del._id);
        console.log('PeachImage:'+PeachImage);
        PeachImage.delete({id:del._id}, function() {
            $scope.images.splice(index, 1);
        });
    };

    function getImagesFromServer() {
        PeachImage.query(function (data) {
            $scope.images = data;
        });
    }
}

function PhotoDetailCtrl($scope,$routeParams,$location, PeachImage) {
    $scope.photoId = $routeParams.photoId;
    console.log('photo:'+$scope.photoId);

    $scope.removePhotoById = function() {
        console.log('PeachImage, removing photo:'+$scope.photoId);
        PeachImage.delete({id:$scope.photoId}, function() {
            $location.path('/album');
        });

    }
}