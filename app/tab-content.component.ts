// currently not in use

import { Component, ComponentFactory, ViewChild, ViewContainerRef, ComponentFactoryResolver } from '@angular/core';
import { Tab } from './tab';
import * as tabComponents from './tabs.component';


@Component({
  selector: 'my-tabs',
  templateUrl: 'app/templates/tabs.component.html'
})
export class TabContentComponent {
  
  tabs : Tab[] = [];
  selectedTab : Tab;

  // @ViewChild('placeholder',  {read: ViewContainerRef}) viewContainerRef : any;
  constructor(
    private resolver:ComponentFactoryResolver ,
    // private viewContainerRef:ViewContainerRef
  ){}

  ngOnInit(){
    //Magic!
    // this.factory = this.resolver.resolveComponentFactory(HelpTabComponent);
    for (let i in tabComponents) {
    //   let component = {
      //   selector: TABS[i].name + '-tab',
      //   templateUrl: TABS[i].path,
      // };
      // @Component(component) 
      // class Com {}
      console.log(i);
      const factory = this.resolver.resolveComponentFactory(tabComponents[i]);

      this.tabs.push(this.viewContainerRef.createComponent(factory).instance);
    }    
    this.selectedTab = this.tabs[0];
  }
  
  addTab(tab : Tab) {
    if (!this.tabs.length) {
      tab.selected = true;
    }
    this.tabs.push(tab);
  }
  
  selectTab(tab : Tab) {
    this.selectedTab.selected = false;
    tab.selected = true;    
  }
}