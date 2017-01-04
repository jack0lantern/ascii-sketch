import { Component } from '@angular/core';
import { Tab } from './tab';
import { TABS } from './tabs';

@Component({
	selector: 'setting-bar',
	templateUrl: 'app/templates/tabs.component.html',
})

export class SettingBarComponent {
	// Input()
	activeTab: Tab = TABS[0];
	tabs: Tab[] = TABS;

	setActiveTab(tab: Tab) : void {
		this.activeTab = tab;
	}
}