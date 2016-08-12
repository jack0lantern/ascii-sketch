(function(angular) {
    angular.module('AsciiApp').controller('SettingController', ['$scope', 'SettingService', function ($scope, SettingService) {
        // Initialize UI values
        var self = this;
        self.shiftValue = SettingService.shiftValue;

        self.boxHeight = SettingService.getHeight();
        self.boxWidth = SettingService.getWidth();
        self.setDims = function () {
            console.log('setdims called ');
            SettingService.setHeight(this.boxHeight);
            SettingService.setWidth(this.boxWidth);
        };
    }]);
}) (window.angular);
