(function(angular) {
    angular.module('AsciiApp').controller('SettingController', ['$scope', 'SettingService', function ($scope, SettingService) {
        // Initialize UI values
        var self = this;
        self.shiftValue = SettingService.shiftValue;
        self.modes = [
            {
                name: 'line',
                path: 'img/line.png'
            },
            {
                name: 'block',
                path: 'img/square.png'
                
            },
            {
                name: 'bucket',
                path: 'img/bucket.png'
            },
            {
                name: 'circle',
                path: 'img/circle.png'
            }
        ];

        self.boxHeight = SettingService.getHeight();
        self.boxWidth = SettingService.getWidth();
        self.setDims = function () {
            console.log('setdims called ');
            SettingService.setHeight(this.boxHeight);
            SettingService.setWidth(this.boxWidth);
        };
        self.setMode = function (newMode) {
            SettingService.mode = newMode;
        };
        self.setFillMode = function (newMode) {
            SettingService.fillMode = newMode;
        };
        
        self.setMode = function (mode) {
            SettingService.mode = mode.name;
            console.log(mode.name);
            self.selectedMode = mode;
        };
        self.getActiveClass = function (mode) {
            return (self.selectedMode === mode) ? 'active_tool' : '';
        };
    }]);
}) (window.angular);
