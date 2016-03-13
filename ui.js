

function Box (id, DR, DC, MH, MW) {  // TODO: no privacy here
    this.id = id;
    this.r = this.DEFAULT_ROWS = DR;
    this.c = this.DEFAULT_COLS = DC;
    this.MAX_HEIGHT = MH;
    this.MAX_WIDTH = MW;
    this.hasBorders = false;
    this.currStr = '';
    this.position = 0;
    this.range = [0, 0];
    this.wrap = true;
    
    // http://stackoverflow.com/questions/275761/how-to-get-selected-text-from-textbox-control-with-javascript
    // returns a two-element array of the selection's start and end indices
    this.getSelectionRange = function () {
        var textComponent = document.getElementById(this.id);
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
    };
    
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
    };
    
    var setCaretToPos = function (pos) {
      setSelectionRange(pos, pos);
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