// TODO: DELETE ALL DEBUG SECTIONS
// TODO: Don't use upward references to the outer box in Boxstencil and Boxdisplay
// TODO: Replace all two-element arrays representing points with Point objs, and ranges with PointRange objs 

var CHAR_SPACE = ' ';
var CHAR_Y = 25;
var CHAR_Z = 26;
var TAB_CONTENT_SUFFIX = '_content';

var drawModes = Object.freeze({
    LINE: 'line', 
    BLOCK: 'block', 
    BUCKET: 'bucket'
});

var fillModes = Object.freeze({
    FILL: 'fill',
    TRANSPARENT: 'transparent',
    CUSTOM: 'custom'
});

var tabs = Object.freeze({
    DRAW: 'draw',
    WINDOW: 'window',
    EDIT: 'edit',
    HELP: 'help'
});

// A box is a logical contrcut representing an individual textarea ("canvas") in which a user can draw on. It by itself should not have the ability to "draw" on itself, but a BoxStencil does that.
// @param id: String stored with no #
function Box(id, rows, cols, settings) {  // TODO: little privacy here
    this.r = rows;
    this.c = cols;
    this.id = id;
    this.bs = new BoxController(this);
    this.bd = new BoxDisplay(this);
    // id of the containing div
    this.container = 'boxes';
    this.settings = settings;

    var that = this;
    var hasBorders = false;
    var position = 0;
    var range = [0, 0];
    var wrap = true;
    
    var MAX_BOX_HEIGHT = 1000;
    var MAX_BOX_WIDTH = 1000;
    
    this.setPos = function() { // put in ui.js
        var tempPos = $(Id(this.id)).getCursorPosition();
        return position = new Point(this.getRow(tempPos), this.getCol(tempPos), tempPos); //position is the OLD location of the cursor before typing
    };
    
    this.getPosPoint = function() {
        return position;
    }
    
    /*** DEBUG ***/
    this.getPos = function() {
        return position.pos;
    };
    
    // functions, mind you
    this.getCurr = this.bs.getCurr;
    this.setCurr = this.bs.setCurr;
    /*** /DEBUG ***/
    this.resetCurrStr = this.bs.resetCurrStr;
    
    // returns the row index from the cursor position.
    this.getRow = function(pos) {// put in ui.js  - done
        return Math.floor(pos / (this.hasBorders ? (this.c + 2) : (this.c + 1)));
    };

    // returns the col index from the cursor position.
    this.getCol = function(pos) {// put in ui.js - done
        return pos % (this.hasBorders ? (this.c + 2) : (this.c + 1));
    };
    
    // return the textarea index of the character at a specified row and col
    this.positionFromCoordinates = function(ri, ci) {// put in ui.js - done
       return ri * (this.hasBorders ? (this.c + 2) : (this.c + 1)) + ci; 
    };
    
    // display the borders, or don't display the borders.
    this.toggleBorders = function() {
        var temp = '';
        var offset;

        this.setPos();
        
        this.bs.writeBorders(this.hasBorders);
        this.hasBorders = !this.hasBorders;

        if (this.hasBorders)
            document.getElementById(this.id).cols = this.c + 1;

        this.bd.setArea();
        offset = this.hasBorders ? Math.floor(this.getPos() / (this.c + 1)): -Math.floor(this.getPos() / (this.c + 2));   // adjust cursor for newly removed or inserted borders
        log('this.getPos() new ' + (this.getPos()));
        this.setCaretToPos(this.getPos() + offset);
    };
    
    this.togglePaste = function() {
        this.settings.pasteTransparent = !this.settings.pasteTransparent;
    };
    
    // http://stackoverflow.com/questions/275761/how-to-get-selected-text-from-textbox-control-with-javascript
    // returns a two-element array of the selection's start and end indices
    this.getSelectionRange = function() {
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
    
    this.setSelectionRange = function(selectionStart, selectionEnd) {
        var input = document.getElementById(this.id);
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
    
    this.setCaretToPos = function(pos) {
        log('setCaretToPos Calledddddddd ' + pos);
        this.setSelectionRange(pos, pos);
    };
    
    this.confirmReset = function() {// put in ui.js
        var reset = confirm('Are you sure you want to clear the image? All your work will be lost. Press OK to continue or Cancel to cancel.');
        if (reset) {
            this.makeBox(parseInt(document.getElementById('h').value), parseInt(document.getElementById('w').value));
            this.bs.clearStacks();
        }
    };
    
    this.makeBox = function(rows, cols) {
        this.bs.resetCurrStr();
        var boxObj = this.bd.displayBox();
                
        // TODO: Figure out a better way to do this. Need || cuz makeBox is called with no args somewhere.
        this.r = rows||this.r;
        this.c = cols||this.c;
        
        log('box get curr in ui: ' + this.getCurr());

        boxObj.on('cut', function(event) {
            that.copy(true);
        });
        boxObj.on('copy', function(event) {
            that.copy(false);
        });
        boxObj.on('paste', function(event) {
            event.preventDefault();
            that.paste();
        });
        
        boxObj.on('click', function() {
            document.getElementById('dims').innerHTML = '';
        });

        // TODO: keydown always happens when a keypress happens; 
        // so then setCurr happens twice, which is not necessary but not a big deal.
        // Can we factor it out somehow? Maybe if we can guarantee that
        // keydown always happens first.
        boxObj.on('keydown', function(event) {
            log('keydown');
            that.nonKeyPress(event);
        });
        boxObj.on('keypress', function(event) {
            log('keypress');
            that.changeChar(event);
        });
        boxObj.on('keyup', function() {
            that.setFooterCoords();
        });
        boxObj.on('mousedown', function() {
            that.setMouseDown();
            that.setFooterCoords(); 
//            box.setCaretToPos(0);
        });

        boxObj.on('mousemove', function() {
            that.setFooterCoords();
        }); 
        boxObj.on('mouseup', function() {
            that.setFooterCoords(); 
            that.setMouseUp();
        });
        boxObj.on('dragstart', function() {return false;});
        boxObj.on('drop', function() {return false;});
    }
    
    // Grow or shrink the textarea's dimensions while maintaining content as much as possible. Chops off content on shrink, adds spaces on grow.
    this.changeBox = function(rows, cols) {
        rows = Math.min(parseInt(rows), MAX_BOX_HEIGHT);
        cols = Math.min(parseInt(cols), MAX_BOX_WIDTH);
        this.bs.changeCurrStrDims(rows, cols);
        this.bd.setArea();
        this.r = rows;
        this.c = cols;
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

        log('this r ' + this.r);
        log('this c ' + this.c);

        var range = this.getSelectionRange(document.getElementById(this.id));

        if (window.event) { // IE					
                unicode = e.keyCode;
        } else
            if (e.which) { // Netscape/Firefox/Opera					
                unicode = e.which;
             }

        if (!(e.altKey || e.ctrlKey) && unicode) {
            e.preventDefault();
            
            var row = this.getPosPoint().row;
            var d = this.getPosPoint().col;
            if (d >= this.c) { 
                this.setCaretToPos(this.positionFromCoordinates(this.getPosPoint().row + 1, 0));
                return;
            }

            var startPoint = new Point(this.getRow(range[0]), this.getCol(range[0]), range[0]), 
                endPoint   = new Point(this.getRow(range[1]), this.getCol(range[1]), range[1]);
            

            // TODO: SO much repetitive code! There must be a better design.
            switch (settings.mode) {
                case 'line':
                    ranges = this.getLineRanges(startPoint, endPoint);
                    break;

                case 'block':
                    ranges = this.getBlockRanges(startPoint, endPoint);
                    break;

                case 'bucket':
                    ranges = this.getBucketRanges(startPoint);
                    break;

                case 'circle':                      
                    ranges = this.getEllipseRanges(startPoint, endPoint);
                    break;

                default:
                    ranges = null;
                    console.log('invalid mode');
            }
                                
            log(ranges);
            // TODO: by using PointRange, get rid of colDiff arg/param
            this.loadRanges(String.fromCharCode(unicode), ranges, Math.abs(endPoint.col - startPoint.col) + 1);
        }
        else if (e.ctrlKey) {  
            // event listeners do CUT/COPY/PASTE. Should have event listeners for undo/redo too? Would have to build from scratch, as there is no built-in event for them
            if (e.which === CHAR_Z) {
                e.preventDefault(); // this doesn't actually seem to prevent the default undo action for other textboxes
                popUndo();
            }
            else if (e.which === CHAR_Y) {
                e.preventDefault();
                popRedo();
            }
        }
        this.setFooterCoords();
    };

    this.nonKeyPress = function(e) {// TODO: split
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
            var d = this.getPosPoint().col;

            // the below should be in model.js TODOs
            if (unicode === BACKSPACE) {
                if (d > this.c || d == 0) {
                    e.preventDefault();
                }
                else {
                    this.setCurr(this.getCurr().substring(0, this.getPos()) + ' ' +  this.getCurr().substring(this.getPos()));
                    this.bd.setArea();
                    this.setCaretToPos(this.getPos());
                }
            }
            else if (unicode === DELETE) { 
                if (d >= this.c)
                    e.preventDefault();
                else {
                    this.setCurr(this.getCurr().substring(0, this.getPos() + 1) + CHAR_SPACE + this.getCurr().substring(this.getPos() + 1));
                    this.bd.setArea();
                    this.setCaretToPos(this.getPos());
                }
            }
            else if (unicode === ENTER) { // TODO: remember where user started typing
                e.preventDefault();
                this.setCaretToPos(this.positionFromCoordinates(this.getPosPoint().row + 1, this.getPosPoint().col));
            }
            else if (unicode === SHIFT) {
                if (mouseDown) {
                    // Insert code to straighten selection line here
                }
            }
        }
        this.setFooterCoords();
    };
    
    this.setFooterCoords = function() { // put in ui.js
        this.setPos();
        var selection = this.getSelectionRange($(Id(this.id)));
        if (DEBUG){
            document.getElementById('debug').innerHTML = selection + " " + this.getPos() + '\n' + this.getPosPoint().col;
        }
        document.getElementById('coords').innerHTML = '(' + this.getPosPoint().col + ', ' + this.getPosPoint().row + ')';

        if (selection[1] - selection[0]) {
            var x1 = this.getCol(selection[0]), x2 = this.getCol(selection[1]);
            var y1 = this.getRow(selection[0]), y2 = this.getRow(selection[1]);
            var xdiff = Math.abs(x2 - x1);
            var ydiff = Math.abs(y2 - y1);
            document.getElementById('coords').innerHTML = '(' + x1 + ', ' + y1 + ') -- ' + '(' + x2 + ', ' + y2 + ')';
            document.getElementById('dims').innerHTML = (xdiff + 1) + ' x ' + (ydiff + 1);
        }
    };
    
    // Puts a block selection in the clipboard.
    // If cut is set, we white-space out the block selection in addition.
    this.copy = function(cut) {// TODO: split
        var range = this.getSelectionRange();
        var start = range[0], end = range[1];
        var startRow = this.getRow(start), endRow = this.getRow(end);
        var startCol = Math.min(this.getCol(start), this.getCol(end)), endCol = Math.max(this.getCol(start), this.getCol(end));
        startCol = Math.min(startCol, this.c - 1);
        endCol = Math.min(endCol, this.c - 1);
        
        // Note: coldiff is recomputed needlessly in replacewithwithspace.
        var colDiff = endCol - startCol;    
        if (colDiff === 0) {
            return;
        }
        var pointRange = [new Point(startRow, startCol, start), new Point(startCol, endCol, end)];

        if (DEBUG)
            document.getElementById('debug').innerHTML = "SR: " + startRow + " ER: " + endRow + " SC: " + startCol + " EC: " + endCol;

        this.bs.processCopy(pointRange);
        
        if (cut) {
            this.bs.replaceWithWhitespace(pointRange);
            this.bd.setArea();
        }
        
        this.bs.pushUndo();
    };

    // Places the contents of clipboard at user cursor to the best of our ability
    this.paste = function() {// TODO: split
        this.setPos();
        var pasted = this.bs.processPaste();
        
        if (pasted) {
            this.bd.setArea();
        }
    };
    
    // Macro to shift all written text in the box right if units > 0, left otherwise.
    this.shiftHoriz = function(units) {// TODO: split
        this.bs.shiftCurrHoriz(units);
        
        this.setPos();
        this.bd.setArea();
        this.setCaretToPos(this.getPos());
    };

    // Macro to shift all written text in the box up if units > 0, down otherwise.
    this.shiftVert = function(units) {
        this.bs.shiftCurrVert(units);
        
        this.setPos();
        this.bd.setArea();
        this.setCaretToPos(this.getPos());
    };
    
    // Clears out all whitespace surrounding the image and resizes to close on
    // the image as tightly as possible.
    this.trimArea = function() {// TODO: split
        var newDims = this.bs.processTrimArea();

        this.setPos();
        this.bd.setArea();

        this.r = newDims.r; // stop - getRow(beginIndex) + 1;
        this.c = newDims.c; // maxCol - minCol + 1;

        this.bd.adjustBox();
    };
    
    // Assigns correct user choices to settings global object
    // TODO: reduce rigidity?
    this.setBlockRadioSettings = function() {// put in ui.js
        if (document.getElementById('fill').checked) {
            if (document.getElementById('fillSame').checked)
                this.settings.fillMode = 'fill';
            else if (document.getElementById('fillDiff').checked) {
                this.settings.fillMode = 'custom';
                this.settings.fillChar = document.getElementById('fillChar').value;
            }
        }
        else
            this.settings.fillMode = 'transparent';
    };
    
    // ranges is an array of ranges of indexes in which to fill with charToPut
    // inside the box's canvas
    // loadRanges takes ranges and displays them according to the settings
    this.loadRanges = function(charToPut, ranges, colDiff) {
        this.setPos();
        this.setBlockRadioSettings();

        // ASSERT ranges[0][0] is defined
        if(ranges[0][0] === undefined)
            return;
        this.bs.assignCurrByRange(charToPut, ranges, colDiff, this.settings);
        this.bd.setArea();
        log('this.getPos() in loadranges' + this.getPos());
        this.setCaretToPos(this.getPos() + 1);
    };

    // Draws a line of copies of a character, repeated as frequently as possible over an interval specified by the user's selection
    // TODO: refactor for loadranges use
    this.getLineRanges = function(start, end) {// TODO: split
        var startRow = start.row, endRow = end.row;
        var startCol = Math.min(start.col, this.c - 1), endCol = Math.min(end.col, this.c - 1);
        
        // note: rowDiff always >= 0, same CANNOT be said for colDiff
        var rowDiff = endRow - startRow, colDiff = endCol - startCol;
        var rowsMoreThanCols = rowDiff > Math.abs(colDiff);
        var d = rowDiff / colDiff;
        d = d || 0; // in case d is NaN due to 0/0
        var colSgn = Math.sign(colDiff);
        var ranges = [];
        var rounder = Math.round;
        
        if (rowsMoreThanCols) {
            for(var row = 0; row <= rowDiff; ++row) {
                var currentCol = rounder(row / d);
                var point = this.positionFromCoordinates(startRow + row, Math.min(startCol + currentCol, this.c - 1));
                addToRanges(point, ranges);
            }
        }
        else {
            for(var col = 0; col <= Math.abs(colDiff); col += 1) {
                var currentRow = rounder(Math.abs(col * d));
                var point = this.positionFromCoordinates(startRow + currentRow, Math.min(startCol + colSgn*col, this.c - 1));
                addToRanges(point, ranges);
            }
        }
        return ranges;
    };

    // Create the range set for a block and load it
    this.getBlockRanges = function(start, end) {// TODO: split
        var startRow = start.row, endRow = end.row;
        var startCol = Math.min(start.col, this.c - 1), endCol = Math.min(end.col, this.c - 1);
        startCol = Math.min(startCol, this.c - 1);
        endCol = Math.min(endCol, this.c - 1);
        // note: rowDiff always >= 0, same CANNOT be said for colDiff
        var rowDiff = endRow - startRow, colDiff = endCol - startCol; 
        
        if (rowDiff === 0 || colDiff === 0) {
            return this.getLineRanges(start, end);
        }

        var trueStart = this.positionFromCoordinates(startRow, startCol);
        var ranges = [[trueStart, trueStart + endCol - startCol], [this.positionFromCoordinates(endRow, startCol), this.positionFromCoordinates(endRow, endCol)]];

        for (var i = 1; i < endRow - startRow; i++) {
            addToRanges(this.positionFromCoordinates(startRow + i, startCol), ranges);
            addToRanges(this.positionFromCoordinates(startRow + i, endCol), ranges);
        }
        return ranges;
    };

    // Put all the ranges of currStr that must be changes to user-input char into ranges
    this.getEllipseRanges = function(start, end) {
        var startRow = start.row;
        var endRow = end.row;
        
        var startCol = Math.min(start.col, end.col), endCol = Math.max(start.col, end.col);
        startCol = Math.min(startCol, this.c - 1);
        endCol = Math.min(endCol, this.c - 1);
        
        var xRad = (endCol - startCol) / 2,
            yRad = (endRow - startRow) / 2;

        // Corner case
        if (yRad === 0) {
            return [[start.pos, end.pos]];
        }
        
        var xLim = Math.ceil(xRad);
        var yLim = Math.ceil(yRad);
        var xDen = xRad * xRad;
        var yDen = yRad * yRad;

        var ranges = [];

        var col;
        var row;

        for (var y = 0; y < Math.min(2 * yLim, this.r - 1 - startRow); y++) {
            col = startCol + Math.round(-Math.sqrt((1 - Math.pow(y - yRad, 2)/yDen)*xDen) + xRad);
            addToRanges(this.positionFromCoordinates(startRow + y, col), ranges);

            col = startCol + Math.round(Math.sqrt((1 - Math.pow(y - yRad, 2)/yDen)*xDen) + xRad);
            addToRanges(this.positionFromCoordinates(startRow + y, col), ranges);
        }

        // For the octant, xLim is the stopping point, but use 2*xLim-Pivot to mirror it across the y axis. Cuz math.
        for (var x = 0; x <= Math.min(2 * xLim, this.c - 1 - startCol); x++) {
            row = startRow + Math.round(-Math.sqrt((1 - Math.pow(x - xRad, 2)/xDen)*yDen) + yRad);
            addToRanges(this.positionFromCoordinates(row, startCol + x), ranges);

            row = startRow + Math.round(Math.sqrt((1 - Math.pow(x - xRad, 2)/xDen)*yDen) + yRad);
            addToRanges(this.positionFromCoordinates(row, startCol + x), ranges);
        }
        //alert(ranges);
        return ranges;
    }

    this.shouldEnqueue = function(toReplace, pos, visited) {
        return visited[pos] === undefined && pos >= 0 && this.getRow(pos) < this.r && this.getCol(pos) < this.c && this.getCurr().charAt(pos) === toReplace;
    };
    
    // Determine a list of ranges in which to assign the new character (in ranges, 
    // a array of two-element range arrays, which are inclusive endpoints)
    // A dynamic approach
    this.dynBucketHelper = function(ranges, toReplace, posPt) {// put in model.js
        var toCheckQ = new Queue();
        var visited = [];

        toCheckQ.enqueue(posPt);
        visited[posPt.pos] = true;

        while(!toCheckQ.isEmpty()) {
            var currentPosPt = toCheckQ.dequeue().item;
            var currentPos = currentPosPt.pos;
            addToRanges(currentPos, ranges);
            
            var posToCheck;
            if (this.shouldEnqueue(toReplace, posToCheck = this.positionFromCoordinates(currentPosPt.row + 1, currentPosPt.col), visited)) {
                toCheckQ.enqueue(new Point(currentPosPt.row + 1, currentPosPt.col, posToCheck));
                visited[posToCheck] = true;
            }
            if (this.shouldEnqueue(toReplace, posToCheck = currentPos + 1, visited)) {
                toCheckQ.enqueue(new Point(currentPosPt.row, currentPosPt.col + 1, posToCheck));
                visited[posToCheck] = true;
            }
            if (this.shouldEnqueue(toReplace, posToCheck = currentPos - 1, visited)) {
                toCheckQ.enqueue(new Point(currentPosPt.row, currentPosPt.col - 1, posToCheck));
                visited[posToCheck] = true;
            }
            if (this.shouldEnqueue(toReplace, posToCheck = this.positionFromCoordinates(currentPosPt.row - 1, currentPosPt.col), visited)) {
                toCheckQ.enqueue(new Point(currentPosPt.row - 1, currentPosPt.col, posToCheck));
                visited[posToCheck] = true;
            }
        }
    };
    
    this.getBucketRanges = function(start) {
        var charToFlood = this.getCurr().charAt(start.pos);
        var ranges = [];
        this.dynBucketHelper(ranges, charToFlood, start);
        //bucketHelper(ranges, charToFlood, [], start);
        return ranges;
    };
    
    this.setMouseDown = function() {
        log('setMouseDown NOT IMPLEMENTED');
    };
    
    this.setMouseUp = function() {
        log('setMouseUp NOT IMPLEMENTED');
    };
    
    var popUndo = function() {
        that.bs.processPopUndo();
    };
    
    var popRedo = function() {
        that.bs.processPopRedo();
    };
}

function BoxDisplay(outerBox) {
    var box = outerBox;
    /* puts whatever is in currStr in the textarea.
     * An essential function to call before performing any kind of text area
     * manipulation. */
    this.setArea = function() {// put in ui.js
    //    alert("ui.js: " + document.getElementById(box.id));
        assert(document.getElementById(box.id), 'invalid box id');
        document.getElementById(box.id).value = box.getCurr();
        log('setarea getcurr: ' + box.getCurr());
    };

    // Sets the box's dimensions to its logical values
    this.adjustBox = function() {
        document.getElementById(box.id).rows = box.r + 1;
        document.getElementById(box.id).cols = box.c + 1;

        // The below has not been adjusted to respond to boxes of differing size.
        document.getElementById('h').value = box.r;
        document.getElementById('w').value = box.c;
    };

    // boxObj is a jquery object representing the canvas box
    this.displayBox = function() {
        var boxCode = '<textarea id="' + box.id + '" spellcheck="false"></textarea>';
        document.getElementById(box.container).innerHTML = '<div id="box0">' + boxCode + '</div>';

        var boxObj = $(Id(box.id));
        this.setArea();
        this.adjustBox();
        
        boxObj.wrap = "off";
        
        return boxObj;
    };
    
    // Clears the box dimensions area of the footer and sets mouseDown
    var setMouseDown = function() {
        this.mouseDown = true;
    };
    
    // Sets mouseDown false.
    var setMouseUp = function() {
        this.mouseDown = false;
    };
    
    // TODO
    this.displayFooterCoords = function(x1, y1, x2, y2) {
        
    };
    
    // changes the state of fillMode
    // TODO: refactor HTML injection
    this.toggleFill = function(settings) {// put in ui.js
        if (settings.fillMode === 'transparent') {
            document.getElementById('fillOptions').innerHTML = '<label for="fillChar">with: </label> <br /> <input type="radio" id="fillSame" name="fillOptions" value="same" checked /> <label for="fillSame"> Same characters </label><br /> <input type="radio" id="fillDiff" name="fillOptions" value="diff" /> <label for="fillDiff">This character: </label><input type="text" class="text" id="fillChar" maxlength="1" value=" "  />';
            $(Id('fillChar')).on('change', function() {
               box.setBlockRadioSettings(); 
            });
        }
        else {
            document.getElementById('fillOptions').innerHTML = '';
        }
        box.setBlockRadioSettings();
    }
}

// Class constructor representing a collection of boxes and their associated settings. Basically, a wrapper for settings.
// Currently having only one frame, so window_ is document by default.
function Frame (settings_, window_) {
    this.settings = settings_;
    this.boxes = [];
    this.window = window_||document;
    
    this.addBox = function(id, rows, cols) {
        this.boxes.push(new Box(id, rows, cols, this.settings));
    };
    
    // Sets the selection mode to user specified mode
    // @param newMode: HTML element to set the mode of
    this.setMode = function(newMode) {
        var oldSetting = $(Id(this.settings.mode));
        if (this.settings.mode === 'custom')
            oldSetting = $(Id('block'));
        oldSetting.removeClass('active_tool');

        this.settings.mode = newMode.id;
        $(Id(newMode.id)).addClass('active_tool');
    };

    // @param newTab: HTML element (a tab, presumably) to activate
    this.openTab = function(newTab) {
        $(Id(this.settings.currentTab)).removeClass('active_tab');
        $(Id(this.settings.currentTab) + TAB_CONTENT_SUFFIX).css('display', 'none');

        $(Id(newTab.id) + TAB_CONTENT_SUFFIX).css('display', 'block');
        $(Id(newTab.id)).addClass('active_tab');
        log('newtab ' + newTab);
        this.settings.currentTab = newTab.id;
    };
    
    // Attaches an event listener for each element of a class. Handlers should expect to take in an element
    // @param className: name of class in which to attach a listener for handle
    // @param eventName: name of event to be triggered
    // @param handler: function to attach to each element
    this.attachListenersByClass = function(className, eventName, handler) {
        var elems = this.window.getElementsByClassName(className);

        // TIL for loops don't have their own scope
        // Attach the event listeners for each tab
        // TODO: check handler is a fn
        for (var j = 0; j < elems.length; ++j) {
            (function(j) {
            $(elems[j]).on(eventName, function() {
                log('this in attach ' + this);
                handler(elems[j]);
            });
            })(j);
        }
    };
    
    // Attach all listeners for this frame
    this.attachFrameListeners = function() {
        var that = this;
        
        this.attachListenersByClass('tab', 'click', function(tab) {
            that.openTab(tab); 
        });
        
        this.attachListenersByClass('tool', 'click', function(mode) {
            that.setMode(mode); 
        });
        
        $(Id('fill')).on('click', function() { 
            that.boxes[0].bd.toggleFill(that.settings);
        });

        $(Id('toggleBorders')).on('click', function() {
            that.boxes[0].toggleBorders(); 
        });
        
        $(Id('pasteTrans')).on('click', function() { 
            that.boxes[0].paste();
        });
        
        $(Id('resetButton')).on('click', function() { 
            that.boxes[0].confirmReset();
        });
        
        $(Id('changeButton')).on('click', function() {
            that.boxes[0].changeBox(document.getElementById('h').value, document.getElementById('w').value);
        });
        
        $(Id('shiftVertButton')).on('click', function() {
            that.boxes[0].shiftVert(document.getElementById('shiftValue').value);
        });
        
        $(Id('shiftHorizButton')).on('click', function() {
            that.boxes[0].shiftHoriz(document.getElementById('shiftValue').value);
        });
        
        $(Id('trimButton')).on('click', function () {
            that.boxes[0].trimArea();
        });
        
        $(Id('cutButton')).on('click', function() {
            that.boxes[0].copy(true);
        });
        
        $(Id('copyButton')).on('click', function() {
            that.boxes[0].copy(false);
        });
        
        $(Id('pasteButton')).on('click', function () {
            that.boxes[0].paste();
        });
        
        $(Id('undoButton')).on('click', function () {
            that.boxes[0].bs.popUndo();
        });
        
        $(Id('redoButton')).on('click', function () {
            that.boxes[0].bs.popRedo();
        });
        
        $(Id('pasteTrans')).on('click', function () {
            that.boxes[0].togglePaste();
        });
    }
}

// User Interface module for handling user settings
var ui = (function () {
    var IS_MAC = navigator.platform.match(/Mac/i) ? true : false;
    var settings = {
        mode: drawModes.LINE, 
        fillMode: fillModes.TRANSPARENT, 
        fillChar: CHAR_SPACE,
            //    activeChar: null,     // potentially for custom chars
        currentTab: tabs.DRAW,
        pasteTransparent: false
    };
    
    var frames = [new Frame(settings)];
    frames[0].addBox('area', 20, 40);
    
    return {f: frames};
})();

/*** DEBUG ***/
// for testing
function testCompiles(){
    var setStr = '                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n               d                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                \n                                                                                ';
//    alert(ui.boxes.main);
    var b = ui.f[0].boxes.main;
    b.setCurr(setStr);
    log(b.bd);
    b.makeBox();
//    b.bd.setArea(
    b.setSelectionRange(10, 20);
//    selectRange(20, 30);
    var sr = b.getSelectionRange();
    log(b.getCurr());
}

//$(document).ready();
/*** /DEBUG ***/