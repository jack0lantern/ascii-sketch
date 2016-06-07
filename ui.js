// TODO: DELETE ALL DEBUG SECTIONS
// TODO: Don't use upward references to the outer box in Boxstencil and Boxdisplay
// TODO: Replace all two-element arrays representing points with Point objs, and ranges with PointRange objs 

var CHAR_SPACE = ' ';
var TAB_CONTENT_SUFFIX = '_content';

// A box is a logical contrcut representing an individual textarea ("canvas") in which a user can draw on. It by itself should not have the ability to "draw" on itself, but a BoxStencil does that.
// @param id: String stored with no #
function Box (id, rows, cols, settings) {  // TODO: little privacy here
    this.r = rows;
    this.c = cols;
    this.id = id;
    this.bs = new BoxStencil(this);
    this.bd = new BoxDisplay(this);
    // id of the containing div
    this.container = 'boxes';
    this.settings = settings;

    var hasBorders = false;
    var position = 0;
    var range = [0, 0];
    var wrap = true;
    
    var MAX_BOX_HEIGHT = 1000;
    var MAX_BOX_WIDTH = 1000;
    
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
        log('setCaretToPos Calledddddddd ' + pos);
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
    this.changeBox = function (rows, cols) {// TODO: put in ui.js
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
    this.changeChar = function (e) {// TODO: split
        var unicode = null;

        log('this, yes closure: ' + this);

        var range = this.getSelectionRange(document.getElementById(this.id));

        if (window.event) { // IE					
                unicode = e.keyCode;
        } else
            if (e.which) { // Netscape/Firefox/Opera					
                unicode = e.which;
             }

        if (!(e.altKey || e.ctrlKey) && unicode) {
            var row = this.getRow(position);
            var d = this.getCol(position);

            this.setPos();
            this.bs.setCurr();

            var start = range[0], end = range[1];
            
            e.preventDefault();

            // TODO: SO much repetitive code! There must be a better design.
            switch (settings.mode) {
                case 'line':
                    ranges = this.getLineRanges(start, end);
                    break;

                case 'block':
                    ranges = this.getBlockRanges(start, end);
                    break;

                case 'bucket':
                    ranges = this.getBucketRanges(start);
                    break;

                case 'circle':                      
                    ranges = this.getEllipseRanges(start, end);
                    break;

                default:
                    ranges = null;
                    console.log('invalid mode');
            }
                                
            log(ranges);
            // TODO: by using PointRange, get rid of colDiff arg/param
            this.loadRanges(String.fromCharCode(unicode), ranges, Math.abs(this.getCol(end) - this.getCol(start)) + 1);
        }
        else if (e.ctrlKey) {  
            // event listeners do CUT/COPY/PASTE. Should have event listeners for this too?
            if (e.which === CHAR_Z) {
                e.preventDefault();// this doesn't actually seem to prevent the default undo action for other textboxes
                popUndo();
            }
            else if (e.which === CHAR_Y) {
                e.preventDefault();
                popRedo();
            }
        }
        this.setFooterCoords();
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
                }
                else {
                    this.setCaretToPos(position - 1);
                    this.bs.currStr = this.bs.currStr.substring(0, position) + ' ' +  this.bs.currStr.substring(position);
                    this.bd.setArea();
                }
            }
            else if (unicode === DELETE) {
                if (d >= c)
                    e.preventDefault();
                else {
                    currStr = currStr.substring(0, position + 1) + CHAR_SPACE +  currStr.substring(position + 1);
                    document.getElementById(this.id).value = currStr;
                    this.setCaretToPos(position);
                }
            }
            else if (unicode === ENTER) {
                e.preventDefault();
                this.setCaretToPos(positionFromCoordinates(getRow(position) + 1, 0));
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
    
    // Macro to shift all written text in the box right if units > 0, left otherwise.
    this.shiftHoriz = function (units) {// TODO: split
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
        this.setCaretToPos(position);
        pushUndo();
    };

    // Macro to shift all written text in the box up if units > 0, down otherwise.
    this.shiftVert = function (units) {// TODO: split
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
        setCaretToPos(position);
        pushUndo();
    };
    
    // Clears out all whitespace surrounding the image and resizes to close on
    // the image as tightly as possible.
    this.trimArea = function () {// TODO: split
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
    };
    
    // Assigns correct user choices to settings global object
    // TODO: reduce rigidity?
    this.setBlockRadioSettings = function () {// put in ui.js
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
    this.loadRanges = function (charToPut, ranges, colDiff) {// TODO: split
//        log(this.getCurr()); // undefined
        this.setCurr();
        this.setPos();
        this.setBlockRadioSettings();

        // ASSERT ranges[0][0] is defined
        if(ranges[0][0] === undefined)
            return;
        this.bs.assignCurrByRange(charToPut, ranges, colDiff, this.settings);
        this.bd.setArea();
        log('position in loadranges' + position);
        this.setCaretToPos(position);
        
        log(this.getPos());
        this.bs.pushUndo(); // TODO: reimplement
    };

    // Draws a line of copies of a character, repeated as frequently as possible over an interval specified by the user's selection
    // TODO: refactor for loadranges use
    this.getLineRanges = function (start, end) {// TODO: split
        var startRow = this.getRow(start), endRow = this.getRow(end);
        var startCol = Math.min(this.getCol(start), this.c - 1), endCol = Math.min(this.getCol(end), this.c - 1);
        // note: rowDiff always >= 0, same CANNOT be said for colDiff
        var rowDiff = endRow - startRow, colDiff = endCol - startCol;
        console.log(' rowDiff ' + rowDiff + ' coldiff ' + colDiff);
        var rowsMoreThanCols = rowDiff > Math.abs(colDiff);
        var d = rowDiff / colDiff;
        d = d || 0; // in case d is NaN due to 0/0
        
        log('d: ' + d);
        var ranges = [];
        var currentCol = 0;
        var finalCol = 0;
        var colDiffIsPos = colDiff > 0;
        var rounder = colDiffIsPos ? Math.ceil : Math.floor;
        
        for(var row = 0; row <= rowDiff; ++row) {
            log('current col ' + currentCol);
            finalCol = rounder(currentCol);
            log('final col ' + finalCol);
            var rangeToPush = [this.positionFromCoordinates(startRow + row, startCol + finalCol), this.positionFromCoordinates(startRow + row, Math.min(startCol + finalCol, this.c - 1))];
            
            if (ranges.length > 0) {
                assert(ranges[ranges.length - 1][1] === ranges[ranges.length - 1][0], 'last elem of ranges not equal in first and last')
                var colDiffFromPrevRange = this.getCol(rangeToPush[0]) - this.getCol(ranges[ranges.length - 1][1]);
                if (colDiffFromPrevRange > 1) {
                    ranges[ranges.length - 1][1] += colDiffFromPrevRange - 1;
                }
                else if (colDiffFromPrevRange < -1) {
                    ranges[ranges.length - 1][0] += colDiffFromPrevRange + 1;
                }
            }
            ranges.push(rangeToPush);
            
            // think, row + 1 - 0.5
            currentCol = (row + 0.5) / d;
        }
        ranges[ranges.length - 1][colDiffIsPos ? 1 : 0] = this.positionFromCoordinates(endRow, endCol);
        return ranges;
    };

    // Create the range set for a block and load it
    this.traceBlock = function (charToPut, start, end) {// TODO: split
        var startRow = this.getRow(start), endRow = this.getRow(end);
        var startCol = Math.min(this.getCol(start), this.getCol(end)), endCol = Math.max(this.getCol(start), this.getCol(end));
        // NOTE: "cleaning" the start/end col is not the same kind of behavior tracelinear does, which handles
        // the off-screen cursor as if it were really there
        startCol = Math.min(startCol, this.c - 1);
        endCol = Math.min(endCol, this.c - 1);
        // note: rowDiff always >= 0, same CANNOT be said for colDiff
        var rowDiff = endRow - startRow, colDiff = endCol - startCol;    
        if (rowDiff === 0 || colDiff === 0) {
            this.traceLinear(charToPut, start, end);
            return;
        }

        var trueStart = this.positionFromCoordinates(startRow, startCol);
        var ranges = [[trueStart, trueStart + endCol - startCol], [this.positionFromCoordinates(endRow, startCol), this.positionFromCoordinates(endRow, endCol)]];

        for (var i = 1; i < endRow - startRow; i++) {
            addToRanges(this.positionFromCoordinates(startRow + i, startCol), ranges);
            addToRanges(this.positionFromCoordinates(startRow + i, endCol), ranges);
        }

        this.loadRanges(charToPut, ranges, Math.abs(endCol - startCol) + 1);
        this.bs.assignCurrByRange(charToPut, ranges, colDiff, this.settings);
        log('after traceblock: ' + this.getCurr());
        this.bd.setArea();
    };

    // Put all the ranges of currStr that must be changes to user-input char into ranges
    this.getEllipseRanges = function (start, xRad, yRad) {// TODO: put in model.js
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

    this.traceEllipse = function (charToPut, start, end) {// TODO: put in model.js
        var startRow = getRow(start), endRow = getRow(end);
        var startCol = Math.min(getCol(start), getCol(end)), endCol = Math.max(getCol(start), getCol(end));
        
        // Make sure we don't try to overwrite a border char or something
        startCol = Math.min(startCol, c - 1);
        endCol = Math.min(endCol, c - 1);

        // note: rowDiff always >= 0, same CANNOT be said for colDiff
        var rowDiff = endRow - startRow, colDiff = Math.abs(endCol - startCol);    
        if (rowDiff === 0 || colDiff === 0) {
            this.traceLinear(charToPut, start, end);
            return;
        }

        var ranges = getEllipseRanges(positionFromCoordinates(startRow, startCol), (endCol - startCol)/2, (endRow - startRow)/2);
        loadRanges(charToPut, ranges, colDiff);
    };
    
    this.bucket = function (charToPut, start) {// TODO: split
        var charToFlood = currStr.charAt(start);
        var ranges = [];
        dynBucketHelper(ranges, charToFlood, start);
        //bucketHelper(ranges, charToFlood, [], start);
        loadRanges(charToPut, ranges, 0);
        pushUndo();
    };
    
    this.oldTraceLinear = function (charToPut, start, end) {
                var startRow = this.getRow(start), endRow = this.getRow(end);
        var startCol = this.getCol(start), endCol = this.getCol(end);
        // note: rowDiff always >= 0, same CANNOT be said for colDiff
        var rowDiff = endRow - startRow, colDiff = endCol - startCol;
        var rowsMoreThanCols = rowDiff > Math.abs(colDiff);
        var d = rowsMoreThanCols ? colDiff / rowDiff : Math.abs(rowDiff / colDiff);
        d = d || 0; // in case d is NaN due to 0/0
        //document.getElementById('debug').innerHTML = d;
        var ri = startRow, ci = startCol;
        var i = 0;
        var count = 0;

        this.setPos();
        this.setCurr();
        
        var r = this.r;
        var c = this.c;

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
                newStr = this.getCurr().substring(0, this.positionFromCoordinates(ri, Math.round(ci)));
            while(ri <= endRow && Math.round(ci) < c) {
                var oldri = ri;
                var oldci = ci;
                newStr += charToPut;
                ri++;
                ci += d;
                newStr += this.getCurr().substring(this.positionFromCoordinates(oldri, Math.round(oldci)) + 1,  this.positionFromCoordinates(ri, Math.round(ci)));
            }
            var iterationLength = newStr.length;
            newStr += this.getCurr().substring(iterationLength);
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
                    newStr = this.bs.currStr;
                    break;
                }
            }
            if (ci < c)
                newStr = this.getCurr().substring(0, this.positionFromCoordinates(Math.round(ri), ci));
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
                    newStr = newStr.substring(0, this.positionFromCoordinates(oldri, oldci) - appendage.length + 1);
                }
                var newPos = this.positionFromCoordinates(Math.round(ri), ci);
                newStr += appendage + this.getCurr().substring(this.positionFromCoordinates(oldri, (colDiff > 0) ? ci : oldci + 1), (inRange(ci, startCol, endCol) && ci < c && ci >= 0) ? newPos : this.getCurr().length);
            }
        }

        this.setCurr(newStr);
        this.bd.setArea();
        this.bs.pushUndo();
        this.setCaretToPos(++position);   // TODO: setArea already does a cursor shift. this is inefficient.
    }
}

