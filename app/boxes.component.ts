import { Component, OnInit, ComponentFactory, ViewChild, ViewContainerRef, ComponentFactoryResolver, HostListener, ElementRef } from '@angular/core';
import { SettingService } from './setting.service';
import { Point, Queue, Stack, Image } from './data-structures';
import { keys } from './keys';

// TODO: fix corner case startcol = this.c should still work
@Component({
	selector: 'box',
	template: '<textarea #myBox rows="{{ r + 1 }}" cols="{{ c + (hasBorders ? 2 : 1) }}" [ngModel]=currStr (keypress)="setCaret(myBox, onKeyPress($event))" (click)="getCaret(myBox)" (keydown)="getCaret(myBox); setCaret(myBox, nonKeyPress($event))" (cut)="getCaret(myBox); copy(true, $event)" (copy)="copy(false, $event)" (paste)="paste($event)"></textarea>',
	// styleUrls: ['app/css/style.css']
})
export class BoxComponent {
	hasBorders: boolean = false;
	r: number;
	c: number;
	currStr: string;
	position: Point = new Point(0, 0, 0);
	// inclusive of indices TODO: make end-exclusive with Points?
	range: number[] = [0, 0];
	mouseDown: boolean;
	spaces: string = '';
	undo: Stack;
	redo: Stack;

	log(val: any) {
		console.log(val);
	}

	constructor(private settingService: SettingService) {
		this.r = settingService.boxHeight;
		this.c = settingService.boxWidth;
		this.undo = new Stack();
		this.redo = new Stack();
		this.resetCurrStr();
	}

	ngOnChanges(changes: any) {
		console.log('changes: ' + changes);
	}

	// TODO: make subscription based on whether focused (in settingservice) or not
	ngOnInit() {
		this.settingService.resetter.subscribe((data: any) => {
			this.makeBox(data.h, data.w);
		});

		this.settingService.dimsChanged.subscribe((data: any) => {
			this.adjustCurrStr(data.h, data.w);
		});

		this.settingService.borders.subscribe((data: any) => {
			this.toggleBorders();
		});

		this.settingService.shiftEmitter.subscribe((data: any) => {
			if (data.vert == 0) {
				this.shiftCurrHoriz(data.horiz);
			}
			else if (data.horiz == 0) {
				this.shiftCurrVert(data.vert);
			}
			else {
				this.shiftCurrHoriz(data.horiz);
				this.shiftCurrVert(data.vert);
			}
		});

		this.settingService.trimEmitter.subscribe((data: any) => {
			this.trimArea();
		});

		this.settingService.copyEmitter.subscribe((data: any) => {
			this.copy(data.cut, null);
		});

		this.settingService.pasteEmitter.subscribe((data: any) => {
			this.paste(null);
		});

		this.settingService.doEmitter.subscribe((data: any) => {
			if (data.undo) {
				this.popUndo();
			}
			else {
				this.popRedo();
			}
		});
	}

	setPos(n: number) {
		this.position.row = this.getRow(n);
		this.position.col = this.getCol(n);
		this.position.pos = n;
		return n;
	}

	getCaret(element: any) {
		if ('selectionStart' in element) {
//          console.log('selectionstart in' + element.selectionStart);
			this.setPos(element.selectionStart);
			this.range = [element.selectionStart, element.selectionEnd];
			return [element.selectionStart, element.selectionEnd];
		} /*else if (document.selection) {
			element.focus();
			var sel = document.selection.createRange();
			var selLen = document.selection.createRange().text.length;
			sel.moveStart('character', -element.value.length);
			return sel.text.length - selLen;
		}*/
	}

	setCaret(element: any, caretPos: number) {
		console.log('setcaret ' + caretPos);
		if (typeof caretPos != 'undefined') {
			if (element.createTextRange) {
				var range = element.createTextRange();
				range.move('character', caretPos);
				range.select();
			}
			else {
				var that = this;
	//            Zone.current.run(
	 //               function() {
	//					console.log('box value ' + element.value);
						console.log(element);
	//					console.log(Zone.current);
						element.focus();
						if (element.selectionStart !== undefined) {
							
							element.setSelectionRange(caretPos, caretPos);
						}
						console.log(this.position.pos);
	   //             }
	   //         );
			}
		}
		console.log('end setcaret');
	}

