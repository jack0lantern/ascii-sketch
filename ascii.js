/* jslint node: true */
'use strict';

/*** GENERIC COMMENTS ***/
// TODO: This file is one biiiig file of js. Shall we modularize somehow?
//http://stackoverflow.com/questions/6921111/how-to-trigger-backspace-on-a-textfield    This is why we update the text field instead of 'triggering a backspace'
// TODO: features:
//  -pencil tool
//  -handy character map
//  -line straigtener by SHIFT

// CURRENTLY WORKING ON:
//  -line-straightening
//   -need to determine initial user caret position: seems impossible atm
//  -adding to the UI
//  -Some browsers (FF) remember form data on refresh: this is a problem since the box 
//   would be inconsistent with the form

/*** CONSTANTS ***/
var BACKSPACE = 8;
var TAB = 9;
var ENTER = 13;
var SHIFT = 16;
var CTRL = 17;
var CAPS_LOCK = 20;
var CHAR_C = 3;
var CHAR_P = 15;    // TODO not sure, lol
var CHAR_X = 24;
var CHAR_Y = 25;
var CHAR_Z = 26;
//arrow keys are 37-40
var DELETE = 46;    //keycodes, duh
var WINDOWS = 91;
var MENU = 93;
var CHAR_SPACE = ' '; // put in ui.js
var DEFAULT_ROWS = 40; // put in ui.js
var DEFAULT_COLS = 80; // put in ui.js
var MAX_BOX_WIDTH = 1000; // put in ui.js
var MAX_BOX_HEIGHT = 1000; // put in ui.js
var TAB_CONTENT_SUFFIX = '_content';
var IS_MAC = navigator.platform.match(/Mac/i) ? true : false;// put in ui.js

/*** GLOBAL VARIABLES ***/
var r;              // the number of rows in the box    // put in ui.js
var c;              // the number of cols in the box    // put in ui.js
var spaces = '';         // A padder line representing an empty, bordered line. e.g. "   |\n"
var currStr = '';        // the string that goes in the box // put in ui.js
var position;       // index of cursor in text area // put in ui.js
var selection;      // two-element array of user selection  // put in ui.js
var wrap = true;    // TODO: implement toggle text wrap to next line    // put in ui.js
//use set variable to determine if the box has been set before 
var DEBUG = false;
var mouseDown = false;

var hasBorders = false; // put in ui.js

/*** CONSTRUCTORS ***/
// Container for a string representing the canvas
function Image(s, pos) {// TODO: put in model.js
    this.s = s;
    this.pos = pos;
    this.prev = null;
    this.ir = r;
    this.ic = c;
    this.sp = spaces;
    this.hb = hasBorders;
}

// Stack that takes an element with a prev property, hopefully Images
function Stack() {// TODO: put in model.js
    this.top = null;
    this.pop = function() {
        var temp = this.top;
        if (temp) {
            this.top = temp.prev;
        }
        return temp;
    };
    this.push = function(img) {
        if (img) {
            img.prev = this.top;
            this.top = img;
        }
    };
}

function Node(item) {// TODO: put in model.js
    this.item = item;
    this.next = null;
}

function Queue() {// TODO: put in model.js
    this.front = null;
    this.back = null;
    
    // takes an item (not a node) and enqueues it.
    this.enqueue = function(item) {
        if (!this.front)
            this.back = this.front = new Node(item);
        else {
            var newNode = new Node(item);
            this.back.next = newNode;
            this.back = newNode;
        }
    }
    
    // returns and dequeues the node (not item) in the front
    this.dequeue = function() {
        if (this.front) {
            var temp = this.front;
            this.front = this.front.next;
            if (!this.front)
                this.back = null;
            return temp;
        }
    }
    
    this.isEmpty = function() {
        return this.front === null;
    }
    
    this.toString = function() {
        var p = '[';
        var curr = this.front;
        while (curr != null) {
            p += curr.item + ', ';
            curr = curr.next;
        }
        return p + ']';
    }
}

// 
function Vector2D(x, y) { // TODO: put in model.js
    this.x = x;
    this.y = y;
    this.length = function() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    };
    this.dotProduct = function(v) {
        if (v.dimension === this.dimension) 
            return this.x * v.x + this.y * v.y;
    };
    this.projectToUnit = function(v) {
        var scalar = this.dotProduct(v) / v.length();
        if (isNaN(scalar))
            scalar = 0;
        return new Vector2D(scalar * v.x, scalar * v.y);
    };
}

/*** GLOBAL OBJECTS ***/
//var copyLinearArgs = {
//    ch: '/',
//    rise: 1,
//    run: 1,
//    stop: 3
//};

var settings = { // put in ui.js
    mode: 'line',                   // 'line', 'block', 'bucket'
    fillMode: 'transparent',        // 'fill', 'transparent', 'custom'
    fillChar: CHAR_SPACE,
//    activeChar: null,
    currentTab: 'draw',
    pasteTransparent: false
};

var sqrt2by2 = Math.sqrt(2)/2; // TODO: put in model.js
var unitVectors = { // TODO: put in model.js
    NW: new Vector2D(-sqrt2by2, sqrt2by2),
    N: new Vector2D(1, 0),
    NE: new Vector2D(sqrt2by2, sqrt2by2),
    E: new Vector2D(0, 1)
};

var undo = new Stack();// TODO: put in model.js
var redo = new Stack();// TODO: put in model.js

var clipboard = [];

