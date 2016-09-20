(function (angular) {
    angular.module('AsciiApp').service('SettingService', ['$rootScope', function($rootScope) {
        this.height = 20;
        this.width = 40;
        this.shiftValue = 1;
        this.getHeight = function () { return this.height; };
        this.getWidth = function () { return this.width; };
        this.setHeight = function (h) { return this.height = h; };
        this.setWidth = function (w) { return this.width = w; };
        // Currently, a row of width spaces with a border (if toggled) and \n at the end 
        this.spaces = '';
        this.focused = null;
        this.mode = 'line';
        this.fillMode = 'transparent';
        this.fillChar = ' ';
        
        this.confirmReset = function () {
            var reset = confirm('Are you sure you want to clear the image? All your work will be lost. Press OK to continue or Cancel to cancel.');
            if (reset && this.focused) {
                this.focused.makeBox(this.getHeight(), this.getWidth());
            }
        };
        this.changeBox = function () {
            this.focused.crop();
        };
        this.toggleBorders = function () {
            this.focused.toggleBorders();
        };
        this.shiftVert = function (val) {
            this.focused.shiftCurrVert(val);
        };
        this.shiftHoriz = function (val) {
            this.focused.shiftCurrHoriz(val);
        };
        this.trim = function () {
            this.focused.trim();
        };
    }]);
}) (window.angular);