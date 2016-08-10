(function (angular) {
    angular.module('AsciiApp').filter('pointRangeFilter', function () {
        // Filter takes a Range; if the second point is null we treat it as a single point.
        return function (range) {
            if (range.start)
                return '(' + range.start.r + ', ' + range.start.c + ')' + (range.end ? ' -- (' + range.end.r + ', ' + range.end.c + ')' : '');
            else
                return 'ERROR';
        };
    })
}) (window.angular);