import { Component, /*Directive ,*/ Input, OnInit, ComponentFactoryResolver ,ViewContainerRef } from '@angular/core';

import { HelpTabComponent } from './help-tab.component';

@Component({
  selector:'test',
  template: '<div></div>',
  entryComponents: [HelpTabComponent],
})
export class Test implements OnInit{

  constructor(
    private resolver:ComponentFactoryResolver ,
    private viewContainerRef:ViewContainerRef
  ){}

  ngOnInit(){
    //Magic!
    this.resolver.resolveComponentFactory(HelpTabComponent)
    .create(this.viewContainerRef.injector);
  }

}