import { Directive, ElementRef, Input, Output, EventEmitter } from '@angular/core';

class Caret {
	element: ElementRef;

	constructor(element: ElementRef, callback: any, position: number) {
		this.element = element;
	}
}

@Directive({
	selector: '[caret-begin]'
})
export class CaretBegin {
	private caret: Caret;
	private _position: number;

	@Input() set setCaret(position: number) {
		this._position = position;
	}

	@Output() caretChange = new EventEmitter();

	ngOnInit() {
		this.caret = new Caret(this.caret.element, this.onCaretChange.bind(this), this._position);
	}

	onCaretChange() {
		console.log('oncaretchange');
	}
}