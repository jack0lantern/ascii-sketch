import { Tab } from './tab';
import { HelpTabComponent } from './help-tab.component';
import { EditTabComponent } from './edit-tab.component';
import { WindowTabComponent } from './window-tab.component';
import { DrawTabComponent } from './draw-tab.component';

export const TABS : Tab[] = [
	{
		name: 'Draw',
		path: 'app/templates/draw.component.html',
		component: DrawTabComponent,
		selected: false
	},
	{
		name: 'Window',
		path: 'app/templates/window.component.html',
		component: WindowTabComponent,
		selected: false
	},
	{
		name: 'Edit',
		path: 'app/templates/edit.component.html',
		component: EditTabComponent,

		selected: false
	},
	{
		name: 'Help',
		path: 'app/templates/help.component.html',
		component: HelpTabComponent,
		selected: false
	},
];