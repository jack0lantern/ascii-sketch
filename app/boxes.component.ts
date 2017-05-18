import { Component, OnInit, ComponentFactory, ViewChild, ViewContainerRef, ComponentFactoryResolver, HostListener } from '@angular/core';
import { SettingService } from './setting.service';

@Component({
	selector: 'box',
	template: '<textarea rows=20 cols=40 [ngModel]=currStr></textarea>',
	// styleUrls: ['app/css/style.css']
})
export class BoxComponent {
	CHAR_SPACE: string = ' ';

	hasBorders: boolean = false;
	r: number;
	c: number;
	currStr: string;

	constructor(private settingService: SettingService) {
		this.r = settingService.boxHeight;
		this.c = settingService.boxWidth;
		this.resetCurrStr();
	}



	@HostListener('keypress', ['$event']) onKeyPress(e: any) {
	// 	var unicode = null;

	//     if (window.event) { // IE					
	//             unicode = e.keyCode;
	//     } else if (e.which) { // Netscape/Firefox/Opera					
 //            unicode = e.which;
 //         }

	//     if (!(e.altKey || e.ctrlKey) && unicode) {
	//         e.preventDefault();

	//         var row = position.row;
	//         var d = position.col;
	//         if (d >= c) { 
	//             return position.pos + 1;
	//         }

	//         var startPoint = new Point(getRow(range[0]), getCol(range[0]), range[0]), 
	//             endPoint   = new Point(getRow(range[1]), getCol(range[1]), range[1]);

	//         // TODO: SO much repetitive code! There must be a better design.
	//         switch (SettingService.mode) {
	//             case 'line':
	//                 ranges = getLineRanges(startPoint, endPoint);
	//                 break;

	//             case 'block':
	//                 ranges = getBlockRanges(startPoint, endPoint);
	//                 break;

	//             case 'bucket':
	//                 ranges = getBucketRanges(startPoint);
	//                 break;

	//             case 'circle':                      
	//                 ranges = getEllipseRanges(startPoint, endPoint);
	//                 break;

	//             default:
	//                 ranges = null;
	//                 console.log('invalid mode');
	//         }

	//         // TODO: by using PointRange, get rid of colDiff arg/param
	//         // return this info and run loadranges in directive
	        
	//         loadRanges(String.fromCharCode(unicode), ranges, Math.abs(endPoint.col - startPoint.col) + 1);
	//         return position.pos + 1;
	//     }
	//     else if (e.ctrlKey) {  
	//         // event listeners do CUT/COPY/PASTE. Should have event listeners for undo/redo too? Would have to build from scratch, as there is no built-in event for them
	//         if (e.which === CHAR_Z) {
	//             e.preventDefault(); // this doesn't actually seem to prevent the default undo action for other textboxes
	// //                    popUndo();// TODO
	//         }
	//         else if (e.which === CHAR_Y) {
	//             e.preventDefault();
	// //                    popRedo(); // TODO
	//         }
 //  	  	}
  	}

	// Sets currStr to an empty box string
    resetCurrStr() {
        var border = this.hasBorders ? '|' : '';
        this.currStr = '';
        // TODO: make a more efficient way to reassign spaces, depending on whether or not the new value is more or less.
        this.settingService.spaces = '';

        for (var i = 0; i < this.c; i++) { 
            this.settingService.spaces += this.CHAR_SPACE;
        }
        this.settingService.spaces += border + '\n';
        for (var j = 0; j < this.r; j++) {
            if (j < this.r - 1)
                this.currStr += this.settingService.spaces;
            else
                this.currStr += this.settingService.spaces.substring(0, this.settingService.spaces.length - 1);  // chop off last \n
        }
    }

    // any type correct?
    setDims(h: any, w: any) {
            this.r = parseInt(h || this.r);
            this.c = parseInt(w || this.c);
    }

    // TODO:
    adjustBox() {
        // self.rows = r + 1;
        // self.cols = c + (hasBorders? 2 : 1);
    }

    makeBox (h: number, w: number) {
        console.log('makebox h: ' + h + 'w: ' + w);
        this.setDims(h, w);
        this.resetCurrStr();
        this.adjustBox();
    };

	// TODO:
	getRow(idx: number): number {
		return 0;
	}

	// TODO:
	getLine(line: number, border: boolean): string {
		return '';
	}

	// TODO:
	// Clears out all whitespace surrounding the image and resizes to close on
	// the image as tightly as possible.
	trimArea() {// TODO: split
	    var matches = [];
	    var beginIndex = -1;
	    var endIndex = -1;
	    var minCol = c - 1, maxCol = 0;
	    var re: RegExp;
	    var hasBorders = this.hasBorders;

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
	    
	    this.adjustBox();
	    // this.pushUndo();
	}
}

@Component({
	selector: 'boxes',
	template: `
		<div id="content">
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

