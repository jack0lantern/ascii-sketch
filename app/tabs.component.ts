import { Component, Output } from '@angular/core';

@Component({
	selector: 'draw-tab',
	templateUrl: 'app/templates/draw.component.html',
})

export class DrawTabComponent {
	name = 'Draw';
	selected = true;
}

@Component({
	selector: 'edit-tab',
	templateUrl: 'app/templates/edit.component.html',
})

export class EditTabComponent {
	name = 'Edit';
	selected = false;
}

@Component({
	selector: 'help-tab',
	templateUrl: 'app/templates/help.component.html',
})

export class HelpTabComponent {
	name = 'Help';
	selected = false;
}

@Component({
	selector: 'window-tab',
	templateUrl: 'app/templates/window.component.html',
})

export class WindowTabComponent {
	name = 'Window';
	selected = false;
}