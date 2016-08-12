// LEFT TO DO:
/*

// return the index of the range and if its a begin or end value if we found it, otherwise return the index of the range nearest to the searchItem on the higher end
function rangesBinarySearch (ranges, searchItem) {
    
}

// loop through ranges list, if it is within 1 outside of a range, absorb it, otherwise add new range
// return the changed range
// @param value: a number we are adding to the range
// @param ranges: the ranges array we are adding to
// NOTE: this is a HUUUGE bottle neck for certain functions like bucket. optimize it
function addToRanges(value, ranges) {// TODO: put in model.js
    var changedRange = null;
    assert(ranges, 'ranges is ' + ranges);
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
function BoxController(outerBox) {
    var box = outerBox;
    var currStr = '';
    var spaces = '';
    var undo = new Stack();
    var redo = new Stack();
        
    this.setCurr = function(s) {
        currStr = s || document.getElementById(box.id).value;
        log('setCurr called with ' + currStr);
    };
    
    this.getCurr = function() {
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
    this.resetCurrStr = function() {
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
    
    
    this.processTrimArea = function() {
        var matches = [];
        var beginIndex = -1;
        var endIndex = -1;
        var minCol = box.c - 1, maxCol = 0;
        var re = '';
        this.setCurr();
        if (box.hasBorders)
            re = /[^\s][^\n]/gi; // /( [^\s][^\n])|([^\s][^\n]( |\|\n))/gi;
        else
            re = /[^\s]/gi; // /( [^\s])|(([^\s] )|[^\s]\|\n)/gi;
        matches = this.getCurr().match(re);

        if (matches.length) {
            beginIndex = this.getCurr().indexOf(matches[0]);
            endIndex = this.getCurr().lastIndexOf(matches[matches.length - 1]);
        }

        // rows have been cut down; trim extra col space now.
        var trimmed = this.getCurr().substring(beginIndex, endIndex + 1);

        if (DEBUG)
            document.getElementById('debug').innerHTML = beginIndex + " " + endIndex;

        var line = box.getRow(beginIndex);
        var stop = box.getRow(endIndex);
        var currLine;

        // find the min and max col values
        for (; line <= stop; line++) {
            currLine = this.getLine(line, false);
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
        for (line = box.getRow(beginIndex); line <= stop; line++) {
            currLine = this.getLine(line, false);

            newStr += currLine.substring(minCol, maxCol + 1);
            if (this.hasBorders)
                newStr += '|';
            if (line < stop)
                newStr += '\n';
        }

        //document.getElementById('debug').innerHTML = newStr;
        this.setCurr(newStr);
        this.pushUndo();
        return {
            r: stop - box.getRow(beginIndex) + 1,
            c: maxCol - minCol + 1
        };
    };
    
    this.processCopy = function(range) {
        clipboard = [];
        for (var row = range[0].row; row <= range[1].row; row++) {
            clipboard.push(this.getCurr().substring(box.positionFromCoordinates(row, range[0].col), box.positionFromCoordinates(row, range[1].col + 1)));
        }
    };
    
    this.replaceWithWhitespace = function(range) {
        var startPoint = range[0];
        var startRow = startPoint.row;
        var startCol = startPoint.col;
        var endPoint = range[1];
        var endRow = endPoint.row;
        var endCol = endPoint.col;
        var newStr = this.getCurr().substring(0, startPoint.pos);
            for (var row = startRow; row <= endRow; row++) {
                newStr += spaces.substring(0, endCol - startCol + 1);
                newStr += this.getCurr().substring(box.positionFromCoordinates(row, endCol + 1), box.positionFromCoordinates(row + 1, startCol));
            }
            newStr += this.getCurr().substring(box.positionFromCoordinates(row, startCol));
        this.setCurr(newStr);
    };
    
    this.processPaste = function() {
        var pasted = false;
        if (clipboard.length) {
            var newStr = this.getCurr().substring(0, box.getPos());
            var posRow = box.getPosPoint().row;
            var posCol = box.getPosPoint().col;
            if (posCol < box.c) {
                // index in a row string to cut off, in case of overflow
                var cutoff = Math.min(clipboard[0].length, box.c - posCol);
                var endOfRowIndex = Math.min(box.c, posCol + clipboard[0].length);
                for (var row = 0; (row < clipboard.length) && ((posRow + row) < box.r); row++) {
                    if (box.settings.pasteTransparent)
                        newStr += mergeOverSpace(clipboard[row].substring(0, cutoff), this.getCurr().substring(box.positionFromCoordinates(posRow + row, posCol), box.positionFromCoordinates(posRow + row, posCol + cutoff)));
                    else
                        newStr += clipboard[row].substring(0, cutoff);
                    newStr += this.getCurr().substring(box.positionFromCoordinates(posRow + row, endOfRowIndex), box.positionFromCoordinates(posRow + row + 1, posCol));
                }

                newStr += this.getCurr().substring(box.positionFromCoordinates(posRow + row, posCol));
                this.setCurr(newStr);
                this.pushUndo();
                pasted = true;
            }
        }
        return pasted;
    };
    
    this.clearStacks = function() {// put in model.js - done
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

        for (var currRow = 0; currRow < rows; currRow++) {
                if (currRow >= box.r)
                    newStr += emptyRow;
                else
                    newStr += this.getLine(currRow, false).substring(0, (cols < box.c) ? cols : box.c) + spacesToAdd + (box.hasBorders ? '|' : '');
                if (currRow < rows - 1)
                    newStr += '\n';
        }

        currStr = newStr||currStr;
    };
    
    this.writeBorders = function(bordersToSet) {
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
    
    this.assignCurrByRange = function(charToPut, ranges, colDiff, settings) {
        var fillLine = '';
        var newStr = '';
        var appendage = '';
        
        this.setCurr();
        
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
        this.pushUndo(); 
    };
    
    // Creates a new Image object containing only the things we need.
    this.ImageFactory = function() {
        return new Image(this.getCurr(), box.getPos(), box.r, box.c, spaces, box.hasBorders);
    };
    
    // Pushes a change to currStr to undo
    this.pushUndo = function() {
        console.log(currStr);

        undo.push(new Node(this.ImageFactory()));
        redo = new Stack();
    };

    // Pops from the undo stack and sets the stack top to the image
    this.processPopUndo = function() {// TODO: put in ui.js and split to model.js
        var pos;
        redo.push(undo.pop());
        if (undo.isEmpty()) {
            // TODO: Inefficient?
            box.makeBox(box.r, box.c);        box.setCaretToPos(document.getElementById(box.id), box.getPos());
        }
        else { 
            box.r = undo.top.item.ir;
            box.c = undo.top.item.ic;
            spaces = undo.top.item.sp;
            currStr = undo.top.item.currStr;
            box.bd.adjustBox();
            box.bd.setArea();
            if (box.hasBorders != undo.top.hb) {
                box.hasBorders = undo.top.hb;
                box.toggleBorders();
            }
            box.setCaretToPos(undo.top.item.pos);
        }
    };

    // Pops from the redo stack and sets the stack top to the image
    this.processPopRedo = function() {// TODO: put in ui.js and split to model.js
        if (redo.isEmpty()) return;
        var undid = redo.top.item;
        undo.push(redo.pop());
        if (undid) {
            box.r = undid.ir;
            box.c = undid.ic;
            spaces = undid.sp;
            currStr = undid.currStr;
            box.bd.setArea();
            if (box.hasBorders != undid.hb) {
                box.hasBorders = undid.hb;
                box.toggleBorders();
            }
            box.setCaretToPos(undid.pos);
            box.bd.adjustBox();
        }
        return undid;
    };
}
*/

// Manage the compnents of ascii-app
// focused isn't showing up -.-
(function(angular) {
    angular.module('AsciiApp').controller('MainController', ['$scope', '$rootScope', 'SettingService', function ($scope, $rootScope, SettingService) {
        var self = this;
//        console.log($filter);
//        self.footerCoords = $filter('pointRange')(new Range(new Point(0, 0), null));
        
        this.resetOnConfirm = function () {
            console.log('resetonconfirm called');
            SettingService.confirmReset();
        };
        
        this.changeBoxDims = function () {
            SettingService.changeBox();
        };
        
        this.toggleBoxBorders = function () {
            console.log('toggleboxborders called');
            SettingService.toggleBorders();
        };
        
        this.shiftVert = function (val) {
            SettingService.shiftVert(val);
        };
        
        this.shiftHoriz = function (val) {
            SettingService.shiftHoriz(val);
        };
    }]);
}) (window.angular);
