import { Component, Output } from '@angular/core';
import { SettingService } from './setting.service';

@Component({
	selector: 'base-tab',
	template: 'Error!'
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
	isCustom : boolean = false;
	fillChar : string = this.settingService.fillChar;

	log(msg: any) {
		console.log(msg);
	}

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
        console.log('iscustom ' + this.isCustom);
        
        if (this.fillToggled) {
            if (this.isCustom) {
            	this.settingService.setFillMode('custom');
            }
            else
 	           this.settingService.setFillMode('fill');
        }
        else {
            this.settingService.setFillMode('transparent');
        }
	}

	setChar() {
		this.settingService.fillChar = this.fillChar;
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
	h: number;
	w: number;

	constructor(settingService: SettingService) {
		super(settingService);
		this.h = settingService.boxHeight;
		this.w = settingService.boxWidth;
	}

    bordersChecked = this.settingService.bordersChecked;
    shiftValue = this.settingService.shiftValue;

	resetOnConfirm() {
        var reset = confirm('Are you sure you want to clear the image? All your work will be lost. Press OK to continue or Cancel to cancel.');
        if (reset) {
        	this.settingService.reset(this.h, this.w);
        }
	}

	changeBoxDims() {
		this.settingService.changeDims(this.h, this.w);
	}

	toggleBoxBorders() {
		this.settingService.toggleBorders();
	}

	shiftVert() {
		this.settingService.shiftVert(this.shiftValue);
	}

	shiftHoriz() {
		this.settingService.shiftHoriz(this.shiftValue);
	}

	trim() {
		this.settingService.trim();
	}
}