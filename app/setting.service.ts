import { Injectable, EventEmitter } from '@angular/core';
import { BoxComponent } from './boxes.component';

// import { HEROES } from './mock-heroes';

@Injectable()
export class SettingService {
	modes : any[] = [
        {
            name: 'line',
            path: 'app/img/line.png'
        },
        {
            name: 'block',
            path: 'app/img/square.png'
        },
        {
            name: 'bucket',
            path: 'app/img/bucket.png'
        },
        {
            name: 'circle',
            path: 'app/img/circle.png'
        }
    ];

    // If we ever extend utility to multiple canvasses, these vars come in handy
    boxes: BoxComponent[] = [];
    focused: BoxComponent;

    mode: string;
    fillMode: string;
    fillChar: string;
    bordersChecked: boolean;
    pasteTransparent: boolean;
    clipboard: string[];
    
    // TODO: consider deleting
    boxHeight: number = 20;
    boxWidth: number = 40;
    shiftValue: number = 1;

    resetter = new EventEmitter();
    dimsChanged = new EventEmitter();
    borders = new EventEmitter();
    shiftEmitter = new EventEmitter();
    trimEmitter = new EventEmitter();

	constructor() {
		// Initial values
		this.mode = 'line';	// line, block, bucket, circle
		this.fillMode = 'transparent'; // fill, transparent
		this.fillChar = ' ';
	    this.bordersChecked = false;
	    this.pasteTransparent = false;
	    this.clipboard = [];
	}

	getModes() {
		return this.modes;
	}

	getMode() {
		return this.mode;
	}

	setMode(mode: string) {
		this.mode = mode;
	}

	setFillMode(mode: string) {
		this.fillMode = mode;
	}

	reset(boxHeight: number, boxWidth: number) {
		this.resetter.emit({
			h: boxHeight, 
			w: boxWidth
		});
	}

	changeDims(boxHeight: number, boxWidth: number) {
		this.dimsChanged.emit({
			h: boxHeight,
			w: boxWidth
		});
	}

	toggleBorders() {
		this.borders.emit({});
	}

	shiftVert(n: number) {
		this.shiftEmitter.emit({
			vert: n,
			horiz: 0
		});
	}
	
	shiftHoriz(n: number) {
		this.shiftEmitter.emit({
			vert: 0,
			horiz: n
		});
	}

	trim() {
		this.trimEmitter.emit({});
	}

	pushBox(box: BoxComponent) {
		this.boxes.push(box);
		this.focused = box;
	}

	// Simulate slow connection
	// getHeroesSlowly(): Promise<Hero[]> {
	//   return new Promise(resolve => {
	//     // Simulate server latency with 2 second delay
	//     setTimeout(() => resolve(this.getHeroes()), 2000);
	//   });
	// }
}