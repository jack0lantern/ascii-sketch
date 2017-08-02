import { Component, ViewChild, ViewContainerRef, ComponentFactoryResolver, OnInit } from '@angular/core';
import { SettingService } from './setting.service';

@Component({
	selector: 'palette-char',
	template: '<input type="text" maxlength="1" class="palette" [(ngModel)]="char" (click)="setPencilChar()"/>',
})
export class PaletteCharComponent {
	char: string;
	constructor(private settingService: SettingService){
		this.char = 'q';
	}

	setPencilChar() {
		this.settingService.pencilChar = this.char;
	}
}

// TODO: Need id?
@Component({
	selector: 'palette',
	template: '<div #palette id="palette"></div>'
})
export class PaletteComponent implements OnInit {
	chars: string[];
	palette: any[];

	@ViewChild('palette',  {read: ViewContainerRef}) viewContainerRef : any;
	constructor(private settingService: SettingService,
				private resolver: ComponentFactoryResolver){
		this.chars = ['-', '=', '.', '\\', '/', 
					  '~', '`', '_', '|', '+'];
		this.palette = [];
	}

	ngOnInit() {
		const factory = this.resolver.resolveComponentFactory(PaletteCharComponent);
		for (var i = 0; i < this.chars.length; ++i) {
			var temp = this.viewContainerRef.createComponent(factory).instance;
			// TODO: prefer to do this with some kinda constructor
			temp.char = this.chars[i];
			this.palette.push(temp);
		}
	}
}