function BoxDisplay (outerBox) {
    var box = outerBox;
    /* puts whatever is in currStr in the textarea.
     * An essential function to call before performing any kind of text area
     * manipulation. */
    this.setArea = function() {// put in ui.js
    //    alert("ui.js: " + document.getElementById(box.id));
        assert(document.getElementById(box.id), 'invalid box id');
        document.getElementById(box.id).value = box.getCurr();
        log('setarea getcurr: ' + box.getCurr());
    //    b.setCaretToPos(b.getPos());
    };

    // Sets the box's dimensions to its logical values
    this.adjustBox = function () {
        document.getElementById(box.id).rows = box.r + 1;
        document.getElementById(box.id).cols = box.c + 1;

        // The below has not been adjusted to respond to boxes of differing size.
        document.getElementById('h').value = box.r;
        document.getElementById('w').value = box.c;
    };

    this.makeBox = function (rows, cols) {

        var boxCode = '<textarea id="' + box.id + '" spellcheck="false"></textarea>';
        document.getElementById(box.container).innerHTML = '<div id="box0">' + boxCode + '</div>';
        
        var boxObj = $(Id(box.id));
        
        box.bs.resetCurrStr();
        this.setArea();
        this.adjustBox();
        log('box get curr in ui: ' + box.getCurr());

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

        // TODO: keydown always happens when a keypress happens; 
        // so then setCurr happens twice, which is a little expensive.
        // Can we factor it out somehow? Maybe if we can guarantee that
        // keydown always happens first.
        boxObj.on('keydown', function(event) {
            log('keydown');
            box.nonKeyPress(event);
        });
        boxObj.on('keypress', function(event) {
            log('keypress');
            box.changeChar(event);
        });
        boxObj.on('keyup', function() {
//            for(prop in this.bs)
        log('in keyup getcurr: ' + box.getCurr()); // undefined
            box.setFooterCoords();
        });
        boxObj.on('mousedown', function() {
            setMouseDown();
            box.setFooterCoords(); 
            box.setCaretToPos(0);
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
    
    this.displayFooterCoords = function (x1, y1, x2, y2) {
        
    };
    
    // changes the state of fillMode
    // TODO: refactor HTML injection
    this.toggleFill = function () {// put in ui.js
        if (settings.fillMode === 'transparent') {
            document.getElementById('fillOptions').innerHTML = '<label for="fillChar">with: </label> <br /> <input type="radio" id="fillSame" name="fillOptions" value="same" checked /> <label for="fillSame"> Same characters </label><br /> <input type="radio" id="fillDiff" name="fillOptions" value="diff" /> <label for="fillDiff">This character: </label><input type="text" class="text" id="fillChar" maxlength="1" value=" " onChange="setBlockRadioSettings()" />';
        }
        else {
            document.getElementById('fillOptions').innerHTML = '';
        }
        this.setBlockRadioSettings();
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
    this.setMode = function(newMode) {// TODO: put in ui.js
        var oldSetting = $(Id(this.settings.mode));
        if (this.settings.mode === 'custom')
            oldSetting = $(Id('block'));
        oldSetting.removeClass('active_tool');

        this.settings.mode = newMode.id;
        $(Id(newMode.id)).addClass('active_tool');
    };

    // @param newTab: HTML element (a tab, presumably) to activate
    this.openTab = function(newTab) {// TODO: put in ui.js
        $(Id(this.settings.currentTab)).removeClass('active_tab');
        $(Id(this.settings.currentTab) + TAB_CONTENT_SUFFIX).css('display', 'none');

        $(Id(newTab.id) + TAB_CONTENT_SUFFIX).css('display', 'block');
        $(Id(newTab.id)).addClass('active_tab');
        this.settings.currentTab = newTab.id;
    };
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
    b.bd.makeBox();
//    b.bd.setArea(
    b.setSelectionRange(10, 20);
//    selectRange(20, 30);
    var sr = b.getSelectionRange();
    log(b.getCurr());
}

//$(document).ready();
/*** /DEBUG ***/