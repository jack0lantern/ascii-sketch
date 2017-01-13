import { Component, ComponentFactory, ViewChild, ViewContainerRef, ComponentFactoryResolver } from '@angular/core';
import * as tabComponents from './tabs.component';

@Component({
	selector: 'setting-bar',
	templateUrl: 'app/templates/tabs.component.html',
})

export class SettingBarComponent {
  tabs: any[] = []
	// Input()
	activeTab: any

  @ViewChild('placeholder',  {read: ViewContainerRef}) viewContainerRef : any;
  constructor(
    private resolver:ComponentFactoryResolver ,
    // private viewContainerRef:ViewContainerRef
  ){}

  ngOnInit(){
    //Magic!
    // this.factory = this.resolver.resolveComponentFactory(HelpTabComponent);
  	for (let i in tabComponents) {
  	// 	let component = {
			// 	selector: TABS[i].name + '-tab',
			// 	templateUrl: TABS[i].path,
			// };
			// @Component(component) 
			// class Com {}

			const factory = this.resolver.resolveComponentFactory(tabComponents[i]);

  		this.tabs.push(this.viewContainerRef.createComponent(factory).instance);
  	}		
		this.activeTab = this.tabs[0];
  }


	setActiveTab(tab: any) : void {
		this.activeTab = tab;

	}
}
