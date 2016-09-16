// https://github.com/eirikb/angular-caret

// Directive extending the functionality of textarea to include paint-like powers
(function (angular) {
    angular.module('AsciiApp').directive('caret', function() {
        var mousedown = false;

        function getPos(element) {
            if ('selectionStart' in element) {
                return [element.selectionStart, element.selectionEnd];
            } else if (document.selection) {
                element.focus();
                var sel = document.selection.createRange();
                var selLen = document.selection.createRange().text.length;
                sel.moveStart('character', -element.value.length);
                return sel.text.length - selLen;
            }
        }

        function setPos(element, caretPos) {
            if (element.createTextRange) {
                var range = element.createTextRange();
                range.move('character', caretPos);
                range.select();
            } else {
                element.focus();
                if (element.selectionStart !== undefined) {
                    element.setSelectionRange(caretPos, caretPos);
                }
            }
        }

        return {
            restrict: 'A',
            controller: 'BoxController',
            controllerAs: 'box',
            link: function(scope, element, attrs, controller) {
                if (!scope.caret) scope.caret = {};
                scope.caret.setGetPos = function () {
                    if (mousedown) {
                        scope.caret.get = controller.coordsFromRange(getPos(element[0]));
                    }
                }
                scope.caret.setMousedown = function() { mousedown = true; };
                scope.caret.setMouseup = function() {
                    scope.caret.setGetPos();
                    mousedown = false;
                };
                element.on('keydown keyup click', function(event) {
                    scope.$apply(function() {
                        scope.caret.get = controller.coordsFromRange(getPos(element[0]));
                    });
                });
                scope.$watch('caret.set', function(newVal) {
                    if (typeof newVal === 'undefined') return;
                    setPos(element[0], newVal);
                });
            }
        };
    });
}) (window.angular);