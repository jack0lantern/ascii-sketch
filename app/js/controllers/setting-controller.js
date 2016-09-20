(function(angular) {
    angular.module('AsciiApp').controller('SettingController', ['$scope', 'SettingService', function ($scope, SettingService) {
        // Initialize UI values
        var self = this;
        self.shiftValue = SettingService.shiftValue;
        self.selectedMode = SettingService.mode;
        self.fillChar = SettingService.fillChar;
        
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
            self.selectedMode = mode.name;
        };
        self.getActiveClass = function (mode) {
            return (self.selectedMode === mode.name) ? 'active_tool' : '';
        };
        
        // Modifiers
        self.resetOnConfirm = function () {
            console.log('resetonconfirm called');
            SettingService.confirmReset();
        };
        
        self.changeBoxDims = function () {
            SettingService.changeBox();
        };
        
        self.toggleBoxBorders = function () {
            console.log('toggleboxborders called');
            SettingService.toggleBorders();
        };
        
        self.shiftVert = function (val) {
            SettingService.shiftVert(val);
        };
        
        self.shiftHoriz = function (val) {
            SettingService.shiftHoriz(val);
        };
        self.trim = function () {
            SettingService.trim();
        };
        
        self.fillToggled = false;
        self.toggleFill = function () {
            // The fillToggled check is the NEW value.
            if (self.fillToggled) {
                SettingService.fillMode = 'fill';
            }
            else {
                SettingService.fillMode = 'transparent';
            }
        };
        self.setCustom = function () {
            SettingService.fillMode = 'custom';
        };
        self.setFillSame = function () {
            SettingService.fillMode = 'fill';
        };
    }]);
}) (window.angular);
