import { Injectable } from '@angular/core';

// import { HEROES } from './mock-heroes';

@Injectable()
export class SettingService {
	modes : any[] = [
        {
            name: 'line',
            path: 'img/line.png'
        },
        {
            name: 'block',
            path: 'img/square.png'
        },
        {
            name: 'bucket',
            path: 'img/bucket.png'
        },
        {
            name: 'circle',
            path: 'img/circle.png'
        }
    ];

	constructor() {
		
	}

	// Simulate slow connection
	// getHeroesSlowly(): Promise<Hero[]> {
	//   return new Promise(resolve => {
	//     // Simulate server latency with 2 second delay
	//     setTimeout(() => resolve(this.getHeroes()), 2000);
	//   });
	// }
}