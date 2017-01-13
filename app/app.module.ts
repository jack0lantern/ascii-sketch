import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { TabContentComponent } from './tab-content.component'
import { SettingBarComponent } from './setting-bar.component';
import { HelpTabComponent } from './help-tab.component';
// import { EditTabComponent } from './edit-tab.component';
// import { WindowTabComponent } from './window-tab.component';
// import { DrawTabComponent } from './draw-tab.component';
import { HeroService } from './hero.service';
import { Test } from './dyn.component';

import { AppComponent }  from './app.component';

@NgModule({
  imports:      [
  	BrowserModule, 
  	FormsModule
  ],
  declarations: [ AppComponent, 
	  TabContentComponent, 
	  SettingBarComponent,
    Test,
    HelpTabComponent
  ],
  bootstrap:    [ AppComponent ],
  providers:	[ HeroService ],
  entryComponents: [

    HelpTabComponent, 
  //   EditTabComponent, 
  //   WindowTabComponent,
  //   DrawTabComponent,
    ]
})

export class AppModule { }
