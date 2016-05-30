// TODO: DELETE ALL DEBUG SECTIONS

var CHAR_SPACE = ' ';
var TAB_CONTENT_SUFFIX = '_content';

// A box is a logical contrcut representing an individual textarea ("canvas") in which a user can draw on. It by itself should not have the ability to "draw" on itself, but a BoxStencil does that.
// @param id: String stored with no #
function Box (id, rows, cols, MH, MW) {  // TODO: little privacy here
    this.r = rows;
    this.c = cols;
    this.id = id;
    var MAX_HEIGHT = MH;    // TODO: delete these vars. just here for legacy reasons
    var MAX_WIDTH = MW;
    var hasBorders = false;
    var position = 0;
    var range = [0, 0];
    var wrap = true;
    this.bs = new BoxStencil(this);
    this.bd = new BoxDisplay(this);
    // id of the containing div
    this.container = 'boxes';
    
    this.setPos = function () { // put in ui.js
        return position = $(Id(this.id)).getCursorPosition(); //position is the OLD location of the cursor before typing
    };
    
    /*** DEBUG ***/
    this.getPos = function () {
        return position;
    };
    
    // functions, mind you
    this.getCurr = this.bs.getCurr;
    this.setCurr = this.bs.setCurr;
    /*** /DEBUG ***/
    this.resetCurrStr = this.bs.resetCurrStr;
    
    // returns the row index from the cursor position.
    this.getRow = function(pos) {// put in ui.js  - done
        return Math.floor(pos / (hasBorders ? (this.c + 2) : (this.c + 1)));
    };

    // returns the col index from the cursor position.
    this.getCol = function(pos) {// put in ui.js - done
        return pos % (hasBorders ? (this.c + 2) : (this.c + 1));
    };
    
    // return the textarea index of the character at a specified row and col
    this.positionFromCoordinates = function(ri, ci) {// put in ui.js - done
       return ri * (hasBorders ? (this.c + 2) : (this.c + 1)) + ci; 
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
        var input = $(Id(this.id));  // alternatively, $(id)
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
    
    this.setCaretToPos = function (pos) {
        this.setSelectionRange(pos, pos);
    };
    
    this.confirmReset = function () {// put in ui.js
        var reset = confirm('Are you sure you want to clear the image? All your work will be lost. Press OK to continue or Cancel to cancel.');
        if (reset) {
            this.bd.makeBox(parseInt(document.getElementById('h').value), parseInt(document.getElementById('w').value));
            this.bs.clearStacks();
        }
    };
    
    
    // Grow or shrink the textarea's dimensions while maintaining content as much as possible. Chops off content on shrink, adds spaces on grow.
    this.changeBox = function(rows, cols) {// TODO: put in ui.js
        rows = Math.min(parseInt(rows), MAX_BOX_HEIGHT);
        cols = Math.min(parseInt(cols), MAX_BOX_WIDTH);
        this.bs.changeCurrStrDims(rows, cols);
        this.bd.setArea();
        r = rows;
        c = cols;
        this.bd.adjustBox();
    };
    
    /*
    onkeydown:
    1. script runs
    2. key executes
    a a a a ... a   | \n
    0 1 2 3 ... c-1 c c+1

    TODO should do nothing on (but no preventDefault()):
    esc, f1, f2, ... f12, prtsc, (ins?), home, end, pgUp, pgDown, tab, capslock, shift(unless its with a char), ctrl, alt, windows, command, apple, arrow keys, menu, scroll lock, num lock
    */
    this.changeChar = function(e) {// TODO: split
        var unicode = null;

        var range = this.getSelectionRange(document.getElementById(this.id));

        if (window.event) { // IE					
                unicode = e.keyCode;
        }else
            if (e.which) { // Netscape/Firefox/Opera					
                unicode = e.which;
             }

        if (!(e.altKey || e.ctrlKey) && unicode) {
            var row = this.getRow(position);
            var d = this.getCol(position);

            this.setPos();
            this.bs.setCurr();

            var start = range[0], end = range[1];
            if (d < this.c) { // d is the column index. index c is either the | or newline, depending on whether or not borders are on.
                // TODO: SO much repetitive code! There must be a better design.
                if (settings.mode === 'line') {
                    e.preventDefault();
                    traceLinear(String.fromCharCode(unicode), start, end);
                }
                else if (settings.mode === 'block') {
                    e.preventDefault();
                    traceBlock(String.fromCharCode(unicode), start, end);
                }
                else if (settings.mode === 'bucket') {
                    e.preventDefault();
                    bucket(String.fromCharCode(unicode), start);
                }
                else if (settings.mode === 'circle') {
                    e.preventDefault();
                    traceEllipse(String.fromCharCode(unicode), start, end);
                }
                else {
                    // Here's where we actually change a character.
                    currStr = currStr.substring(0, position) + currStr.substring(position + 1);    
                    setArea();
                }
            }
            else {
                // stop user from overwriting the | or newline
                e.preventDefault();
                if (settings.mode === 'line') {
                    traceLinear(String.fromCharCode(unicode), start, end);
                }
                else if (settings.mode === 'block')
                    traceBlock(String.fromCharCode(unicode), start, end);
            }
            if (start != end)
                setSelectionRange(document.getElementById('area'), start, end);
        }
        else if (e.ctrlKey) {  // the key bind at the top of this file takes care of CUT/COPY/PASTE for now
            if (e.which === CHAR_Z) {
                e.preventDefault();// this doesn't actually seem to prevent the default undo action for other textboxes
                popUndo();
            }
            else if (e.which === CHAR_Y) {
                e.preventDefault();
                popRedo();
            }
    //        else if (e.which === CHAR_X) {
    //            alert();
    //            e.preventDefault();
    //            copy(true);
    //        }
    //        else if (e.which === CHAR_C) {
    //            copy(false);
    //        }
    //        else if (e.which === CHAR_P) {
    //            e.preventDefault();
    //            paste();
    //        }
        }
        bd.setFooterCoords();
    };

    this.nonKeyPress = function (e) {// TODO: split
        if (!(e.altKey || e.ctrlKey)) {
            var unicode = null;
            if (window.event) { // IE					
                    unicode = e.keyCode;
            }else
                if (e.which) { // Netscape/Firefox/Opera					
                    unicode = e.which;
                 }

            this.setPos();
            this.setCurr();
            var d = this.getCol(position);

            // the below should be in model.js TODOs
            if (unicode === BACKSPACE) {
                if (d > c || d == 0) {
                    e.preventDefault();
                    setCaretToPos(document.getElementById('area'), position - 1);
                }
                else {
                    this.bs.currStr = this.bs.currStr.substring(0, position) + ' ' +  this.bs.currStr.substring(position);
                    this.bd.setArea();
                }
            }
            else if (unicode === DELETE) {
                if (d >= c)
                    e.preventDefault();
                else {
                    currStr = currStr.substring(0, position + 1) + CHAR_SPACE +  currStr.substring(position + 1);
                    document.getElementById('area').value = currStr;
                    setCaretToPos(document.getElementById('area'), position);
                }
            }
            else if (unicode === ENTER) {
                e.preventDefault();
                setCaretToPos(document.getElementById('area'), positionFromCoordinates(getRow(position) + 1, 0));
            }
            else if (unicode === SHIFT) {
                if (mouseDown) {
                    // Insert code to straighten selection line here
                }
            }
        }
        this.setFooterCoords();
    };
    
    this.setFooterCoords = function () { // put in ui.js
        this.setPos();
        var selection = this.getSelectionRange($(Id(this.id)));
        if (DEBUG)
            document.getElementById('debug').innerHTML = selection + " " + position;
        document.getElementById('coords').innerHTML = '(' + this.getCol(position) + ', ' + this.getRow(position) + ')';

        if (selection[1] - selection[0]) {
            var x1 = this.getCol(selection[0]), x2 = this.getCol(selection[1]);
            var y1 = this.getRow(selection[0]), y2 = this.getRow(selection[1]);
            var xdiff = Math.abs(x2 - x1);
            var ydiff = Math.abs(y2 - y1);
            document.getElementById('coords').innerHTML = '(' + x1 + ', ' + y1 + ') -- ' + '(' + x2 + ', ' + y2 + ')';
            document.getElementById('dims').innerHTML = (xdiff + 1) + ' x ' + (ydiff + 1);
        }
    };
}

function BoxDisplay(outerBox) {
    var box = outerBox;
    /* puts whatever is in currStr in the textarea, then sets currStr.
     * An essential function to call before performing any kind of text area
     * manipulation. */
    this.setArea = function() {// put in ui.js
    //    alert("ui.js: " + document.getElementById(box.id));
        assert(document.getElementById(box.id), 'invalid box id');
        document.getElementById(box.id).value = box.getCurr();
    //    b.setCaretToPos(b.getPos());
    };

    // Sets the box's dimensions to its logical values
    this.adjustBox = function() {
        document.getElementById(box.id).rows = box.r + 1;
        document.getElementById(box.id).cols = box.c + 1;

        // The below has not been adjusted to respond to boxes of differing size.
        document.getElementById('h').value = box.r;
        document.getElementById('w').value = box.c;
    };

    this.makeBox = function(rows, cols) {
        var boxCode = '<textarea id="' + box.id + '" spellcheck="false"></textarea>';
        document.getElementById(box.container).innerHTML = '<div id="box0">' + boxCode + '</div>';
        
        var boxObj = $(Id(box.id));
        
        box.bs.resetCurrStr();
        this.setArea();
        this.adjustBox();

        boxObj.on('cut', function(event) {
            this.copy(true);
        });
        boxObj.on('copy', function(event) {
            this.copy(false);
        });
        boxObj.on('paste', function(event) {
            event.preventDefault();
            this.paste();
        });
        boxObj.on('click', function() {
            document.getElementById('dims').innerHTML = '';
        });
        boxObj.on('keydown', function(e) {
            box.nonKeyPress(e);
        });
        boxObj.on('keypress', function(e) {
            box.changeChar(e);
        });
        boxObj.on('keyup', function() {
            box.setFooterCoords();
        });
        boxObj.on('mousedown', function() {
            setMouseDown();
            box.setFooterCoords(); 
            box.setCaretToPos(boxObj, 0);
        });

        boxObj.on('mousemove', function() {
            box.setFooterCoords();
        }); 
        boxObj.on('mouseup', function() {
            box.setFooterCoords(); 
            setMouseUp();
        });
        boxObj.on('dragstart', function() {return false;});
        boxObj.on('drop', function() {return false;});
        boxObj.wrap = "off";

        boxObj.rows = box.r;
        boxObj.cols = box.c;
    };
    
    // Clears the box dimensions area of the footer and sets mouseDown
    var setMouseDown = function () {// TODO: put in ui.js
        this.mouseDown = true;
    };
    
    // Sets mouseDown false.
    var setMouseUp = function() {// TODO: put in ui.js
        this.mouseDown = false;
    }
    
    this.displayFooterCoords = function(x1, y1, x2, y2) {
        
    };
}

// Class constructor representing a collection of boxes and their associated settings. 
// Currently having only one frame, so window_ is document by default.
function Frame (settings_, boxes_, window_) {
    this.settings = settings_;
    this.boxes = boxes_;
    this.window = window_||document;
    
    // Sets the selection mode to user specified mode
    // @param newMode: HTML element to set the mode of
    this.setMode = function(newMode) {// TODO: put in ui.js
        var oldSetting = $(Id(this.settings.mode));
        if (this.settings.mode === 'custom')
            oldSetting = $(Id('block'));
        oldSetting.removeClass('active_tool');

        this.settings.mode = newMode.id;
        $(Id(newMode.id)).addClass('active_tool');
    }

    // @param newTab: HTML element (a tab, presumably) to activate
    this.openTab = function(newTab) {// TODO: put in ui.js
        $(Id(this.settings.currentTab)).removeClass('active_tab');
        $(Id(this.settings.currentTab) + TAB_CONTENT_SUFFIX).css('display', 'none');

        $(Id(newTab.id) + TAB_CONTENT_SUFFIX).css('display', 'block');
        $(Id(newTab.id)).addClass('active_tab');
        this.settings.currentTab = newTab.id;
    }
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
        main: new Box('area', 20, 40, 1000, 1000)
    };
    
    
    var frames = [new Frame(settings, boxes)];
    
    return {f: frames};
})();

/*** DEBUG ***/
// for testing
function testCompiles(){
    var setStr = '                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n               d                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                ';
//    alert(ui.boxes.main);
    var b = ui.f[0].boxes.main;
    b.setCurr(setStr);
    console.log(b.bd);
    b.bd.makeBox();
//    b.bd.setArea(
    b.setSelectionRange(10, 20);
//    selectRange(20, 30);
    var sr = b.getSelectionRange();
    console.log(b.getCurr());
}

//$(document).ready();
/*** /DEBUG ***/