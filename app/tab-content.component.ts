import { Component } from '@angular/core';
import { Tab } from './tab';

@Component({
  selector: 'my-tabs',
  templateUrl: 'app/templates/tabs.component.html'
})
export class TabContentComponent {
  
  tabs:Tab[] = [];
  selected : Tab;
  
  addTab(tab:Tab) {
    if (!this.tabs.length) {
      tab.selected = true;
    }
    this.tabs.push(tab);
  }
  
  selectTab(tab:Tab) {
    this.selected.selected = false;
    tab.selected = true;    
  }
}