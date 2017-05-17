import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { SettingBarComponent } from './setting-bar.component';
import { BoxesComponent } from './boxes.component';
import * as Tabs from './tabs.component';
import { SettingService } from './setting.service';

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
	  SettingBarComponent,
    BoxesComponent
  ].concat(tabs),
  bootstrap:    [ AppComponent ],
  providers:	[ SettingService ],
  entryComponents: [

  ].concat(tabs)
})

export class AppModule { }