	/*** UTIL ***/
	// Takes a new subject and imposes it on tgt, taking tgt's content where subject has a space.
	mergeOverSpace(subject: string, tgt: string) {
		if (subject && tgt && subject.length === tgt.length) {
			var i = 0;
			var result = '';
			while(i < subject.length) { // TODO: make more efficient with regex? Will be more complicated
				if (subject[i] === keys.CHAR_SPACE)
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

	inRange(value: number, a: number, b: number) {
		return (a <= value && value <= b) || (b <= value && value <= a);
	}

	// loop through ranges list, if it is within 1 outside of a range, absorb it, otherwise add new range
	// return the changed range
	// @param value: a number we are adding to the range
	// @param ranges: the ranges array we are adding to
	// NOTE: this is a HUUUGE bottle neck for certain functions like bucket. optimize it
	addToRanges(value: number, ranges: any[]) {// TODO: put in model.js
	// optimization idea: have object store adjacent indexes as keys and actual indexes as values. finding if a number can be added to an existing range is O(1)
		var changedRange = null;
		// assert(ranges, 'ranges is ' + ranges);
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
	/*** END UTIL ***/

	// returns the row index from the cursor position.
	getRow (pos: number) {// put in ui.js  - done
		return Math.floor(pos / (this.hasBorders ? (this.c + 2) : (this.c + 1)));
	}

	// returns the col index from the cursor position.
	getCol (pos: number) {// put in ui.js - done
		return pos % (this.hasBorders ? (this.c + 2) : (this.c + 1));
	}

	positionFromCoordinates (ri: number, ci: number) {// put in ui.js - done
	   return ri * (this.hasBorders ? (this.c + 2) : (this.c + 1)) + ci; 
	}

	shouldEnqueue (toReplace: string, pos: number, visited: boolean[]) {
		return visited[pos] === undefined && pos >= 0 && this.getRow(pos) < this.r && this.getCol(pos) < this.c && this.currStr.charAt(pos) === toReplace;
	}

	// Determine a list of ranges in which to assign the new character (in ranges, 
	// a array of two-element range arrays, which are inclusive endpoints)
	// A dynamic approach
	dynBucketHelper (ranges: any[], toReplace: string, posPt: Point) {// put in model.js
		var toCheckQ = new Queue();
		var visited = [];

		toCheckQ.enqueue(posPt);
		visited[posPt.pos] = true;

		while(!toCheckQ.isEmpty()) {
			var currentPosPt = toCheckQ.dequeue();
			var currentPos = currentPosPt.pos;
			this.addToRanges(currentPos, ranges);

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
	}
	
	getBucketRanges (start: Point) {
		var charToFlood = this.currStr.charAt(start.pos);
		var ranges: any[] = [];
		this.dynBucketHelper(ranges, charToFlood, start);
		//bucketHelper(ranges, charToFlood, [], start);
		return ranges;
	}

	// Draws a line of copies of a character, repeated as frequently as possible over an interval specified by the user's selection
	getLineRanges (start: Point, end: Point) {// TODO: split
		var startRow = start.row, endRow = end.row;
		var startCol = Math.min(start.col, this.c - 1), endCol = Math.min(end.col, this.c - 1);

		// note: rowDiff always >= 0, same CANNOT be said for colDiff
		var rowDiff = endRow - startRow, colDiff = endCol - startCol;
		var rowsMoreThanCols = rowDiff > Math.abs(colDiff);
		var d = rowDiff / colDiff;
		d = d || 0; // in case d is NaN due to 0/0
		var colSgn = Math.sign(colDiff);
		var ranges: any[] = [];
		var rounder = Math.round;

		if (rowsMoreThanCols) {
			for(var row = 0; row <= rowDiff; ++row) {
				var currentCol = rounder(row / d);
				var point = this.positionFromCoordinates(startRow + row, Math.min(startCol + currentCol, this.c - 1));
				this.addToRanges(point, ranges);
			}
		}
		else {
			for(var col = 0; col <= Math.abs(colDiff); ++col) {
				var currentRow = rounder(Math.abs(col * d));
				var point = this.positionFromCoordinates(startRow + currentRow, Math.min(startCol + colSgn*col, this.c - 1));
				this.addToRanges(point, ranges);
			}
		}
		return ranges;
	}

	// Create the range set for a block and load it
	getBlockRanges (start: Point, end: Point) {// TODO: split
		var startRow = start.row, endRow = end.row;
		var startCol = Math.min(start.col, end.col), endCol = Math.max(start.col, end.col);
		startCol = Math.min(startCol, this.c - 1), endCol = Math.min(endCol, this.c - 1);

		// assert rowDiff >= 0 && colDiff >= 0
		var rowDiff = endRow - startRow, colDiff = endCol - startCol; 

		if (rowDiff === 0 || colDiff === 0) {
			return this.getLineRanges(start, end);
		}

		var trueStart = this.positionFromCoordinates(startRow, startCol);
		var ranges = [[trueStart, trueStart + endCol - startCol], [this.positionFromCoordinates(endRow, startCol), this.positionFromCoordinates(endRow, endCol)]];

		for (var i = 1; i < endRow - startRow; i++) {
			this.addToRanges(this.positionFromCoordinates(startRow + i, startCol), ranges);
			this.addToRanges(this.positionFromCoordinates(startRow + i, endCol), ranges);
		}
		return ranges;
	}


	// Put all the ranges of currStr that must be changes to user-input char into ranges
	getEllipseRanges (start: Point, end: Point) {
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

		var ranges: any[] = [];

		var col;
		var row;

		for (var y = 0; y < Math.min(2 * yLim, this.r - 1 - startRow); y++) {
			col = startCol + Math.round(-Math.sqrt((1 - Math.pow(y - yRad, 2)/yDen)*xDen) + xRad);
			this.addToRanges(this.positionFromCoordinates(startRow + y, col), ranges);

			col = startCol + Math.round(Math.sqrt((1 - Math.pow(y - yRad, 2)/yDen)*xDen) + xRad);
			this.addToRanges(this.positionFromCoordinates(startRow + y, col), ranges);
		}

		// For the octant, xLim is the stopping point, but use 2*xLim to mirror it across the y axis. Cuz math.
		for (var x = 0; x <= Math.min(2 * xLim, this.c - 1 - startCol); x++) {
			row = startRow + Math.round(-Math.sqrt((1 - Math.pow(x - xRad, 2)/xDen)*yDen) + yRad);
			this.addToRanges(this.positionFromCoordinates(row, startCol + x), ranges);

			row = startRow + Math.round(Math.sqrt((1 - Math.pow(x - xRad, 2)/xDen)*yDen) + yRad);
			this.addToRanges(this.positionFromCoordinates(row, startCol + x), ranges);
		}
		//alert(ranges);
		return ranges;
	}

	
	// ranges is an array of ranges of indexes in which to fill with charToPut
	// inside the box's canvas
	// loadRanges takes ranges and displays them according to the settings
	loadRanges (charToPut: string, ranges: any[], colDiff: number) {
		// ASSERT ranges[0][0] is defined
		if (ranges[0][0] === undefined)
			return;
		
		var fillLine = '';
		var newStr = '';
		var appendage = '';

		for (var i = 0; i < this.c; i++)
			fillLine += charToPut;

		console.log(this.settingService.fillMode);
		if (this.settingService.fillMode === 'custom') 
			for (var i = 0; i < colDiff; i++) 
				appendage += this.settingService.fillChar;
		else
			appendage = fillLine;

		newStr = this.currStr.substring(0, ranges[0][0]);

		for (var i = 0; i < ranges.length; i++) {
			var endIndex = ranges[i][1] - ranges[i][0] + 1;
			newStr += fillLine.substring(0, endIndex);
			if (i < ranges.length - 1) {
				if (this.settingService.mode === 'bucket' || this.settingService.fillMode === 'transparent' || this.getRow(ranges[i][1]) != this.getRow(ranges[i + 1][0]))
					newStr += this.currStr.substring(ranges[i][1] + 1, ranges[i + 1][0]);
				else
					newStr += appendage.substring(0, ranges[i + 1][0] - ranges[i][1] - 1);                            
			}
			else
				newStr += this.currStr.substring(ranges[i][1] + 1);
		}
		this.currStr = newStr;
	}

	/*@HostListener('keypress', ['$event']) */onKeyPress(e: any) {
		var unicode = null;

		if (window.event) { // IE                   
				unicode = e.keyCode;
		} else if (e.which) { // Netscape/Firefox/Opera                 
			unicode = e.which;
		}
		console.log('keypress ' + unicode);

		if (!(e.altKey || e.ctrlKey) && unicode) {
			e.preventDefault();

			if (unicode === keys.ENTER) { // TODO: remember where user started typing
				e.preventDefault();
				console.log('enter' + this.positionFromCoordinates(this.position.row + 1, this.position.col));

				return this.positionFromCoordinates(this.position.row + 1, this.position.col);
			}

			var row = this.position.row;
			var d = this.position.col;
			if (d >= this.c) { 
				return this.position.pos + 1;
			}

			var startPoint = new Point(this.getRow(this.range[0]), this.getCol(this.range[0]), this.range[0]), 
				endPoint   = new Point(this.getRow(this.range[1]), this.getCol(this.range[1]), this.range[1]);

			// this line was not in ang1 version. o.o
			var ranges;

			// TODO: SO much repetitive code! There must be a better design.
			switch (this.settingService.mode) {
				case 'pencil':
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

			// TODO: by using PointRange, get rid of colDiff arg/param
			// return this info and run loadranges in directive
			
			this.loadRanges(String.fromCharCode(unicode), ranges, Math.abs(endPoint.col - startPoint.col) + 1);
//          console.log('onkeypress ends');
			this.pushUndo();
			return this.setPos(this.position.pos + 1);
		}
		else if (e.ctrlKey) {  
			// event listeners do CUT/COPY/PASTE. Should have event listeners for this.undo/this.redo too? Would have to build from scratch, as there is no built-in event for them
			if (e.which === keys.CHAR_Z) {
				e.preventDefault(); // this doesn't actually seem to prevent the default this.undo action for other textboxes
	            this.popUndo(); // TODO
			}
			else if (e.which === keys.CHAR_Y) {
				e.preventDefault();
	            this.popRedo(); // TODO
			}
		}
	}

	// Things that don't categorize as keypress behavior
	/*@HostListener('keyup', ['$event'])*/ nonKeyPress(e: any) {
		if (!(e.altKey || e.ctrlKey)) {
			var unicode = null;
			if (window.event) { // IE					
					unicode = e.keyCode;
			}else
				if (e.which) { // Netscape/Firefox/Opera					
					unicode = e.which;
				 }
			
			console.log('non key press ' + unicode);
			var d = this.position.col;

			if (unicode === keys.BACKSPACE) {
				e.preventDefault();

				if (d <= this.c && d != 0) {
					this.currStr = this.currStr.substring(0, this.position.pos - 1) + keys.CHAR_SPACE + this.currStr.substring(this.position.pos);
				}
				return this.position.pos - 1;
			}
			else if (unicode === keys.SHIFT) {
				if (this.mouseDown) {
					// Insert code to straighten selection line here
				}
			}
			else if (unicode === keys.DELETE) { 
				e.preventDefault();
				if (d < this.c)
				{
					var temp = this.currStr.substring(0, this.position.pos) + keys.CHAR_SPACE + this.currStr.substring(this.position.pos + 1);
					this.currStr = temp; 
					return this.position.pos;
				}
			}
		}
	}

    replaceWithWhitespace(range: any) {
        var startPoint = range[0];
        var startRow = startPoint.row;
        var startCol = startPoint.col;
        var endPoint = range[1];
        var endRow = endPoint.row;
        var endCol = endPoint.col;
        var newStr = this.currStr.substring(0, startPoint.pos);
            for (var row = startRow; row <= endRow; row++) {
                newStr += this.spaces.substring(0, endCol - startCol + 1);
                newStr += this.currStr.substring(this.positionFromCoordinates(row, endCol + 1), this.positionFromCoordinates(row + 1, startCol));
            }
            newStr += this.currStr.substring(this.positionFromCoordinates(row, startCol));
        this.currStr = newStr;
    }

	// Puts a block selection in the clipboard.
    // If cut is set, we white-space out the block selection in addition.
    copy(cut: boolean, e: any) {
    	if (e)
    		e.preventDefault();
        var start = this.range[0], end = this.range[1];
        var startRow = this.getRow(start), endRow = this.getRow(end);
        var startCol = Math.min(this.getCol(start), this.getCol(end)), endCol = Math.max(this.getCol(start), this.getCol(end));
        startCol = Math.min(startCol, this.c - 1);
        endCol = Math.min(endCol, this.c - 1);
        
        // Note: coldiff is recomputed needlessly in replacewithwithspace.
        var colDiff = endCol - startCol;    
        if (colDiff === 0) {
            return;
        }
        var pointRange = [new Point(startRow, startCol, start), new Point(endRow, endCol, end)];

		this.settingService.clipboard = [];
        for (var row = pointRange[0].row; row <= pointRange[1].row; row++) {
            this.settingService.clipboard.push(this.currStr.substring(this.positionFromCoordinates(row, pointRange[0].col), this.positionFromCoordinates(row, pointRange[1].col + 1)));
        }

        if (cut) {
            this.replaceWithWhitespace(pointRange);
        }

    	this.pushUndo();
    }

    paste(e: any) {
    	if (e)
    		e.preventDefault();
        var pasted = false;
        if (this.settingService.clipboard.length) {
            var newStr = this.currStr.substring(0, this.position.pos);
            var posRow = this.position.row;
            var posCol = this.position.col;
            if (posCol < this.c) {
                // index in a row string to cut off, in case of overflow
                var cutoff = Math.min(this.settingService.clipboard[0].length, this.c - posCol);
                var endOfRowIndex = Math.min(this.c, posCol + this.settingService.clipboard[0].length);
                for (var row = 0; (row < this.settingService.clipboard.length) && ((posRow + row) < this.r); row++) {
                    if (this.settingService.pasteTransparent)
                        newStr += this.mergeOverSpace(this.settingService.clipboard[row].substring(0, cutoff), this.currStr.substring(this.positionFromCoordinates(posRow + row, posCol), this.positionFromCoordinates(posRow + row, posCol + cutoff)));
                    else
                        newStr += this.settingService.clipboard[row].substring(0, cutoff);
                    newStr += this.currStr.substring(this.positionFromCoordinates(posRow + row, endOfRowIndex), this.positionFromCoordinates(posRow + row + 1, posCol));
                }

                newStr += this.currStr.substring(this.positionFromCoordinates(posRow + row, posCol));
                this.currStr = newStr;
                this.pushUndo();
                pasted = true;
            }
        }
        console.log('paste: ' + newStr);
        return pasted;
    }

    clearStacks() {// put in model.js - done
        this.undo = new Stack();
        this.redo = new Stack();
    };

    
    // Creates a new Image object containing only the things we need.
    ImageFactory() {
        return new Image(this.currStr, this.position.pos, this.r, this.c, this.spaces, this.hasBorders);
    }
    
    // Pushes a change to currStr to this.undo
    pushUndo() {
        this.undo.push(this.ImageFactory());
        this.redo = new Stack();
    }

    // Pops from the this.undo stack and sets the stack top to the image
    popUndo() {// TODO: put in ui.js and split to model.js
        var pos;
        var temp = this.undo.pop();
        if (temp) {
        	this.redo.push(temp);
        }
        if (this.undo.isEmpty()) {
            // TODO: Inefficient?
            this.resetCurrStr();        
//            this.setCaretToPos(this..., this.position.pos);
        }
        else { 
            this.r = this.undo.top.item.ir;
            this.c = this.undo.top.item.ic;
            this.spaces = this.undo.top.item.sp;
            this.currStr = this.undo.top.item.currStr;
            if (this.hasBorders != this.undo.top.item.hb) {
                this.hasBorders = this.undo.top.item.hb;
                this.toggleBorders();
            }
//            this.setCaretToPos(this.undo.top.item.pos);
        }
    };

    // Pops from the this.redo stack and sets the stack top to the image
    popRedo() {// TODO: put in ui.js and split to model.js
        if (this.redo.isEmpty()) return;
        var undid = this.redo.top.item;
        this.undo.push(this.redo.pop());
        if (undid) {
            this.r = undid.ir;
            this.c = undid.ic;
            this.spaces = undid.sp;
            this.currStr = undid.currStr;
            if (this.hasBorders != undid.hb) {
            	this.hasBorders = undid.hb;
                this.toggleBorders();
            }
 //           this.setCaretToPos(undid.pos);
        }
        return undid;
    }

	// Sets currStr to an empty box string
	resetCurrStr() {
		var border = this.hasBorders ? '|' : '';
		this.currStr = '';
		// TODO: make a more efficient way to reassign spaces, depending on whether or not the new value is more or less.
		this.spaces = '';

		for (var i = 0; i < this.c; i++) { 
			this.spaces += keys.CHAR_SPACE;
		}
		this.spaces += border + '\n';
		for (var j = 0; j < this.r; j++) {
			if (j < this.r - 1)
				this.currStr += this.spaces;
			else
				this.currStr += this.spaces.substring(0, this.spaces.length - 1);  // chop off last \n
		}
	}

	// any type correct?
	setDims(h: any, w: any) {
			this.r = parseInt(h || this.r);
			this.c = parseInt(w || this.c);
	}

	// Grow or shrink the textarea's dimensions while maintaining content as much as possible. Chops off content on shrink, adds spaces on grow.
	adjustCurrStr (h: number, w: number) {
		console.log('adjustCurrStr called hasBorders: ' + h + ' ' + w + ' ' + this.hasBorders);
		var newHeight = h;
		var newWidth = w;
		if (this.r === newHeight && this.c === newWidth)
			return;

		// TODO: change spaces implementation to not include borders or newline characters to avoid this substring use
		var emptyRow = this.spaces.substring(0, this.c);
		var newStr = '';
		var spacesToAdd = '';
		var i = this.c;
		
		while (i++ < newWidth) {
			spacesToAdd += keys.CHAR_SPACE;
			emptyRow += keys.CHAR_SPACE;
		}
		
		if (this.c > newWidth) {
			emptyRow = emptyRow.substring(this.c - newWidth);
		}
		
		// should make an accessor for hasborders? used in other places
		var borderChar = this.hasBorders ? '|' : '';
		emptyRow += borderChar;
		this.spaces = emptyRow + '\n';
		for (var currRow = 0; currRow < newHeight; currRow++) {
				if (currRow >= this.r)
					newStr += emptyRow;
				else
					newStr += this.getLine(currRow, false).substring(0, Math.min(newWidth, this.c)) + spacesToAdd + borderChar;
				if (currRow < newHeight - 1)
					newStr += '\n';
		}

		this.setDims(newHeight, newWidth);
		this.currStr = newStr || this.currStr;
	}

	toggleBorders() {
		console.log('toggleBorders called');
		var newStr = '';
		for (var i = 0; i < this.r; ++i) {
			var temp = this.getLine(i, false);
			if (this.hasBorders) {
				newStr += temp.substring(0, temp.length - 1) + (i < (this.r - 1) ? '\n' : '');
			}
			else {
				newStr += temp + '|' + (i < (this.r - 1) ? '\n' : '');
			}
		}
		this.currStr = newStr;
		this.hasBorders = !this.hasBorders;
	}

	makeBox (h: number, w: number) {
		console.log('makebox h: ' + h + 'w: ' + w);
		this.clearStacks();
		this.setDims(h, w);
		this.resetCurrStr();
	};

	// TODO:
	getLine(line: number, withNewLine: boolean): string {
		if (line < this.r) {
			var str = '';
			var newlineIndex = this.hasBorders ? this.c + 1 : this.c;
			var addNewline = withNewLine ? 0 : -1;
			str = this.currStr.substring(line * (newlineIndex + 1), (line + 1) * (newlineIndex + 1) + addNewline);
//                console.log('first index ' + (line * (newlineIndex + 1)) + ' end index ' + ((line + 1) * (newlineIndex + 1) - addNewline));
			return str;
		}
		return '';
	}

	// 
	shiftCurrHoriz(rawUnits: string) {
		var newStr = '';
		var spaces = this.spaces;
		var units = parseInt(rawUnits);
		var padSpaces = spaces.substring(0, Math.abs(units));
		var i;
		var startIdx = 0;
		var endIdx = this.c;

		if (units > 0) {
			units = Math.min(this.c, units); // in case the user puts a number > cols
			endIdx -= units;
		}
		else if (units < 0) {
			units = Math.max(-this.c, units);
			startIdx -= units;
		}
		else
			return;

		for (i = 0; i < this.r; i++) {
			var temp = this.getLine(i, false);
			if (units > 0)
				newStr += padSpaces;
			newStr += temp.substring(startIdx, endIdx);
			if (units < 0)
				newStr += padSpaces;
			newStr += this.hasBorders ? '|' : '';
			newStr += i < (this.r - 1) ? '\n' : '';
		}
		this.currStr = newStr;
        this.pushUndo(); //TODO
	};

	// TODO: combine with horiz
	shiftCurrVert(rawUnits: string) {
		var newStr = '';
		var i;
		var lineLen;
		var startIdx = 0;
		var endIdx = this.currStr.length;
		var units = parseInt(rawUnits);
		var spaces = this.spaces;

		lineLen = spaces.length;
		if (units > 0) {
			units = Math.min(this.r, units); // in case the user puts a number > rows
			startIdx += units*lineLen;
		}
		else if (units < 0) {
			units = Math.max(-this.r, units);
			endIdx += units*lineLen;
		}
		else
			return;

		if (units < 0) {
			for (i = 0; i < Math.abs(units); i++)
				newStr += spaces;
		}
		newStr += this.currStr.substring(startIdx, endIdx);
		if (units > 0) {
			newStr += '\n';
			for (i = 0; i < Math.abs(units); i++)
				newStr += spaces;
			newStr = newStr.substring(0, newStr.length - 1); // take off the last \n
		}

		this.currStr = newStr;
        this.pushUndo(); //TODO
	};

	// TODO:
	// Clears out all whitespace surrounding the image and resizes to close on
	// the image as tightly as possible.
	trimArea() {// TODO: split
		var matches = [];
		var beginIndex = -1;
		var endIndex = -1;
		var minCol = this.c - 1, maxCol = 0;
		var re: RegExp;
		var hasBorders = this.hasBorders;

		if (hasBorders)
		    re = /[^\s][^\n]/gi; // /( [^\s][^\n])|([^\s][^\n]( |\|\n))/gi;
		else
		    re = /[^\s]/gi; // /( [^\s])|(([^\s] )|[^\s]\|\n)/gi;
		matches = this.currStr.match(re);

		if (matches) {
		    beginIndex = this.currStr.indexOf(matches[0]);
		    endIndex = this.currStr.lastIndexOf(matches[matches.length - 1]);
		}
		else {
			return;
		}
		
		// rows have been cut down; trim extra col space now.
		var trimmed = this.currStr.substring(beginIndex, endIndex + 1);
		
		// if (DEBUG)
		//     document.getElementById('debug').innerHTML = beginIndex + " " + endIndex;
		
		var line: number = this.getRow(beginIndex);
		var stop = this.getRow(endIndex);
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
		
		// if (DEBUG)
		//     document.getElementById('debug').innerHTML = "min/max col values: " + minCol + " " + maxCol;
		
		// Create the new canvas string
		var newStr = '';
		for (line = this.getRow(beginIndex); line <= stop; line++) {
		    currLine = this.getLine(line, false);

		    newStr += currLine.substring(minCol, maxCol + 1);
		    if (hasBorders)
		        newStr += '|';
		    if (line < stop)
		        newStr += '\n';
		}
		
		//document.getElementById('debug').innerHTML = newStr;
		this.currStr = newStr;
		
		this.r = stop - this.getRow(beginIndex) + 1;
		this.c = maxCol - minCol + 1;
		
		this.pushUndo();
	}
}

@Component({
	selector: 'boxes',
	template: `
		<div>
			<div #boxes>
			</div>
		</div>
	`
})
export class BoxesComponent implements OnInit {
	@ViewChild('boxes',  {read: ViewContainerRef}) viewContainerRef : any;
	constructor(
		private resolver:ComponentFactoryResolver,
		private settingService:SettingService) {
	}

	ngOnInit() {
		const factory = this.resolver.resolveComponentFactory(BoxComponent);
		this.settingService.pushBox(this.viewContainerRef.createComponent(factory).instance);
	}
}

