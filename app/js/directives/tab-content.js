
//http://stackoverflow.com/questions/21835471/angular-js-directive-dynamic-templateurl
(function (angular) {
    angular.module('AsciiApp').directive('tabContent', function() {
        return {
           restrict: 'E',
           template: '<div ng-include="main.activeTab.path"></div>'
       };
    })
}) (window.angular);