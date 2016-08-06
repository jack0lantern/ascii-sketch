(function(angular) {
    angular.module('AsciiApp').controller('SettingController', ['$scope', 'SettingService', function ($scope, SettingService) {
        // Initialize UI values
        SettingService.height = this.boxHeight = 20;
        SettingService.width = this.boxWidth = 40;
    }]);
}) (window.angular);