/*** DEBUG ***/
function testCharMap() {
    for (var i = 127; i < 1000; i++)
        document.getElementById('debug').innerHTML += '&#' + i + '; ';
}

/*** BASIC FUNCTIONS ***/

(function ($) { // put in ui.js
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

function setSelectionRange(input, selectionStart, selectionEnd) {// put in ui.js
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
function getSelectionRange(input) { // put in ui.js
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

function setFillChar() {    // TODO: put in ui.js
    settings.fillChar = document.getElementById('fillChar').value;
}

function setCaretToPos (input, pos) {   // put in ui.js
  setSelectionRange(input, pos, pos);
}

/* Sets whatever is in the area to currStr. This is necessary because 
 * onkeydown/up/press executes js but never knows the result of the action. */
function setCurr() {    // put in ui.js
    currStr = document.getElementById('area').value;
}

/* puts whatever is in currStr in the textarea, then sets currStr.
 * An essential function to call before performing any kind of text area
 * manipulation. */
function setArea() {// put in ui.js
    document.getElementById('area').value = currStr;
    setCaretToPos(document.getElementById('area'), position);
}

// returns the line at a given row index. This cuts off the ending \n.
function getLine(line, withNewLine) {    // lines are 0 indexed// TODO: put in ui.js
    if (line < r) {
        var str = '';
        var newlineIndex = currStr.indexOf('\n');  // find first instance of \n
        var addNewline = withNewLine ? 0 : 1;
        str = currStr.substring(line * (newlineIndex + 1), (line + 1) * (newlineIndex + 1) - addNewline);
        return str;
    }
    return '';
}

// Sets the value of global position to wherever user cursor is
function setPos() {// TODO: put in ui.js
    return position = $('#area').getCursorPosition(); //position is the OLD location of the cursor before typing
}

// returns the row index from the cursor position.
function getRow(pos) {// TODO: put in ui.js
    return Math.floor(pos / (hasBorders ? (c + 2) : (c + 1)));
}

// returns the col index from the cursor position.
function getCol(pos) {// TODO: put in ui.js
    return pos % (hasBorders ? (c + 2) : (c + 1));
}

// return the textarea index of the character at a specified row and col
function positionFromCoordinates(ri, ci) {// TODO: put in ui.js
   return ri * (hasBorders ? (c + 2) : (c + 1)) + ci; 
}

function adjustBox() {// put in ui.js
    document.getElementById('area').rows = r + 1;
    document.getElementById('area').cols = c + 1;
        
    document.getElementById('h').value = r;
    document.getElementById('w').value = c;
}

function clearStacks() {// TODO: put in model.js
    undo = new Stack();
    redo = new Stack();
}

function resetCurrStr() {// put in ui.js
    var i;
    var j;
    var border = hasBorders ? '|' : '';
    currStr = '';
    for (i = 0; i < c; i++) { 
        spaces += CHAR_SPACE;
    }
    spaces += border + '\n';
    for (j = 0; j < r; j++) {
        if (j < r - 1)
            currStr += spaces;
        else
            currStr += spaces.substring(0, spaces.length - 1);  // chop off last \n
    }
}

function confirmReset() {// TODO: put in ui.js
    var reset = confirm('Are you sure you want to clear the image? All your work will be lost. Press OK to continue or Cancel to cancel.');
    if (reset) {
        makeBox(parseInt(document.getElementById('h').value), parseInt(document.getElementById('w').value));
        clearStacks();
    }
}

function makeBox(rows, cols) {// put in ui.js
    spaces = '';
    currStr = '';
    r = Math.min(parseInt(rows), MAX_BOX_HEIGHT);
    c = Math.min(parseInt(cols), MAX_BOX_WIDTH);
    
    var boxCode = '<textarea id="area" spellcheck="false"></textarea>';
    // TODO: configure the css to have white-space: nowrap; since HTML wrap is deprecated
    resetCurrStr();

    //document.getElementById('content').innerHTML = spaces;
    document.getElementById('boxes').innerHTML = boxCode;
    setArea();
    
    adjustBox();
    
    $('#area').on('cut', function(event) {
        copy(true);
    });
    $('#area').on('copy', function(event) {
        copy(false);
    });
    $('#area').on('paste', function(event) {
        event.preventDefault();
        paste();
    });
    document.getElementById('area').addEventListener('click', function() {
        document.getElementById('dims').innerHTML = '';
    });
    document.getElementById('area').addEventListener('keydown', nonKeyPress);
    document.getElementById('area').addEventListener('keypress', changeChar);
    document.getElementById('area').addEventListener('keyup', setFooterCoords);
    document.getElementById('area').addEventListener('mousedown', function() {
        setMouseDown();
        setFooterCoords(); 
        setCaretToPos(document.getElementById("area"), 0);
    });
                                                            
    document.getElementById('area').addEventListener('mousemove', setFooterCoords); 
    document.getElementById('area').addEventListener('mouseup', function() {
        setFooterCoords(); setMouseUp()
    });
    document.getElementById('area').addEventListener('dragstart', function() {return false});
    document.getElementById('area').addEventListener('drop', function() {return false});
    document.getElementById('area').rows = r;
    document.getElementById('area').cols = c;
    document.getElementById('area').wrap = "off";
}

// Grow or shrink the textarea's dimensions while maintaining content as much as possible. Chops off content on shrink, adds spaces on grow.
function changeBox(rows, cols) {// TODO: put in ui.js
    rows = Math.min(parseInt(rows), MAX_BOX_HEIGHT);
    cols = Math.min(parseInt(cols), MAX_BOX_WIDTH);
    var emptyRow = '';
    var newStr = '';

    if (r === rows && c === cols)
        return;
    
    setCurr();
    for (var i = 0; i < cols; i++)
        emptyRow += CHAR_SPACE;    // O(n^2)
    emptyRow += (hasBorders ? '|' : '');
    spaces = emptyRow + '\n';   
    
    var numSpacesToAdd = cols - c;
    var spacesToAdd = '';
    for (var i = 0; i < numSpacesToAdd; i++)
        spacesToAdd += CHAR_SPACE;
    if (cols < c) {
        for (var currRow = 0; currRow < rows; currRow++) {
            if (currRow >= r)
                newStr += emptyRow;
            else
                newStr += getLine(currRow, false).substring(0, cols) + (hasBorders ? '|': ''); 
            if (currRow < rows - 1)
                newStr += '\n';
        }
    }
    else {  // cols >= c

        for (var currRow = 0; currRow < rows; currRow++) {
            if (currRow >= r)
                newStr += emptyRow;
            else
                newStr += getLine(currRow, false).substring(0, c) + spacesToAdd + (hasBorders ? '|' : '');
            if (currRow < rows - 1)
                newStr += '\n';
        }
    }
    
    currStr = newStr||currStr;
    setArea();
    r = rows;
    c = cols;
    
    adjustBox();
}

function init() {
    if (IS_MAC) {
        var cmds = document.getElementsByClassName('cmd');
        for (var i = 0; i < cmds.length; i++) {
            cmds[i].innerHTML = 'Command';
        }
    }
    makeBox(DEFAULT_ROWS, DEFAULT_COLS);
}

// Pushes a change to currStr to undo
function pushUndo() {// TODO: put in ui.js
    undo.push(new Image(currStr, position + 1));
    redo = new Stack();
}

// Pops from the undo stack and sets the stack top to the image
function popUndo() {// TODO: put in ui.js
    var ret;
    redo.push(ret = undo.pop(), position);
    if (undo.top) {
        r = undo.top.ir;
        c = undo.top.ic;
        spaces = undo.top.sp;
        currStr = undo.top.s;
        setArea();
        if (hasBorders != undo.top.hb) {
            hasBorders = undo.top.hb;
            toggleBorders();
        }
    }
    else {
        makeBox(r, c);
    }
    
    setCaretToPos(document.getElementById('area'), undo.top.pos);
    adjustBox();
    return ret;
}

// Pops from the redo stack and sets the stack top to the image
function popRedo() {// TODO: put in ui.js
    var undid = redo.top;
    undo.push(redo.pop());
    if (undid) {
        r = undid.ir;
        c = undid.ic;
        spaces = undid.sp;
        currStr = undid.s;
        setArea();
        if (hasBorders != undid.hb) {
            hasBorders = undid.hb;
            toggleBorders();
        }
        setCaretToPos(document.getElementById('area'), undid.pos);
        adjustBox();
    }
    return undid.s;
}

/*
onkeydown:
1. script runs
2. key executes
a a a a ... a   | \n
0 1 2 3 ... c-1 c c+1

TODO should do nothing on (but no preventDefault()):
esc, f1, f2, ... f12, prtsc, (ins?), home, end, pgUp, pgDown, tab, capslock, shift(unless its with a char), ctrl, alt, windows, command, apple, arrow keys, menu, scroll lock, num lock
*/
function changeChar(e) {// TODO: split
    var unicode = null;
    
    var range = getSelectionRange(document.getElementById('area'));
    
    if (window.event) { // IE					
            unicode = e.keyCode;
    }else
        if (e.which) { // Netscape/Firefox/Opera					
            unicode = e.which;
         }
    
    if (!(e.altKey || e.ctrlKey) && unicode) {
        var row = getRow(position);
        var d = getCol(position);

        setPos();
        setCurr();

        var start = range[0], end = range[1];
        if (d < c) { // d is the column index. index c is either the | or newline, depending on whether or not borders are on.
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
    setFooterCoords();
}

function nonKeyPress(e) {// TODO: split
    if (!(e.altKey || e.ctrlKey)) {
        var unicode = null;
        if (window.event) { // IE					
            	unicode = e.keyCode;
        }else
            if (e.which) { // Netscape/Firefox/Opera					
                unicode = e.which;
             }
        
        setPos();
        setCurr();
        var d = getCol(position);
        
        if (unicode === BACKSPACE) {
            if (d > c || d == 0) {
                e.preventDefault();
                setCaretToPos(document.getElementById('area'), position - 1);
            }
            else {
                currStr = currStr.substring(0, position) + ' ' +  currStr.substring(position);
                setArea();
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
    setFooterCoords();
}

/*** INTERFACE ***/
function retainSelection() {// TODO: put in ui.js
    // TODO: UNDER CONSTRUCTION
//    var range = getSelectionRange(document.getElementById('area'));
//    setSelectionRange(document.getElementById('area'), range[0], range[1]);
}

// Assigns correct user choices to settings global object
function setBlockRadioSettings() {// TODO: put in ui.js
    if (document.getElementById('fill').checked) {
        if (document.getElementById('fillSame').checked)
            settings.fillMode = 'fill';
        else if (document.getElementById('fillDiff').checked) {
            settings.fillMode = 'custom';
            settings.fillChar = document.getElementById('fillChar').value;
        }
    }
    else
        settings.fillMode = 'transparent';
}

// changes the state of fillMode
function toggleFill() {// TODO: put in ui.js
    if (settings.fillMode === 'transparent') {
        document.getElementById('fillOptions').innerHTML = '<label for="fillChar">with: </label> <br /> <input type="radio" id="fillSame" name="fillOptions" value="same" checked /> <label for="fillSame"> Same characters </label><br /> <input type="radio" id="fillDiff" name="fillOptions" value="diff" /> <label for="fillDiff">This character: </label><input type="text" class="text" id="fillChar" maxlength="1" value=" " onChange="setBlockRadioSettings()" />';
    }
    else {
        document.getElementById('fillOptions').innerHTML = '';
    }
    setBlockRadioSettings();
}

// Sets the selection mode to user specified mode
function setMode(newMode) {// TODO: put in ui.js
    var oldSetting = $('#' + settings.mode);
    if (settings.mode === 'custom')
        oldSetting = $('#block');
    oldSetting.removeClass('active_img');
    
    settings.mode = newMode;
    $('#' + newMode).addClass('active_img');
}

function openTab(newTab) {// TODO: put in ui.js
    $('#' + settings.currentTab).removeClass('active_tab');
    $('#' + settings.currentTab + TAB_CONTENT_SUFFIX).css('display', 'none');
    
    $('#' + newTab + TAB_CONTENT_SUFFIX).css('display', 'block');
    $('#' + newTab).addClass('active_tab');
    settings.currentTab =  newTab;
}

function setFooterCoords() {// TODO: put in ui.js
    setPos();
    var selection = getSelectionRange(document.getElementById('area'));
    if (DEBUG)
        document.getElementById('debug').innerHTML = selection + " " + position;
    document.getElementById('coords').innerHTML = '(' + getCol(position) + ', ' + getRow(position) + ')';

    if (selection[1] - selection[0]) {
        var x1 = getCol(selection[0]), x2 = getCol(selection[1]);
        var y1 = getRow(selection[0]), y2 = getRow(selection[1]);
        var xdiff = Math.abs(x2 - x1);
        var ydiff = Math.abs(y2 - y1);
        document.getElementById('coords').innerHTML = '(' + x1 + ', ' + y1 + ') -- ' + '(' + x2 + ', ' + y2 + ')';
        document.getElementById('dims').innerHTML = (xdiff + 1) + ' x ' + (ydiff + 1);
    }
}

// Clears the box dimensions area of the footer and sets mouseDown
function setMouseDown() {// TODO: put in ui.js
    mouseDown = true;
}

// Sets mouseDown false.
function setMouseUp() {// TODO: put in ui.js
    mouseDown = false;
}

// Takes a new subject and imposes it on tgt, taking tgt's content where subject has a space.
function mergeOverSpace(subject, tgt) {// TODO: put in model.js
    if (subject && tgt && subject.length === tgt.length) {
        var i = 0;
        var result = '';
        while(i < subject.length) { // TODO: make more efficient with regex? Will be more complicated
            if (subject[i] === CHAR_SPACE)
                result += tgt[i];
            else
                result += subject[i];
            i++;
        }
        return result;
    }
    else
        return null;
}

// display the borders, or don't display the borders.
function toggleBorders() {// TODO: split
    var newStr = '';
    var temp = '';
    var i;
    var offset;
    
    setPos();
    setCurr();
    for (i = 0; i < r; i++) {
        temp = getLine(i, false);
        if (hasBorders)
            newStr += temp.substring(0, temp.length - 1) + (i < (r - 1) ? '\n' : '');
        else
            newStr += temp + '|' + (i < (r - 1) ? '\n' : '');
    }

    hasBorders = !hasBorders;
    if (hasBorders)
        document.getElementById('area').cols = c + 1;
    currStr = newStr;
    setArea();
    offset = hasBorders ? Math.floor(position / (c + 1)): -Math.floor(position / (c + 2));   // adjust cursor for newly removed or inserted borders
    setCaretToPos(document.getElementById('area'), position + offset);
}

function togglePaste() {// TODO: put in ui.js
    settings.pasteTransparent = !settings.pasteTransparent;
}

// When a user double clicks a palette button, they choose a char or not.
function setPalette(inElement) {// TODO: put in ui.js
    // inElement should never be null, but just in case
    if (inElement) {
        inElement.type = 'text';
        inElement.select();
    }
}

function usePalette(inElement) {// TODO: put in ui.js
    var e = $.Event('keypress');
    e.which = inElement.value.charCodeAt(0);
    changeChar(e);
}

/*** MACROS ***/
// Puts a block selection in the clipboard.
// If cut is set, we white-space out the block selection in addition.
function copy(cut) {// TODO: split
    var range = getSelectionRange(document.getElementById('area'));
    var start = range[0], end = range[1];
    var startRow = getRow(start), endRow = getRow(end);
    var startCol = Math.min(getCol(start), getCol(end)), endCol = Math.max(getCol(start), getCol(end));
    startCol = Math.min(startCol, c - 1);
    endCol = Math.min(endCol, c - 1);
    clipboard = [];
    
    var colDiff = endCol - startCol;    
    if (colDiff === 0) {
        return;
    }
    
    if (DEBUG)
        document.getElementById('debug').innerHTML = "SR: " + startRow + " ER: " + endRow + " SC: " + startCol + " EC: " + endCol;
    
    for (var row = startRow; row <= endRow; row++) {
        clipboard.push(currStr.substring(positionFromCoordinates(row, startCol), positionFromCoordinates(row, endCol + 1)));
    }
    
    if (cut) {
        var newStr = currStr.substring(0, positionFromCoordinates(startRow, startCol));
        for (var row = startRow; row <= endRow; row++) {
            newStr += spaces.substring(0, colDiff + 1);
            newStr += currStr.substring(positionFromCoordinates(row, endCol + 1), positionFromCoordinates(row + 1, startCol));
        }
        newStr += currStr.substring(positionFromCoordinates(row, startCol));
        currStr = newStr;
        setArea();
    }
    pushUndo();
}

// Places the contents of clipboard at user cursor to the best of our ability
function paste() {// TODO: split
    if (clipboard.length) {
        setPos();
        var newStr = currStr.substring(0, position);
        var posRow = getRow(position);
        var posCol = getCol(position);
        if (posCol < c) {
            // index in a row string to cut off, in case of overflow
            var cutoff = Math.min(clipboard[0].length, c - posCol);
            var endOfRowIndex = Math.min(c, posCol + clipboard[0].length);
            for (var row = 0; (row < clipboard.length) && ((posRow + row) < r); row++) {
                if (settings.pasteTransparent)
                    newStr += mergeOverSpace(clipboard[row].substring(0, cutoff), currStr.substring(positionFromCoordinates(posRow + row, posCol), positionFromCoordinates(posRow + row, posCol + cutoff)));
                else
                    newStr += clipboard[row].substring(0, cutoff);
                newStr += currStr.substring(positionFromCoordinates(posRow + row, endOfRowIndex), positionFromCoordinates(posRow + row + 1, posCol));
            }

            newStr += currStr.substring(positionFromCoordinates(posRow + row, posCol));
            currStr = newStr;
            setArea();
            pushUndo();
        }
    }
}

// loop through ranges list, if it is within 1 outside of a range, absorb it, otherwise add new range
// return the changed range
function addToRanges(value, ranges) {// TODO: put in model.js
    var changedRange = null;
    for (var i = 0; i < ranges.length && !changedRange; i++) {
        if (i < ranges.length - 1 && value - ranges[i][1] === 1 && ranges[i + 1][0] - value === 1) {
            ranges.splice(i, 2, [ranges[i][0], ranges[i + 1][1]]);
            changedRange = ranges[i];
        }
        else if (ranges[i][0] - value === 1) {
            ranges[i][0]--;
            changedRange = ranges[i];
        }
        else if (value - ranges[i][1] === 1) {
            ranges[i][1]++;
            changedRange = ranges[i];
        }
        else if (ranges[i][0] <= value && value <= ranges[i][1]) {
            changedRange = ranges[i];
        }
    }
    if (!changedRange) {
        var insert = 0;
        if (ranges.length) {
            while(insert < ranges.length && value >= ranges[insert][0]) {
                insert++;
            }
        }
        ranges.splice(insert, 0, [value, value]);
        changedRange = ranges[insert];
    }
    return changedRange;
}

function shouldEnqueue(toReplace, pos, visited) {// TODO: put in model.js
    return visited[pos] === undefined && pos >= 0 && getRow(pos) < r && getCol(pos) < c && currStr.charAt(pos) === toReplace;
}

// Determine a list of ranges in which to assign the new character (in ranges, 
// a array of two-element range arrays, which are inclusive endpoints)
// A dynamic approach
function dynBucketHelper(ranges, toReplace, pos) {// TODO: put in model.js
    var toCheckQ = new Queue();
    var visited = [];
    
    toCheckQ.enqueue(pos);
    visited[pos] = true;

    while(!toCheckQ.isEmpty()) {
        var currentPos = toCheckQ.dequeue().item;
        
        addToRanges(currentPos, ranges);
        
        if (shouldEnqueue(toReplace, currentPos - 1, visited)) {
            toCheckQ.enqueue(currentPos - 1);
            visited[currentPos - 1] = true;
        }
        if (shouldEnqueue(toReplace, currentPos + 1, visited)) {
            toCheckQ.enqueue(currentPos + 1);
            visited[currentPos + 1] = true;
        }
        if (shouldEnqueue(toReplace, positionFromCoordinates(getRow(currentPos) - 1, getCol(currentPos)), visited)) {
            toCheckQ.enqueue(positionFromCoordinates(getRow(currentPos) - 1, getCol(currentPos)));
            visited[positionFromCoordinates(getRow(currentPos) - 1, getCol(currentPos))] = true;
        }
        if (shouldEnqueue(toReplace, positionFromCoordinates(getRow(currentPos) + 1, getCol(currentPos)), visited)) {
            toCheckQ.enqueue(positionFromCoordinates(getRow(currentPos) + 1, getCol(currentPos)));
            visited[positionFromCoordinates(getRow(currentPos) + 1, getCol(currentPos))] = true;
        }
    }
}

// 
function loadRanges(charToPut, ranges, colDiff) {// TODO: split
    var fillLine = '';
    var newStr = '';
    
    for (var i = 0; i < c; i++)
        fillLine += charToPut;
    
    setCurr();
    setPos();
    setBlockRadioSettings();
    var appendage = '';
    if (colDiff) {
        if (settings.fillMode === 'custom') 
            for (var i = 0; i < colDiff; i++) 
                appendage += settings.fillChar;
        else
            appendage = fillLine;
    }
    
    // ASSERT ranges[0][0] is defined
    if(ranges[0][0] === undefined)
        return;
    newStr = currStr.substring(0, ranges[0][0]);
    for (var i = 0; i < ranges.length; i++) {
        var endIndex = ranges[i][1] - ranges[i][0] + 1;
        newStr += fillLine.substring(0, endIndex);
        if (i < ranges.length - 1) {
            if (settings.mode === 'bucket' || settings.fillMode === 'transparent' || getRow(ranges[i][1]) != getRow(ranges[i + 1][0]))
                newStr += currStr.substring(ranges[i][1] + 1, ranges[i + 1][0]);
            else
                newStr += appendage.substring(0, ranges[i + 1][0] - ranges[i][1] - 1);                            
        }
        else
            newStr += currStr.substring(ranges[i][1] + 1);
    }
    currStr = newStr;
    setArea();
    setCaretToPos(document.getElementById('area'), position);
    pushUndo();
}

function bucket(charToPut, start) {// TODO: split
    var charToFlood = currStr.charAt(start);
    var ranges = [];
    dynBucketHelper(ranges, charToFlood, start);
    //bucketHelper(ranges, charToFlood, [], start);
    loadRanges(charToPut, ranges, 0);
    pushUndo();
}

// Macro to shift all written text in the box right if units > 0, left otherwise.
function shiftHoriz(units) {// TODO: split
    var newStr = '';
    var temp = '';
    var padSpaces = '';
    var i;
    var startIdx = 0;
    var endIdx = c;

    setPos();
    setCurr();
    units = parseInt(units);
    if (units > 0) {
        units = Math.min(c, units); // in case the user puts a number > cols
        endIdx -= units;
    }
    else if (units < 0) {
        units = Math.max(-c, units);
        startIdx -= units;
    }
    else
        return;
    
    for (i = 0; i < Math.abs(units); i++)
        padSpaces += ' ';
    
    for (i = 0; i < r; i++) {
        temp = getLine(i, false);
        if (units > 0)
            newStr += padSpaces;
        newStr += temp.substring(startIdx, endIdx);
        if (units < 0)
            newStr += padSpaces;
        newStr += hasBorders ? '|' : '';
        newStr += i < (r - 1) ? '\n' : '';
    }
    
    currStr = newStr;
    setArea();
    setCaretToPos(document.getElementById('area'), position);
    pushUndo();
}

// Macro to shift all written text in the box up if units > 0, down otherwise.
function shiftVert(units) {// TODO: split
    var newStr = '';
    var temp = '';
    var padLine = '';
    var i;
    var lineLen;
    
    setPos();
    setCurr();
    var startIdx = 0;
    var endIdx = currStr.length;
    units = parseInt(units);
    
    for (i = 0; i < c; i++)
        padLine += CHAR_SPACE;
    padLine += hasBorders ? '|\n' : '\n';

    lineLen = padLine.length;
    if (units > 0) {
        units = Math.min(r, units); // in case the user puts a number > rows
        startIdx += units*lineLen;
    }
    else if (units < 0) {
        units = Math.max(-r, units);
        endIdx += units*lineLen;
    }
    else
        return;
    
    if (units < 0) {
        for (i = 0; i < Math.abs(units); i++)
            newStr += padLine;
    }
    newStr += currStr.substring(startIdx, endIdx);
    if (units > 0) {
        newStr += '\n';
        for (i = 0; i < Math.abs(units); i++)
            newStr += padLine;
        newStr = newStr.substring(0, newStr.length - 1); // take off the last \n
    }
    
    currStr = newStr;
    setArea();
    setCaretToPos(document.getElementById('area'), position);
    pushUndo();
}

// Takes a list, returns a reversed version of that list without modifying it
// (and this is because arguments are passed by value)
function reverseList(list) {// TODO: put in model.js
    var tempVal;
    for (var i = 0; i < Math.floor(list.length/2); i++) {
        tempVal = list[i];
        list[i] = list[list.length - 1 - i];
        list[list.length - 1 - i] = tempVal;
    }
    return list;
}

// Clears out all whitespace surrounding the image and resizes to close on
// the image as tightly as possible.
function trimArea() {// TODO: split
    var matches = [];
    var beginIndex = -1;
    var endIndex = -1;
    var minCol = c - 1, maxCol = 0;
    var re = '';

    setPos();
    setCurr();
    if (hasBorders)
        re = /[^\s][^\n]/gi; // /( [^\s][^\n])|([^\s][^\n]( |\|\n))/gi;
    else
        re = /[^\s]/gi; // /( [^\s])|(([^\s] )|[^\s]\|\n)/gi;
    matches = document.getElementById('area').value.match(re);

    if (matches.length) {
        beginIndex = document.getElementById('area').value.indexOf(matches[0]);
        endIndex = document.getElementById('area').value.lastIndexOf(matches[matches.length - 1]);
    }
    
    // rows have been cut down; trim extra col space now.
    var trimmed = document.getElementById('area').value.substring(beginIndex, endIndex + 1);
    
    if (DEBUG)
        document.getElementById('debug').innerHTML = beginIndex + " " + endIndex;
    
    var line = getRow(beginIndex);
    var stop = getRow(endIndex);
    var currLine;
    
    // find the min and max col values
    for (; line <= stop; line++) {
        currLine = getLine(line, false);
        matches = currLine.match(re);
        
        if (currLine.indexOf(matches[0]) < minCol)
            minCol = currLine.indexOf(matches[0]);
        if (currLine.lastIndexOf(matches[matches.length - 1]) > maxCol)
            maxCol = currLine.lastIndexOf(matches[matches.length - 1]);
    }
    
    if (DEBUG)
        document.getElementById('debug').innerHTML = "min/max col values: " + minCol + " " + maxCol;
    
    // Create the new canvas string
    var newStr = '';
    for (line = getRow(beginIndex); line <= stop; line++) {
        currLine = getLine(line, false);

        newStr += currLine.substring(minCol, maxCol + 1);
        if (hasBorders)
            newStr += '|';
        if (line < stop)
            newStr += '\n';
    }
    
    //document.getElementById('debug').innerHTML = newStr;
    currStr = newStr;
    setArea();
    
    r = stop - getRow(beginIndex) + 1;
    c = maxCol - minCol + 1;
    
    adjustBox();
    pushUndo();
}

// Assigns the global object fields to user input for the purposes of restoring 
// after the copyLinear interface has been hidden
function setCopyLinearArgs() {// TODO: put in ui.js
    copyLinearArgs.ch = document.getElementById('character').value;
    copyLinearArgs.rise = parseInt(document.getElementById('rise').value);
    copyLinearArgs.run = parseInt(document.getElementById('run').value);
    copyLinearArgs.stop = parseInt(document.getElementById('iters').value);
}

// Changes the textarea content so that a character is repeated over a specified interval and frequency in a linear fashion.
// This method requires the user to input everything.
function copyLinear(charToPut, rise, run, stop) {// TODO: split
    var posToPutChars = [];
    var offset = hasBorders ? 2 : 1;
    var p;
    var i;
    setPos();
    var bound = position % (c + offset);
    
    rise = parseInt(rise);
    run = parseInt(run);
    stop = parseInt(stop);
    rise = -rise;   // so that rise actually goes up

    // TODO: change to while loop
    for (p = position, i = 0; 
        bound >= 0 && 
        bound < c &&
        p >= 0 && 
        p < r * (c + offset) && 
        i < stop; 
        p += rise * (c + offset) + run, bound += run, i++) {
        posToPutChars.push(p);
    }

    if (posToPutChars.length === 0)
        return;
    
    // posToPutChars is either monotonically increasing or decreasing.
    // for the purposes of stringing together our new string, we need them increasing.alert(posToPutChars);
    if (posToPutChars.length > 1 && posToPutChars[0] > posToPutChars[1])
        posToPutChars = reverseList(posToPutChars);

    var start = 0;
    var end = posToPutChars[0];
    var newStr = '';
    i = 0;
    
    setPos();
    setCurr();
    while(i < posToPutChars.length) {
        newStr += currStr.substring(start, end) + charToPut;
        //alert(newStr);
        start = end + 1;
        // end becomes an invalid value at the end of the list.
        end = i < posToPutChars.length - 1? posToPutChars[i + 1] : undefined;
        //alert(end);
        i++;
    }
    // fix the fencepost
    newStr += currStr.substring(posToPutChars[i - 1] + 1);
    currStr = newStr;
    setArea();
}

function inRange(value, a, b) {// TODO: put in model.js
    return (a <= value && value <= b) || (b <= value && value <= a);
}

// Draws a line of copies of a character, repeated as frequently as possible over an interval specified by the user's selection
function traceLinear(charToPut, start, end) {// TODO: split
    var startRow = getRow(start), endRow = getRow(end);
    var startCol = getCol(start), endCol = getCol(end);
    // note: rowDiff always >= 0, same CANNOT be said for colDiff
    var rowDiff = endRow - startRow, colDiff = endCol - startCol;
    var rowsMoreThanCols = rowDiff > Math.abs(colDiff);
    var d = rowsMoreThanCols ? colDiff / rowDiff : Math.abs(rowDiff / colDiff);
    d = d || 0; // in case d is NaN due to 0/0
    //document.getElementById('debug').innerHTML = d;
    var ri = startRow, ci = startCol;
    var i = 0;
    var count = 0;

    setPos();
    setCurr();
    
    var newStr;
    //alert(newStr);
    if (rowsMoreThanCols) {
        while(Math.round(ci) >= c) {
            ri++;
            if (colDiff < 0) {
                ci += d;
                continue;
            }
            else {
                newStr = currStr;
                break;
            }
        }
        if (ci < c)
            newStr = currStr.substring(0, positionFromCoordinates(ri, Math.round(ci)));
        while(ri <= endRow && Math.round(ci) < c) {
            var oldri = ri;
            var oldci = ci;
            newStr += charToPut;
            ri++;
            ci += d;
            newStr += currStr.substring(positionFromCoordinates(oldri, Math.round(oldci)) + 1,  positionFromCoordinates(ri, Math.round(ci)));
        }
        var iterationLength = newStr.length;
        newStr += currStr.substring(iterationLength);
    }
    else {
        // if the selected column cannot be written to, skip those iterations
        // until a valid one is computed.
        while(ci >= c) {
            ri += d;
            if (colDiff < 0) {
                ci--;
                continue;
            }
            else {
                newStr = currStr;
                break;
            }
        }
        if (ci < c)
            newStr = currStr.substring(0, positionFromCoordinates(Math.round(ri), ci));
        //alert(ci);
        // Once we have a valid ci, compute the number of chars we write to one line.
        while(inRange(ci, startCol, endCol) && ci < c && (colDiff > 0 || ci >= 0)) {
            var oldri = Math.round(ri);
            var oldci = ci;
            
            var appendage = '';
            do {
                appendage += charToPut;
                ri += d;
                colDiff > 0 ? ci++ : ci--;
            } while(Math.round(ri) === oldri && inRange(ci, startCol, endCol) && ci < c && ci >= 0);
            // chop off count many characters
            if (colDiff < 0) {
                newStr = newStr.substring(0, positionFromCoordinates(oldri, oldci) - appendage.length + 1);
            }
            var newPos = positionFromCoordinates(Math.round(ri), ci);
            newStr += appendage + currStr.substring(positionFromCoordinates(oldri, (colDiff > 0) ? ci : oldci + 1), (inRange(ci, startCol, endCol) && ci < c && ci >= 0) ? newPos : currStr.length);
        }
    }
    
    currStr = newStr;
    setArea();
    pushUndo();
    setCaretToPos(document.getElementById('area'), ++position);   // TODO: setArea already does a cursor shift. this is inefficient.
}

// Create the range set for a block and load it
function traceBlock(charToPut, start, end) {// TODO: split
    var startRow = getRow(start), endRow = getRow(end);
    var startCol = Math.min(getCol(start), getCol(end)), endCol = Math.max(getCol(start), getCol(end));
    // NOTE: "cleaning" the start/end col is not the same kind of behavior tracelinear does, which handles
    // the off-screen cursor as if it were really there
    startCol = Math.min(startCol, c - 1);
    endCol = Math.min(endCol, c - 1);
    // note: rowDiff always >= 0, same CANNOT be said for colDiff
    var rowDiff = endRow - startRow, colDiff = endCol - startCol;    
    if (rowDiff === 0 || colDiff === 0) {
        traceLinear(charToPut, start, end);
        return;
    }
    
    var trueStart = positionFromCoordinates(startRow, startCol);
    var ranges = [[trueStart, trueStart + endCol - startCol], [positionFromCoordinates(endRow, startCol), positionFromCoordinates(endRow, endCol)]];
    
    for (var i = 1; i < endRow - startRow; i++) {
        addToRanges(positionFromCoordinates(startRow + i, startCol), ranges);
        addToRanges(positionFromCoordinates(startRow + i, endCol), ranges);
    }
    
    loadRanges(charToPut, ranges, Math.abs(endCol - startCol) + 1)
}

// Put all the ranges of currStr that must be changes to user-input char into ranges
function getEllipseRanges(start, xRad, yRad) {// TODO: put in model.js
    var xLim = Math.ceil(xRad);
    var yLim = Math.ceil(yRad);
    var xDen = xRad * xRad;
    var yDen = yRad * yRad;
    var dydx = 1;       // NOT NECESSARY, but keeping just cuz math
    var xPivot = 0;//Math.floor(xRad-Math.sqrt(xDen*yDen/(yDen + yDen*yDen/xDen/dydx/dydx))); 
    var yPivot = 0;//Math.floor(yRad - Math.sqrt(yDen*(1 - (xPivot*xPivot/xDen)))); 
    
    var ranges = [];
    
    var startRow = getRow(start);
    var startCol = getCol(start);
    var col;
    var row;
    
    for (var y = yPivot; y < Math.min(2 * yLim - yPivot, r - 1 - startRow); y++) {
        col = startCol + Math.round(-Math.sqrt((1 - Math.pow(y - yRad, 2)/yDen)*xDen) + xRad);
        addToRanges(positionFromCoordinates(startRow + y, col), ranges);
        
        col = startCol + Math.round(Math.sqrt((1 - Math.pow(y - yRad, 2)/yDen)*xDen) + xRad);
        addToRanges(positionFromCoordinates(startRow + y, col), ranges);
    }
    
    // For the octant, xLim is the stopping point, but use 2*xLim-Pivot to mirror it across the y axis. Cuz math.
    for (var x = xPivot; x <= Math.min(2 * xLim - xPivot, c - 1 - startCol); x++) {
        row = startRow + Math.round(-Math.sqrt((1 - Math.pow(x - xRad, 2)/xDen)*yDen) + yRad);
        addToRanges(positionFromCoordinates(row, startCol + x), ranges);

        row = startRow + Math.round(Math.sqrt((1 - Math.pow(x - xRad, 2)/xDen)*yDen) + yRad);
        addToRanges(positionFromCoordinates(row, startCol + x), ranges);
    }
    //alert(ranges);
    return ranges;
}

function traceEllipse(charToPut, start, end) {// TODO: put in ui.js
    var startRow = getRow(start), endRow = getRow(end);
    var startCol = Math.min(getCol(start), getCol(end)), endCol = Math.max(getCol(start), getCol(end));
    // NOTE: "cleaning" the start/end col is not the same kind of behavior tracelinear does, which handles
    // the off-screen cursor as if it were really there
    startCol = Math.min(startCol, c - 1);
    endCol = Math.min(endCol, c - 1);

    // note: rowDiff always >= 0, same CANNOT be said for colDiff
    var rowDiff = endRow - startRow, colDiff = Math.abs(endCol - startCol);    
    if (rowDiff === 0 || colDiff === 0) {
        traceLinear(charToPut, start, end);
        return;
    }
    
    var ranges = getEllipseRanges(positionFromCoordinates(startRow, startCol), (endCol - startCol)/2, (endRow - startRow)/2);
    loadRanges(charToPut, ranges, colDiff);
}

$(document).ready(init);