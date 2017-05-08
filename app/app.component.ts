import { Component, OnInit } from '@angular/core';
import { HeroService } from './hero.service';

@Component({
  selector: 'ascii-app',
  templateUrl: `app/templates/hello.component.html`,
})

export class AppComponent implements OnInit { 
	constructor(private heroService: HeroService) {

	}

	ngOnInit(): void {
		this.getHeroes();
	}

	getHeroes(): void {
  	// this.heroService.getHeroes().then(heroes => this.heroes = heroes);
	}
}
