// LEFT TO DO:
/*
// TODO: DELETE ALL DEBUG SECTIONS
// TODO: Replace all two-element arrays representing points with Point objs, and ranges with PointRange objs 

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
    
    this.getPosPoint = function() {
        return position;
    }
    
    this.getPos = function() {
        return position.pos;
    };
    
    this.togglePaste = function() {
        this.settings.pasteTransparent = !this.settings.pasteTransparent;
    };
        
    this.setCaretToPos = function(pos) {
        log('setCaretToPos Calledddddddd ' + pos);
        this.setSelectionRange(pos, pos);
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


        boxObj.on('keyup', function() {
            that.setFooterCoords();
        });
        boxObj.on('mousedown', function() {
            that.setMouseDown();
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
    
    
//    onkeydown:
//    1. script runs
//    2. key executes
//    a a a a ... a   | \n
//    0 1 2 3 ... c-1 c c+1
//
//    TODO should do nothing on (but no preventDefault()):
//    esc, f1, f2, ... f12, prtsc, (ins?), home, end, pgUp, pgDown, tab, capslock, shift(unless its with a char), ctrl, alt, windows, command, apple, arrow keys, menu, scroll lock, num lock
//    


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
    
    var popUndo = function() {
        that.bs.processPopUndo();
    };
    
    var popRedo = function() {
        that.bs.processPopRedo();
    };
}

function BoxDisplay(outerBox) {
    

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

        $(Id('toggleBorders')).on('click', function() {//
            that.boxes[0].toggleBorders(); 
        });
        
        $(Id('pasteTrans')).on('click', function() { 
            that.boxes[0].paste();
        });
        
        $(Id('resetButton')).on('click', function() { //
            that.boxes[0].confirmReset();
        });
        
        $(Id('changeButton')).on('click', function() {//
            that.boxes[0].changeBox(document.getElementById('h').value, document.getElementById('w').value);
        });
        
        $(Id('shiftVertButton')).on('click', function() {//
            that.boxes[0].shiftVert(document.getElementById('shiftValue').value);
        });
        
        $(Id('shiftHorizButton')).on('click', function() {//
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
*/

