import { Component, Input, ComponentFactoryResolver } from '@angular/core';


@Component({
  selector: 'tab-content',
  template: '<div id="tab_content"></div>',
})

export class TabContentComponent {
	public constructor(private loader: ComponentFactoryResolver){
		
    }

    ngOnInit() {
    
      @Component({ selector: 'article-' + 1, templateUrl: 'article-' + 1 + '.html' })
      class ArticleFakeComponent{}

      const childComponent = this.loader.resolveComponentFactory(ArticleFakeComponent);

    }

	@Input()
	url: string;
}