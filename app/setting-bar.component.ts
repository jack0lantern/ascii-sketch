import { Component, ComponentFactory, ViewChild, ViewContainerRef, ComponentFactoryResolver } from '@angular/core';
import * as tabComponents from './tabs.component';
import { SettingService } from './setting.service';

@Component({
	selector: 'setting-bar',
	templateUrl: 'app/templates/tabs.component.html',
})

export class SettingBarComponent {
	tabs: any[] = [];
	activeTab: any;

	@ViewChild('placeholder',  {read: ViewContainerRef}) viewContainerRef : any;
	constructor(
	private resolver:ComponentFactoryResolver,
	private settingService : SettingService, 
	// private viewContainerRef:ViewContainerRef
	){}

	ngOnInit(){
		// Magic!
		// this.factory = this.resolver.resolveComponentFactory(HelpTabComponent);
		for (let i in tabComponents) {
			const factory = this.resolver.resolveComponentFactory(tabComponents[i]);

			this.tabs.push(this.viewContainerRef.createComponent(factory).instance);
		}		
		this.activeTab = this.tabs[0];
	}

	setActiveTab(tab: any) : void {
		this.activeTab.selected = false;
		this.activeTab = tab;
		tab.selected = true;
	}

	getActiveClass(mode: any) {
		return mode.name == this.settingService.mode;
	}
}
