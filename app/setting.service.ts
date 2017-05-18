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

    boxes: any[] = [];
    focused: BoxComponent;

    mode: string;
    fillMode: string;
    boxHeight: number;
    boxWidth: number;
    bordersChecked: boolean;
    shiftValue: number;

    modeUpdated = new EventEmitter();
    fillModeUpdated = new EventEmitter();

	constructor() {
		this.mode = 'line';	// line, block, bucket, circle
		this.fillMode = 'transparent'; // fill, transparent
		this.boxHeight = 20;
	    this.boxWidth = 40;
	    this.bordersChecked = false;
	    this.shiftValue = 1;
	}

	getModes() {
		return this.modes;
	}

	getMode() {
		return this.mode;
	}

	setMode(mode: string) {
		this.mode = mode;
		this.modeUpdated.emit(mode);
	}

	setFillMode(mode: string) {
		this.fillMode = mode;
		this.fillModeUpdated.emit(mode);
	}

	reset() {
	}

	pushBox(box: BoxComponent) {
		this.boxes.push(box);
		console.log(this.boxes);
	}

	// Simulate slow connection
	// getHeroesSlowly(): Promise<Hero[]> {
	//   return new Promise(resolve => {
	//     // Simulate server latency with 2 second delay
	//     setTimeout(() => resolve(this.getHeroes()), 2000);
	//   });
	// }
}