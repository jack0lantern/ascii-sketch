import { Component, Output } from '@angular/core';
import { SettingService } from './setting.service';

@Component({
	selector: 'base-tab',
	template: 'Base tab content here'
})
class BaseTabComponent {
	name: string;
	selected: boolean;
	modes : any;

	constructor(protected settingService: SettingService){
		this.modes = this.settingService.getModes();
	}

	getMode() {
		return this.settingService.getMode();
	}

	setMode(mode: string) {
		this.settingService.setMode(mode);
	}
}

@Component({
	selector: 'draw-tab',
	templateUrl: 'app/templates/draw.component.html',
})

export class DrawTabComponent extends BaseTabComponent {
	name = 'Draw';
	selected = true;
	constructor(settingService: SettingService) {
		super(settingService);
	}
	getActiveClass(mode: string) {
		return mode === this.settingService.getMode() ? 'active_tool' : '';
	}
}

@Component({
	selector: 'edit-tab',
	templateUrl: 'app/templates/edit.component.html',
})

export class EditTabComponent extends BaseTabComponent {
	name = 'Edit';
	selected = false;
	constructor(settingService: SettingService) {
		super(settingService);
	}
}

@Component({
	selector: 'help-tab',
	templateUrl: 'app/templates/help.component.html',
})

export class HelpTabComponent extends BaseTabComponent {
	name = 'Help';
	selected = false;
	constructor(settingService: SettingService) {
		super(settingService);
	}
}

@Component({
	selector: 'window-tab',
	templateUrl: 'app/templates/window.component.html',
})

export class WindowTabComponent extends BaseTabComponent {
	name = 'Window';
	selected = false;
	constructor(settingService: SettingService) {
		super(settingService);
	}
}