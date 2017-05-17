import { Component, OnInit } from '@angular/core';
import { SettingService } from './setting.service';

@Component({
  selector: 'ascii-app',
  templateUrl: `app/templates/app.component.html`,
})

export class AppComponent implements OnInit { 
	constructor(private settingService: SettingService) {

	}

	ngOnInit(): void {
		// this.getHeroes();
	}

	getHeroes(): void {
  	// this.heroService.getHeroes().then(heroes => this.heroes = heroes);
	}
}
