import { Component } from '@angular/core';

export class Tab {
  name: string;
  path: string;// not necessary with component type
  selected: boolean;
  component: any;
  // content: string;
}
