var clipboard = [];
var DEBUG = false;
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
function Stack() {// put in model.js - done
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

// yes, I got this from stackoverflow. Use: getCursorPosition() to get the cursor position from any box
(function ($) {
    console.log("getCursorPosition declared");
    $.fn.getCursorPosition = function() {
        console.log(this);
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

// Modifier of a box's logical content.
function BoxStencil(outerBox) {
    var box = outerBox;
    var currStr = '';
    var spaces = '';
    var undo = new Stack();
    var redo = new Stack();
    
    this.setCurr = function (s) {
        currStr = s;
    };
    
    this.getCurr = function () {
        return currStr;
    };
    
    // returns the line at a given row index. This cuts off the ending \n.
    // Mostly a helper.
    var getLine = function(line, withNewLine) {    // lines are 0 indexed
        if (line < r) {
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
    
    this.clearStacks = function () {// put in model.js - done
        undo = new Stack();
        redo = new Stack();
    };
    
    this.changeCurrStrDims = function(rows, cols) {
        var emptyRow = '';
        var newStr = '';

        if (this.r === rows && this.c === cols)
            return;

        this.setCurr();
        for (var i = 0; i < cols; i++)
            emptyRow += CHAR_SPACE;    // O(n^2)
        emptyRow += (hasBorders ? '|' : '');
        spaces = emptyRow + '\n';   

        var numSpacesToAdd = cols - c;
        var spacesToAdd = '';
        for (var i = 0; i < numSpacesToAdd; i++)
            spacesToAdd += CHAR_SPACE;
        /*** REFACTOR ***/
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
        /*** TO: ***/
//        for (var currRow = 0; currRow < rows; currRow++) {
//                if (currRow >= r)
//                    newStr += emptyRow;
//                else
//                    newStr += getLine(currRow, false).substring(0, (cols < c) ? cols : c) + spacesToAdd + (hasBorders ? '|' : '');
//                if (currRow < rows - 1)
//                    newStr += '\n';
//        }
        /*** /REFACTOR ***/

        this.currStr = newStr||this.currStr;
    };
}


//
//var model = (function () {
//    
//    return {data: 5};
//})();