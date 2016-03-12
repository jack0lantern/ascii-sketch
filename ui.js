// yes, I got this from stackoverflow. Use: getCursorPosition() to get the cursor position from any box
(function ($) {
    $.fn.getCursorPosition = function() {
        var el = $(this).get(0);
        var pos = 0;
        if ('selectionStart' in el) {
            pos = el.selectionStart;
        } else if ('selection' in document) {
            el.focus();
            var Sel = document.selection.createRange();
            var SelLength = document.selection.createRange().text.length;
            Sel.moveStart('character', -el.value.length);
            pos = Sel.text.length - SelLength;
        }
        return pos;
    }
})(jQuery);

// http://stackoverflow.com/questions/499126/jquery-set-cursor-position-in-text-area
$.fn.selectRange = function(start, end) {
    if (!end) end = start; 
    return this.each(function() {
        if (this.setSelectionRange) {
            this.focus();
            this.setSelectionRange(start, end);
        } else if (this.createTextRange) {
            var range = this.createTextRange();
            range.collapse(true);
            range.moveEnd('character', end);
            range.moveStart('character', start);
            range.select();
        }
    });
};

function Box (id, DR, DC, MH, MW) {  // TODO: no privacy here
    this.id = id;
    this.r = this.DEFAULT_ROWS = DR;
    this.c = this.DEFAULT_COLS = DC;
    this.MAX_HEIGHT = MH;
    this.MAX_WIDTH = MW;
    this.currStr = '';
    this.postion = 0;
    this.range = [0, 0];
    this.wrap = true;
    var setSelectionRange = function (selectionStart, selectionEnd) {
        var input = document.getElementById(this.id);  // alternatively, $(id)
        if (input.setSelectionRange) {
            input.focus();
            input.setSelectionRange(selectionStart, selectionEnd);
        }
        else if (input.createTextRange) {
            var range = input.createTextRange();
            range.collapse(true);
            range.moveEnd('character', selectionEnd);
            range.moveStart('character', selectionStart);
            range.select();
        }
    }

    // http://stackoverflow.com/questions/275761/how-to-get-selected-text-from-textbox-control-with-javascript
    // returns a two-element array of the selection's start and end indices
    var getSelectionRange = function () {
        var input = document.getElementById(this.id);
        var textComponent = input;
        var startPos;
        var endPos;
    // IE version
    if (document.selection != undefined)
      {
        textComponent.focus();
        var sel = document.selection.createRange();
        startPos = sel.startOffset;
        endPos = sel.endOffset;
      }
      // Mozilla version
      else if (textComponent.selectionStart != undefined)
      {
        startPos = textComponent.selectionStart;
        endPos = textComponent.selectionEnd;
      }
      return [startPos, endPos];
    }
}

// User Interface module for handling user settings
var ui = (function () {
    var CHAR_SPACE = ' ';
    var IS_MAC = navigator.platform.match(/Mac/i) ? true : false;
    var settings = {
        mode: 'line',                   // 'line', 'block', 'bucket'
        fillMode: 'transparent',        // 'fill', 'transparent', 'custom'
        fillChar: CHAR_SPACE,
            //    activeChar: null,     // potentially for custom chars
        currentTab: 'draw',
        pasteTransparent: false
    };
    var boxes = {
        // id (like '#box') must begin with a # to be a valid id
        main: new Box('#box', 40, 20, 1000, 1000)
    };
    return {settings: settings, boxes: boxes};
})();

// for testing
function testCompiles(){
    alert(ui.boxes.main.r);
}

$(document).ready(testCompiles);