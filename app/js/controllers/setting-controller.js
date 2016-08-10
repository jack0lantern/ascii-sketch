(function(angular) {
    angular.module('AsciiApp').controller('SettingController', ['$scope', 'SettingService', function ($scope, SettingService) {
        // Initialize UI values
        var self = this;

        this.boxHeight = SettingService.getHeight();
        this.boxWidth = SettingService.getWidth();
        this.setDims = function () {
            console.log('setdims called ');
            SettingService.setHeight(this.boxHeight);
            SettingService.setWidth(this.boxWidth);
        };
    }]);
}) (window.angular);
