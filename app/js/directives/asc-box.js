// Directive extending the functionality of textarea to include paint-like powers
(function (angular) {
    angular.module('AsciiApp').directive('ascBox', function() {
        return {
            restrict: 'A',
            controller: 'BoxController',
            controllerAs: 'box',
            templateUrl: 'js/directives/asc-box.html'
        };
    });
}) (window.angular);