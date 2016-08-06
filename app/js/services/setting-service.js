(function (angular) {
    angular.module('AsciiApp').service('SettingService', ['$rootScope', function($rootScope) {
        return {
            height: 20,
            width: 40,
            spaces: ''
        };
    }]);
}) (window.angular);