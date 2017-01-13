import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { TabContentComponent } from './tab-content.component'
import { SettingBarComponent } from './setting-bar.component';
import * as Tabs from './tabs.component';
import { HeroService } from './hero.service';

import { AppComponent }  from './app.component';

let tabs = [];
for (let i in Tabs) {
  tabs.push(Tabs[i]);
}

@NgModule({
  imports:      [
  	BrowserModule, 
  	FormsModule
  ],
  declarations: [ AppComponent, 
	  TabContentComponent, 
	  SettingBarComponent,
  ].concat(tabs),
  bootstrap:    [ AppComponent ],
  providers:	[ HeroService ],
  entryComponents: [

  ].concat(tabs)
})

export class AppModule { }
