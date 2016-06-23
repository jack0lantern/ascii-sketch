var clipboard = [];
var DEBUG = true;
var BACKSPACE = 8;
var TAB = 9;
var ENTER = 13;
var SHIFT = 16;
var CTRL = 17;
var CAPS_LOCK = 20;

//arrow keys are 37-40
var DELETE = 46;    //keycodes, duh
var WINDOWS = 91;
var MENU = 93;

function log(message) {
    if (DEBUG) console.log(message);
}

/*** CONSTRUCTORS ***/

// Object representing a position in the box.
// r is a number (int) representing the row
// c is a number (int) representing the col
function Point(r, c) {
    this.row = r;
    this.col = c;
}

function PointRange(p1, p2) {
    this.start = p1;
    this.end = p2;
    var colSpan = null;
    var rowSpan = null;
    this.getColSpan = function(getColFun) { 
        this.setColSpan(getColFun);
        return colSpan; 
    };
    this.setColSpan = function(getColFun) {
        // TODO: ensure getColFun is a function
        this.colSpan = getColFun(p2) - getColFun(p1);
    };
    this.getRowSpan = function(getRowFun) { 
        this.setRowSpan(getRowFun);
        return rowSpan; 
    };
    this.setRowSpan = function(getRowFun) {
        // TODO: ensure getColFun is a function
        this.rowSpan = getRowFun(p2) - getRowFun(p1);
    };
}
    
// Container for a string representing the canvas
function Image(box) {// TODO: put in model.js
    this.s = box.s;
    this.pos = box.position;
    this.ir = box.r;
    this.ic = box.c;
    this.sp = box.bs.spaces;
    this.hb = box.hasBorders;
}

function Node(item, nextNode) {// TODO: put in model.js
    this.item = item;
    this.next = nextNode||null;
}

