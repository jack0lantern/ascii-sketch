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
}

@Component({
	selector: 'draw-tab',
	templateUrl: 'app/templates/draw.component.html',
})

export class DrawTabComponent extends BaseTabComponent {
	name = 'Draw';
	selected = true;
	fillToggled : boolean = false;

	constructor(settingService: SettingService) {
		super(settingService);
	}

	getMode() {
		return this.settingService.getMode();
	}

	setMode(mode: string) {
		this.settingService.setMode(mode);
	}

	getActiveClass(mode: string) {
		return mode === this.settingService.getMode() ? 'active_tool' : '';
	}

	toggleFill() {
        // The fillToggled check is the NEW value.
        if (this.fillToggled) {
            this.settingService.fillMode = 'fill';
        }
        else {
            this.settingService.fillMode = 'transparent';
        }
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

    boxHeight = this.settingService.boxHeight;
    boxWidth = this.settingService.boxWidth;
    bordersChecked = this.settingService.bordersChecked;
    shiftValue = this.settingService.shiftValue;

	// TODO
	setDims() {

	}

	// TODO
	resetOnConfirm() {

	}

	// TODO
	changeBoxDims() {

	}

	// TODO
	toggleBoxBorders() {

	}

	// TODO
	shiftVert() {

	}

	// TODO
	shiftHoriz() {

	}

	// TODO
	trim() {

	}
}