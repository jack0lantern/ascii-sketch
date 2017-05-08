import { Injectable } from '@angular/core';

// import { HEROES } from './mock-heroes';

@Injectable()
export class SettingService {
	constructor() {
		this.mode = null;
	}

	// Simulate slow connection
	// getHeroesSlowly(): Promise<Hero[]> {
	//   return new Promise(resolve => {
	//     // Simulate server latency with 2 second delay
	//     setTimeout(() => resolve(this.getHeroes()), 2000);
	//   });
	// }
}