(function(angular) {
    angular.module('AsciiApp').controller('BoxController', ['$scope', 'SettingService', function ($scope, SettingService) {
        var r = SettingService.getHeight();
        var c = SettingService.getWidth();
        var self = this;
        // self.rows, self.cols, self.currStr;
        var CHAR_SPACE = ' ';
        var CHAR_Y = 25;
        var CHAR_Z = 26;
        var TAB_CONTENT_SUFFIX = '_content';
        
        var hasBorders = false;
        var position = 0;
        var range = null; // TODO: need position if we have range?
        var mouseDown = false;

        var MAX_BOX_HEIGHT = 1000;
        var MAX_BOX_WIDTH = 1000;
        
        self.log = function (txt) {
            console.log(txt);
        };
        
        // public functions
        self.makeBox = function (h, w) {
            console.log('makebox h: ' + h + 'w: ' + w);
            setDims(h, w);
            resetCurrStr();
            adjustBox();
            SettingService.focused = self;
        };
        
        self.setPosPoint = function (pointOfOrigin) {
            position = new Point(getRow(pointOfOrigin), getCol(pointOfOrigin), pointOfOrigin);
        };
        
        // rangeArray: [beginIndex, endIndex]
        self.coordsFromRange = function (rangeArray) {
            range = rangeArray;
            var display = [getRow(rangeArray[0]), getCol(rangeArray[0])].join(', ') 
            
            if (rangeArray[0] != rangeArray[1]) {
                display += ') -- (' +  [getRow(rangeArray[1]), getCol(rangeArray[1])].join(', ');
            }
            return display;
        };
        
        // Keeps the contents, changes the canvas dimensions. Previously, changeBox. 
        self.crop = function () {
            adjustCurrStr();
            adjustBox();
        };

        // 
        self.toggleBorders = function () {
            var temp = '';
            var offset; // adjust cursor for newly removed or inserted borders
            console.log('toggle borders called');
            if (hasBorders) {
                this.cols = c + 1;
                offset = -Math.floor(position / (c + 2));
                SettingService.spaces = SettingService.spaces.substring(0, c) + '\n';
            }
            else {
                this.cols = c + 2;
                offset = Math.floor(position / (c + 1));
                SettingService.spaces = SettingService.spaces.substring(0, c) + '|\n';
            }
            writeBorders();

            console.log('position new ' + position);
            
            hasBorders = !hasBorders;
        };
        
        // 
        this.shiftCurrHoriz = function(units) {
            var newStr = '';
            var spaces = SettingService.spaces;
            var padSpaces = spaces.substring(0, Math.abs(units));
            var i;
            var startIdx = 0;
            var endIdx = c;

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
            self.currStr = newStr;
    //        this.pushUndo(); //TODO
        };

        //
        self.shiftCurrVert = function(units) {
            var newStr = '';
            var i;
            var lineLen;
            var startIdx = 0;
            var endIdx = self.currStr.length;
            var spaces = SettingService.spaces;
            units = parseInt(units);

            lineLen = spaces.length;
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
                    newStr += spaces;
            }
            newStr += self.currStr.substring(startIdx, endIdx);
            if (units > 0) {
                newStr += '\n';
                for (i = 0; i < Math.abs(units); i++)
                    newStr += spaces;
                newStr = newStr.substring(0, newStr.length - 1); // take off the last \n
            }

            self.currStr = newStr;
    //        this.pushUndo(); //TODO
        };
        
        //    onkeydown:
        //    1. script runs
        //    2. key executes
        //    a a a a ... a   | \n
        //    0 1 2 3 ... c-1 c c+1
        //
        //    TODO should do nothing on (but no preventDefault()):
        //    esc, f1, f2, ... f12, prtsc, (ins?), home, end, pgUp, pgDown, tab, capslock, shift(unless its with a char), ctrl, alt, windows, command, apple, arrow keys, menu, scroll lock, num lock
        //    
        this.changeChar = function(e) {// TODO: split
            var unicode = null;

            if (window.event) { // IE					
                    unicode = e.keyCode;
            } else
                if (e.which) { // Netscape/Firefox/Opera					
                    unicode = e.which;
                 }

            if (!(e.altKey || e.ctrlKey) && unicode) {
                e.preventDefault();

                var row = position.row;
                var d = position.col;
                if (d >= c) { 
                    return position.pos + 1;
                }

                var startPoint = new Point(getRow(range[0]), getCol(range[0]), range[0]), 
                    endPoint   = new Point(getRow(range[1]), getCol(range[1]), range[1]);

                // TODO: SO much repetitive code! There must be a better design.
                switch (SettingService.mode) {
                    case 'line':
                        ranges = getLineRanges(startPoint, endPoint);
                        break;

                    case 'block':
                        ranges = getBlockRanges(startPoint, endPoint);
                        break;

                    case 'bucket':
                        ranges = getBucketRanges(startPoint);
                        break;

                    case 'circle':                      
                        ranges = getEllipseRanges(startPoint, endPoint);
                        break;

                    default:
                        ranges = null;
                        console.log('invalid mode');
                }

                // TODO: by using PointRange, get rid of colDiff arg/param
                // return this info and run loadranges in directive
                
                loadRanges(String.fromCharCode(unicode), ranges, Math.abs(endPoint.col - startPoint.col) + 1);
                return position.pos + 1;
            }
            else if (e.ctrlKey) {  
                // event listeners do CUT/COPY/PASTE. Should have event listeners for undo/redo too? Would have to build from scratch, as there is no built-in event for them
                if (e.which === CHAR_Z) {
                    e.preventDefault(); // this doesn't actually seem to prevent the default undo action for other textboxes
//                    popUndo();// TODO
                }
                else if (e.which === CHAR_Y) {
                    e.preventDefault();
//                    popRedo(); // TODO
                }
            }
        };

        // returns the new cursor position to set
        this.nonKeyPress = function(e) {// TODO: split
            if (!(e.altKey || e.ctrlKey)) {
                var unicode = null;
                if (window.event) { // IE					
                        unicode = e.keyCode;
                }else
                    if (e.which) { // Netscape/Firefox/Opera					
                        unicode = e.which;
                     }

                var d = position.pos.col;

                // the below should be in model.js TODOs
                if (unicode === BACKSPACE) {
                    if (d > c || d == 0) {
                        e.preventDefault();
                    }
                    else {
                        self.currStr = self.currStr.substring(0, position.pos) + CHAR_SPACE +  self.currStr.substring(position.pos);
                        return position.pos;
                    }
                }
                else if (unicode === DELETE) { 
                    if (d >= c)
                        e.preventDefault();
                    else {
                        self.currStr = self.currStr.substring(0, position.pos + 1) + CHAR_SPACE + self.currStr.substring(position.pos + 1);
                    }
                }
                else if (unicode === ENTER) { // TODO: remember where user started typing
                    e.preventDefault();
                    return positionFromCoordinates(position.row + 1, position.col);
                }
                else if (unicode === SHIFT) {
                    if (mouseDown) {
                        // Insert code to straighten selection line here
                    }
                }
            }
        };
        
        // Init
        self.makeBox();
        
        // Internal functions
        function setDims (h, w) {
            r = parseInt(h || r);
            c = parseInt(w || c);
        }
        
        // returns the line at a given row index. This cuts off the ending \n.
        // Mostly a helper.
        // TODO: refactor so that withNewLine false also trims off border
        function getLine (line, withNewLine) {    // lines are 0 indexed
            if (line < r) {
                var str = '';
                var newlineIndex = hasBorders ? c + 1 : c;
                var addNewline = withNewLine ? 0 : -1;
                str = self.currStr.substring(line * (newlineIndex + 1), (line + 1) * (newlineIndex + 1) + addNewline);
//                console.log('first index ' + (line * (newlineIndex + 1)) + ' end index ' + ((line + 1) * (newlineIndex + 1) - addNewline));
                return str;
            }
            return '';
        }
        
        // ranges is an array of ranges of indexes in which to fill with charToPut
        // inside the box's canvas
        // loadRanges takes ranges and displays them according to the settings
        function loadRanges (charToPut, ranges, colDiff) {
            // ASSERT ranges[0][0] is defined
            if (ranges[0][0] === undefined)
                return;
            
            var fillLine = '';
            var newStr = '';
            var appendage = '';

            for (var i = 0; i < c; i++)
                fillLine += charToPut;

            if (SettingService.fillMode === 'custom') 
                for (var i = 0; i < colDiff; i++) 
                    appendage += SettingService.fillChar;
            else
                appendage = fillLine;

            newStr = self.currStr.substring(0, ranges[0][0]);

            for (var i = 0; i < ranges.length; i++) {
                var endIndex = ranges[i][1] - ranges[i][0] + 1;
                newStr += fillLine.substring(0, endIndex);
                if (i < ranges.length - 1) {
                    if (SettingService.mode === 'bucket' || SettingService.fillMode === 'transparent' || getRow(ranges[i][1]) != getRow(ranges[i + 1][0]))
                        newStr += self.currStr.substring(ranges[i][1] + 1, ranges[i + 1][0]);
                    else
                        newStr += appendage.substring(0, ranges[i + 1][0] - ranges[i][1] - 1);                            
                }
                else
                    newStr += self.currStr.substring(ranges[i][1] + 1);
            }
            self.currStr = newStr;
            $scope.$apply();
                
        }
        
        // Sets currStr to an empty box string
        function resetCurrStr () {
            var border = hasBorders ? '|' : '';
            self.currStr = '';
            // TODO: make a more efficient way to reassign spaces, depending on whether or not the new value is more or less.
            SettingService.spaces = '';

            for (var i = 0; i < c; i++) { 
                SettingService.spaces += CHAR_SPACE;
            }
            SettingService.spaces += border + '\n';
            for (var j = 0; j < r; j++) {
                if (j < r - 1)
                    self.currStr += SettingService.spaces;
                else
                    self.currStr += SettingService.spaces.substring(0, SettingService.spaces.length - 1);  // chop off last \n
            }
        }
        
        
        // Grow or shrink the textarea's dimensions while maintaining content as much as possible. Chops off content on shrink, adds spaces on grow.
        function adjustCurrStr () {
            console.log('adjustCurrStr called hasBorders: ' + hasBorders);
            var newHeight = SettingService.getHeight();
            var newWidth = SettingService.getWidth();
            if (r === newHeight && c === newWidth)
                return;

            // TODO: change spaces implementation to not include borders or newline characters to avoid this substring use
            var emptyRow = SettingService.spaces.substring(0, c);
            var newStr = '';
            var spacesToAdd = '';
            var i = c;
            
            while (i++ < newWidth) {
                spacesToAdd += CHAR_SPACE;
                emptyRow += CHAR_SPACE;
            }
            
            if (c > newWidth) {
                emptyRow = emptyRow.substring(c - newWidth);
            }
            
            // should make an accessor for hasborders? used in other places
            var borderChar = hasBorders ? '|' : '';
            emptyRow += borderChar;
            SettingService.spaces = emptyRow + '\n';
            for (var currRow = 0; currRow < newHeight; currRow++) {
                    if (currRow >= r)
                        newStr += emptyRow;
                    else
                        newStr += getLine(currRow, false).substring(0, Math.min(newWidth, c)) + spacesToAdd + borderChar;
                    if (currRow < newHeight - 1)
                        newStr += '\n';
            }

            setDims(newHeight, newWidth);
            self.currStr = newStr||currStr;
        }
        
        function adjustBox () {
            self.rows = r + 1;
            self.cols = c + (hasBorders? 2 : 1);
        }
        
        function writeBorders() {
            console.log('writeborders called');
            var newStr = '';
            for (var i = 0; i < r; ++i) {
                var temp = getLine(i, false);
                if (hasBorders) {
                    newStr += temp.substring(0, temp.length - 1) + (i < (r - 1) ? '\n' : '');
                }
                else {
                    newStr += temp + '|' + (i < (r - 1) ? '\n' : '');
                }
            }
            self.currStr = newStr;
        }
            
        // returns the row index from the cursor position.
        function getRow (pos) {// put in ui.js  - done
            return Math.floor(pos / (hasBorders ? (c + 2) : (c + 1)));
        }

        // returns the col index from the cursor position.
        function getCol (pos) {// put in ui.js - done
            return pos % (hasBorders ? (c + 2) : (c + 1));
        }
            
        // return the textarea index of the character at a specified row and col
        function positionFromCoordinates (ri, ci) {// put in ui.js - done
           return ri * (hasBorders ? (c + 2) : (c + 1)) + ci; 
        };
        
        // Draws a line of copies of a character, repeated as frequently as possible over an interval specified by the user's selection
        // TODO: refactor for loadranges use
        function getLineRanges (start, end) {// TODO: split
            var startRow = start.row, endRow = end.row;
            var startCol = Math.min(start.col, c - 1), endCol = Math.min(end.col, c - 1);

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
                    var point = positionFromCoordinates(startRow + row, Math.min(startCol + currentCol, c - 1));
                    addToRanges(point, ranges);
                }
            }
            else {
                for(var col = 0; col <= Math.abs(colDiff); ++col) {
                    var currentRow = rounder(Math.abs(col * d));
                    var point = positionFromCoordinates(startRow + currentRow, Math.min(startCol + colSgn*col, c - 1));
                    addToRanges(point, ranges);
                }
            }
            return ranges;
        };
        
        // Create the range set for a block and load it
        function getBlockRanges (start, end) {// TODO: split
            var startRow = start.row, endRow = end.row;
            var startCol = Math.min(start.col, c - 1), endCol = Math.min(end.col, c - 1);
            startCol = Math.min(startCol, c - 1);
            endCol = Math.min(endCol, c - 1);
            // note: rowDiff always >= 0, same CANNOT be said for colDiff
            var rowDiff = endRow - startRow, colDiff = endCol - startCol; 

            if (rowDiff === 0 || colDiff === 0) {
                return getLineRanges(start, end);
            }

            var trueStart = positionFromCoordinates(startRow, startCol);
            var ranges = [[trueStart, trueStart + endCol - startCol], [positionFromCoordinates(endRow, startCol), positionFromCoordinates(endRow, endCol)]];

            for (var i = 1; i < endRow - startRow; i++) {
                addToRanges(positionFromCoordinates(startRow + i, startCol), ranges);
                addToRanges(positionFromCoordinates(startRow + i, endCol), ranges);
            }
            return ranges;
        }

        // Put all the ranges of currStr that must be changes to user-input char into ranges
        function getEllipseRanges (start, end) {
            var startRow = start.row;
            var endRow = end.row;

            var startCol = Math.min(start.col, end.col), endCol = Math.max(start.col, end.col);
            startCol = Math.min(startCol, c - 1);
            endCol = Math.min(endCol, c - 1);

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

            for (var y = 0; y < Math.min(2 * yLim, r - 1 - startRow); y++) {
                col = startCol + Math.round(-Math.sqrt((1 - Math.pow(y - yRad, 2)/yDen)*xDen) + xRad);
                addToRanges(positionFromCoordinates(startRow + y, col), ranges);

                col = startCol + Math.round(Math.sqrt((1 - Math.pow(y - yRad, 2)/yDen)*xDen) + xRad);
                addToRanges(positionFromCoordinates(startRow + y, col), ranges);
            }

            // For the octant, xLim is the stopping point, but use 2*xLim-Pivot to mirror it across the y axis. Cuz math.
            for (var x = 0; x <= Math.min(2 * xLim, c - 1 - startCol); x++) {
                row = startRow + Math.round(-Math.sqrt((1 - Math.pow(x - xRad, 2)/xDen)*yDen) + yRad);
                addToRanges(positionFromCoordinates(row, startCol + x), ranges);

                row = startRow + Math.round(Math.sqrt((1 - Math.pow(x - xRad, 2)/xDen)*yDen) + yRad);
                addToRanges(positionFromCoordinates(row, startCol + x), ranges);
            }
            //alert(ranges);
            return ranges;
        }

        function shouldEnqueue (toReplace, pos, visited) {
            return visited[pos] === undefined && pos >= 0 && getRow(pos) < r && getCol(pos) < c && self.currStr.charAt(pos) === toReplace;
        }

        // Determine a list of ranges in which to assign the new character (in ranges, 
        // a array of two-element range arrays, which are inclusive endpoints)
        // A dynamic approach
        function dynBucketHelper (ranges, toReplace, posPt) {// put in model.js
            var toCheckQ = new Queue();
            var visited = [];

            toCheckQ.enqueue(posPt);
            visited[posPt.pos] = true;

            while(!toCheckQ.isEmpty()) {
                var currentPosPt = toCheckQ.dequeue().item;
                var currentPos = currentPosPt.pos;
                addToRanges(currentPos, ranges);

                var posToCheck;
                if (shouldEnqueue(toReplace, posToCheck = positionFromCoordinates(currentPosPt.row + 1, currentPosPt.col), visited)) {
                    toCheckQ.enqueue(new Point(currentPosPt.row + 1, currentPosPt.col, posToCheck));
                    visited[posToCheck] = true;
                }
                if (shouldEnqueue(toReplace, posToCheck = currentPos + 1, visited)) {
                    toCheckQ.enqueue(new Point(currentPosPt.row, currentPosPt.col + 1, posToCheck));
                    visited[posToCheck] = true;
                }
                if (shouldEnqueue(toReplace, posToCheck = currentPos - 1, visited)) {
                    toCheckQ.enqueue(new Point(currentPosPt.row, currentPosPt.col - 1, posToCheck));
                    visited[posToCheck] = true;
                }
                if (shouldEnqueue(toReplace, posToCheck = positionFromCoordinates(currentPosPt.row - 1, currentPosPt.col), visited)) {
                    toCheckQ.enqueue(new Point(currentPosPt.row - 1, currentPosPt.col, posToCheck));
                    visited[posToCheck] = true;
                }
            }
        }
    
        function getBucketRanges (start) {
            var charToFlood = self.currStr.charAt(start.pos);
            var ranges = [];
            dynBucketHelper(ranges, charToFlood, start);
            //bucketHelper(ranges, charToFlood, [], start);
            return ranges;
        }
        
    }]);
}) (window.angular);
