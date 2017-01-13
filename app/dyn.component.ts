import { Directive , ViewChild, Input, OnInit, ComponentFactoryResolver ,ViewContainerRef } from '@angular/core';

import { HelpTabComponent } from './help-tab.component';

@Directive({
  selector:'test'
})
export class Test implements OnInit{
  @ViewChild('placeholder',  {read: ViewContainerRef}) viewContainerRef;
  constructor(
    private resolver:ComponentFactoryResolver ,
    private viewContainerRef:ViewContainerRef
  ){}

  ngOnInit(){
    //Magic!
    const factory = this.resolver.resolveComponentFactory(HelpTabComponent);
    this.viewContainerRef.createComponent(factory);
  }

}