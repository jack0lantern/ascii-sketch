var CHAR_SPACE = ' ';

function Box (id, DR, DC, MH, MW) {  // TODO: little privacy here
    var DEFAULT_ROWS = this.r = DR;// TODO: delete these vars. just here for legacy reasons
    var DEFAULT_COLS = this.c = DC;
    this.id = id;
    var MAX_HEIGHT = MH;    // TODO: delete these vars. just here for legacy reasons
    var MAX_WIDTH = MW;
    var hasBorders = false;
    var currStr = '';
    var position = 0;
    var range = [0, 0];
    var wrap = true;
    var spaces = '';
    
    this.setPos = function (p) {
        position = p;
    };
    
    this.getPos = function () {
        return position;
    }
    
    this.setCurr = function (s) {
        currStr = s;
    };
    
    this.getCurr = function () {
        return currStr;
    };
    
    /* Sets whatever is in the area to currStr. This is necessary because 
     * onkeydown/up/press executes js but never knows the result of the action. */
    var setCurr = function () {    
        currStr = document.getElementById(this.id).value;
    };

    this.resetCurrStr = function () {
        var i;
        var j;
        var border = hasBorders ? '|' : '';
        currStr = '';
        for (i = 0; i < this.c; i++) { 
            spaces += CHAR_SPACE;
        }
        spaces += border + '\n';
        for (j = 0; j < this.r; j++) {
            if (j < this.r - 1)
                currStr += spaces;
            else
                currStr += spaces.substring(0, spaces.length - 1);  // chop off last \n
        }
    };
    
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
    
     this.setSelectionRange = function (selectionStart, selectionEnd) {
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
    };
    
//    this.resetCurrStr();
    
//    this.curr = currStr;
}

/* puts whatever is in currStr in the textarea, then sets currStr.
 * An essential function to call before performing any kind of text area
 * manipulation. */
function setArea(box) {// put in ui.js
    alert(box.id);
    document.getElementById(box.id).value = box.getCurr();
//    b.setCaretToPos(b.getPos());
}

function adjustBox(box) {
    document.getElementById(box.id).rows = box.r + 1;
    document.getElementById(box.id).cols = box.c + 1;
        
    // The below has not been adjusted to respond to boxes of differing size.
    document.getElementById('h').value = r;
    document.getElementById('w').value = c;
}

function makeBox(box, tareaId) {
    var boxCode = '<textarea id="area" spellcheck="false"></textarea>';
    var boxObj = $('#' + box.id);
    
    document.getElementById(tareaId).innerHTML = boxCode;
    setArea();
    
    adjustBox();
    
    boxObj.on('cut', function(event) {
        copy(true);
    });
    boxObj.on('copy', function(event) {
        copy(false);
    });
    boxObj.on('paste', function(event) {
        event.preventDefault();
        paste();
    });
    boxObj.addEventListener('click', function() {
        document.getElementById('dims').innerHTML = '';
    });
    boxObj.addEventListener('keydown', nonKeyPress);
    boxObj.addEventListener('keypress', changeChar);
    boxObj.addEventListener('keyup', setFooterCoords);
    boxObj.addEventListener('mousedown', function() {
        setMouseDown();
        setFooterCoords(); 
        setCaretToPos(boxObj, 0);
    });
                                                            
    boxObj.addEventListener('mousemove', setFooterCoords); 
    boxObj.addEventListener('mouseup', function() {
        setFooterCoords(); setMouseUp()
    });
    boxObj.addEventListener('dragstart', function() {return false});
    boxObj.addEventListener('drop', function() {return false});
    boxObj.rows = r;
    boxObj.cols = c;
    boxObj.wrap = "off";
}

// User Interface module for handling user settings
var ui = (function () {
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
        // id (like 'box', no #) must begin with a # to be a valid id
        main: new Box('area', 40, 20, 1000, 1000)
    };
    return {settings: settings, boxes: boxes};
})();

// for testing
function testCompiles(){
    var setStr = '                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n               d                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                ';
    var b = ui.boxes.main;
    b.setCurr(setStr);
    setArea(b);
    b.setSelectionRange(10, 20);
//    selectRange(20, 30);
    var sr = b.getSelectionRange();
    alert(b.getCurr());
}

$(document).ready(testCompiles);