// TODO: test
// Stack that takes an element with a prev property, hopefully Images
function Stack() {// put in model.js - done
    this.top = null;
    this.pop = function() {
        var temp = this.top;
        if (temp) {
            this.top = temp.next;
        }
        return temp;
    };
    this.push = function(img) {
        if (img) {
            this.top = new Node(img, this.top);
        }
    };
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

var sqrt2by2 = Math.sqrt(2)/2; // TODO: put in model.js
var unitVectors = { // TODO: put in model.js
    NW: new Vector2D(-sqrt2by2, sqrt2by2),
    N: new Vector2D(1, 0),
    NE: new Vector2D(sqrt2by2, sqrt2by2),
    E: new Vector2D(0, 1)
};

function assert(condition, message) {
    if (!condition) {
        message = message || "Assertion failed";
        if (typeof Error !== "undefined") {
            throw new Error(message);
        }
        throw message; // Fallback
    }
}

function Id(name) {
    return '#' + name;
}

// Takes a new subject and imposes it on tgt, taking tgt's content where subject has a space.
function mergeOverSpace(subject, tgt) {// put in model.js
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

function inRange(value, a, b) {// put in model.js
    return (a <= value && value <= b) || (b <= value && value <= a);
}

// loop through ranges list, if it is within 1 outside of a range, absorb it, otherwise add new range
// return the changed range
function addToRanges(value, ranges) {// TODO: put in model.js
    var changedRange = null;
    for (var i = 0; i < ranges.length && !changedRange; i++) {
        // If number is one off previous and one off next, merge
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
    
    // If number is not within 1 of any existing ranges, add a new one in sorted order
    if (changedRange === null) {
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

// A manager for its box's string
function BoxStencil(outerBox) {
    var box = outerBox;
    var currStr = '';
    var spaces = '';
    var undo = new Stack();
    var redo = new Stack();
        
    this.setCurr = function (s) {
        currStr = s || document.getElementById(box.id).value;
        log('setCurr called with ' + currStr);
    };
    
    this.getCurr = function () {
        return currStr;
    };
    
    // returns the line at a given row index. This cuts off the ending \n.
    // Mostly a helper.
    this.getLine = function(line, withNewLine) {    // lines are 0 indexed
        if (line < box.r) {
            var str = '';
            var newlineIndex = currStr.indexOf('\n');  // find first instance of \n
            var addNewline = withNewLine ? 0 : 1;
            str = currStr.substring(line * (newlineIndex + 1), (line + 1) * (newlineIndex + 1) - addNewline);
            return str;
        }
        return '';
    };
    
    // Sets currStr to an empty box string
    this.resetCurrStr = function () {
        log('resetCurrStr called');
        var i;
        var j;
        var border = box.hasBorders ? '|' : '';
        currStr = '';
        spaces = '';
        
        for (i = 0; i < box.c; i++) { 
            spaces += CHAR_SPACE;
        }
        spaces += border + '\n';
        for (j = 0; j < box.r; j++) {
            if (j < box.r - 1)
                currStr += spaces;
            else
                currStr += spaces.substring(0, spaces.length - 1);  // chop off last \n
        }
    };
    
    this.shiftCurrHoriz = function (units) {
        var newStr = '';
        var padSpaces = spaces.substring(0, units);
        var i;
        var startIdx = 0;
        var endIdx = box.c;
        
        this.setCurr();
        units = parseInt(units);
        if (units > 0) {
            units = Math.min(box.c, units); // in case the user puts a number > cols
            endIdx -= units;
        }
        else if (units < 0) {
            units = Math.max(-box.c, units);
            startIdx -= units;
        }
        else
            return;

        for (i = 0; i < box.r; i++) {
            temp = this.getLine(i, false);
            if (units > 0)
                newStr += padSpaces;
            newStr += temp.substring(startIdx, endIdx);
            if (units < 0)
                newStr += padSpaces;
            newStr += this.hasBorders ? '|' : '';
            newStr += i < (box.r - 1) ? '\n' : '';
        }
        this.setCurr(newStr);
        this.pushUndo();
    };
    
    this.shiftCurrVert = function (units) {
        var newStr = '';
        var i;
        var lineLen;
        var startIdx = 0;
        var endIdx = this.getCurr().length;
        units = parseInt(units);

        lineLen = spaces.length;
        if (units > 0) {
            units = Math.min(box.r, units); // in case the user puts a number > rows
            startIdx += units*lineLen;
        }
        else if (units < 0) {
            units = Math.max(-box.r, units);
            endIdx += units*lineLen;
        }
        else
            return;

        if (units < 0) {
            for (i = 0; i < Math.abs(units); i++)
                newStr += spaces;
        }
        newStr += this.getCurr().substring(startIdx, endIdx);
        if (units > 0) {
            newStr += '\n';
            for (i = 0; i < Math.abs(units); i++)
                newStr += spaces;
            newStr = newStr.substring(0, newStr.length - 1); // take off the last \n
        }

        this.setCurr(newStr);
        this.pushUndo();
    };
    
    this.clearStacks = function () {// put in model.js - done
        undo = new Stack();
        redo = new Stack();
    };
    
    this.changeCurrStrDims = function(rows, cols) {
        var emptyRow = '';
        var newStr = '';

        if (box.r === rows && box.c === cols)
            return;

        this.setCurr();
        for (var i = 0; i < cols; i++)
            emptyRow += CHAR_SPACE;    // O(n^2)
        
        // should make an accessor for hasborders? used in other places
        emptyRow += (box.hasBorders ? '|' : '');
        spaces = emptyRow + '\n';   

        var numSpacesToAdd = cols - box.c;
        var spacesToAdd = '';
        for (var i = 0; i < numSpacesToAdd; i++)
            spacesToAdd += CHAR_SPACE;
        /*** REFACTOR ***/
        if (cols < box.c) {
            for (var currRow = 0; currRow < rows; currRow++) {
                if (currRow >= box.r)
                    newStr += emptyRow;
                else
                    newStr += this.getLine(currRow, false).substring(0, cols) + (box.hasBorders ? '|': ''); 
                if (currRow < rows - 1)
                    newStr += '\n';
            }
        }
        else {  // cols >= c
            for (var currRow = 0; currRow < rows; currRow++) {
                if (currRow >= box.r)
                    newStr += emptyRow;
                else
                    newStr += this.getLine(currRow, false).substring(0, box.c) + spacesToAdd + (box.hasBorders ? '|' : '');
                if (currRow < rows - 1)
                    newStr += '\n';
            }
        }
        /*** TO: ***/
//        for (var currRow = 0; currRow < rows; currRow++) {
//                if (currRow >= box.r)
//                    newStr += emptyRow;
//                else
//                    newStr += this.getLine(currRow, false).substring(0, (cols < box.c) ? cols : box.c) + spacesToAdd + (box.hasBorders ? '|' : '');
//                if (currRow < rows - 1)
//                    newStr += '\n';
//        }
        /*** /REFACTOR ***/

        currStr = newStr||currStr;
    };
    
    this.writeBorders = function (bordersToSet) {
        var newStr = '';
        this.setCurr();
        for (var i = 0; i < box.r; ++i) {
            var temp = this.getLine(i, false);
            if (bordersToSet) {
                newStr += temp.substring(0, temp.length - 1) + (i < (box.r - 1) ? '\n' : '');
            }
            else {
                newStr += temp + '|' + (i < (box.r - 1) ? '\n' : '');
            }
        }
        this.setCurr(newStr);
    };
    
    this.assignCurrByRange = function (charToPut, ranges, colDiff, settings) {
        var fillLine = '';
        var newStr = '';
        var appendage = '';
        
        for (var i = 0; i < box.c; i++)
            fillLine += charToPut;

        if (settings.fillMode === 'custom') 
            for (var i = 0; i < colDiff; i++) 
                appendage += settings.fillChar;
        else
            appendage = fillLine;

        newStr = currStr.substring(0, ranges[0][0]);
        
        for (var i = 0; i < ranges.length; i++) {
            var endIndex = ranges[i][1] - ranges[i][0] + 1;
            newStr += fillLine.substring(0, endIndex);
            if (i < ranges.length - 1) {
                if (settings.mode === 'bucket' || settings.fillMode === 'transparent' || box.getRow(ranges[i][1]) != box.getRow(ranges[i + 1][0]))
                    newStr += currStr.substring(ranges[i][1] + 1, ranges[i + 1][0]);
                else
                    newStr += appendage.substring(0, ranges[i + 1][0] - ranges[i][1] - 1);                            
            }
            else
                newStr += currStr.substring(ranges[i][1] + 1);
        }
        currStr = newStr;
    };
    
    // Pushes a change to currStr to undo
    this.pushUndo = function () {// put in model.js
        undo.push(new Image(box));
        redo = new Stack();
    };

    // Pops from the undo stack and sets the stack top to the image
    this.popUndo = function () {// TODO: put in ui.js and split to model.js
        var ret;
        redo.push(ret = undo.pop(), position);
        if (undo.top) {
            box.r = undo.top.ir;
            box.c = undo.top.ic;
            spaces = undo.top.sp;
            currStr = undo.top.s;
            box.bd.setArea();
            if (box.hasBorders != undo.top.hb) {
                box.hasBorders = undo.top.hb;
                box.toggleBorders();
            }
        }
        else {
            box.bd.makeBox(r, c);
        }
        // TODO: change area to this.id
        setCaretToPos(document.getElementById('area'), undo.top.pos);
        box.bd.adjustBox();
        return ret;
    };

    // Pops from the redo stack and sets the stack top to the image
    this.popRedo = function () {// TODO: put in ui.js and split to model.js
        var undid = redo.top;
        undo.push(redo.pop());
        if (undid) {
            box.r = undid.ir;
            box.c = undid.ic;
            spaces = undid.sp;
            currStr = undid.s;
            box.bd.setArea();
            if (box.hasBorders != undid.hb) {
                box.hasBorders = undid.hb;
                box.toggleBorders();
            }
            box.setCaretToPos(document.getElementById('area'), undid.pos);
            box.bd.adjustBox();
        }
        return undid.s;
    };
}


//
//var model = (function () {
//    
//    return {data: 5};
//})();