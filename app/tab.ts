
import { Directive } from '@angular/core';

@Directive({
  selector: 'tab',
})
export class Tab {
	selected = false;
}