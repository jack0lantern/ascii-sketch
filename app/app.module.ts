import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { TabContentComponent } from './tab-content.component'
import { SettingBarComponent } from './setting-bar.component';
import { HeroService } from './hero.service'

import { AppComponent }  from './app.component';

@NgModule({
  imports:      [
  	BrowserModule, 
  	FormsModule
  ],
  declarations: [ AppComponent, 
	  TabContentComponent, 
	  SettingBarComponent 
  ],
  bootstrap:    [ AppComponent ],
  providers:	[ HeroService ],
})

export class AppModule { }
