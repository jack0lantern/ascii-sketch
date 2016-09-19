// LEFT TO DO:
/*

// return the index of the range and if its a begin or end value if we found it, otherwise return the index of the range nearest to the searchItem on the higher end
function rangesBinarySearch (ranges, searchItem) {
    
}


// A manager for its box's string
function BoxController(outerBox) {
    var box = outerBox;
    var currStr = '';
    var spaces = '';
    var undo = new Stack();
    var redo = new Stack();
        

    
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
// http://stackoverflow.com/questions/24496201/load-html-template-from-file-into-a-variable-in-angularjs
(function(angular) {
    angular.module('AsciiApp').controller('MainController', ['$scope', '$rootScope', '$templateRequest', 'SettingService', function ($scope, $rootScope, $templateRequest, SettingService) {
        var self = this;
//        console.log($filter);
//        self.footerCoords = $filter('pointRange')(new Range(new Point(0, 0), null));
        
        self.tabs = [
            {
                name: 'Draw',
                path: 'tab-content/draw.html'
            },
            {
                name: 'Window',
                path: 'tab-content/window.html'
            },
            {
                name: 'Edit',
                path: 'tab-content/edit.html'
            },
            {
                name: 'Help',
                path: 'tab-content/help.html'
            }
        ];

        self.activeTab = self.tabs[0];
        
        self.isActiveTab = function (tab) {
            return (tab === self.activeTab) ? 'active_tab' : '';
        };
        
        self.setActiveTab = function (newTab) {
            self.activeTab = newTab;
        };
        
        // TODO: move the below to settingcontroller
        self.resetOnConfirm = function () {
            console.log('resetonconfirm called');
            SettingService.confirmReset();
        };
        
        self.changeBoxDims = function () {
            SettingService.changeBox();
        };
        
        self.toggleBoxBorders = function () {
            console.log('toggleboxborders called');
            SettingService.toggleBorders();
        };
        
        self.shiftVert = function (val) {
            SettingService.shiftVert(val);
        };
        
        self.shiftHoriz = function (val) {
            SettingService.shiftHoriz(val);
        };
    }]);
}) (window.angular);
