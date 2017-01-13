import { Component, ComponentFactory, ViewChild, ViewContainerRef, ComponentFactoryResolver } from '@angular/core';
import { Tab } from './tab';
import { TABS } from './tabs';

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
    // this.factory = this.resolver.resolveComponentFactory(HelpTabComponent);
  	for (let i = 0; i < TABS.length; ++i) {

			const factory = this.resolver.resolveComponentFactory(TABS[i].component);

  		this.viewContainerRef.createComponent(factory);
  	}		
		
  }

	// Input()
	activeTab: Tab = TABS[0];
	tabs: Tab[] = TABS;

	setActiveTab(tab: Tab) : void {
		this.activeTab = tab;

	}
}