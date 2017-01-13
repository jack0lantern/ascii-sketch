import { Component, ViewChild, ViewContainerRef, ComponentFactoryResolver } from '@angular/core';
import { Tab } from './tab';
import { TABS } from './tabs';
import { HelpTabComponent } from './help-tab.component';

@Component({
	selector: 'setting-bar',
	templateUrl: 'app/templates/tabs.component.html',
})

export class SettingBarComponent {
  @ViewChild('placeholder',  {read: ViewContainerRef}) viewContainerRef;
  constructor(
    private resolver:ComponentFactoryResolver ,
    // private viewContainerRef:ViewContainerRef
  ){}

  ngOnInit(){
    //Magic!
    const factory = this.resolver.resolveComponentFactory(HelpTabComponent);
    this.viewContainerRef.createComponent(factory);
  }

	// Input()
	activeTab: Tab = TABS[0];
	tabs: Tab[] = TABS;

	setActiveTab(tab: Tab) : void {
		this.activeTab = tab;
	}
}

// export class Test implements OnInit{
//   @ViewChild('placeholder',  {read: ViewContainerRef}) viewContainerRef;
//   constructor(
//     private resolver:ComponentFactoryResolver ,
//     private viewContainerRef:ViewContainerRef
//   ){}

//   ngOnInit(){
//     //Magic!
//     const factory = this.resolver.resolveComponentFactory(HelpTabComponent);
//     this.viewContainerRef.createComponent(factory);
//   }

// }