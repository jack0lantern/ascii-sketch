import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HeroDetailComponent } from './hero-detail.component'
import { HeroService } from './hero.service'

import { AppComponent }  from './app.component';

@NgModule({
  imports:      [
  	BrowserModule, 
  	FormsModule
  ],
  declarations: [ AppComponent, HeroDetailComponent ],
  bootstrap:    [ AppComponent ],
  providers:	[ HeroService ]
})

export class AppModule { }
