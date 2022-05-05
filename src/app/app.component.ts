import { Component } from '@angular/core';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
})
export class AppComponent {
  name = 'Automaton App';
  index: number = 0;
  routes = [
    { path: '/view-problems', label: 'Attempt Problems' },
    { path: '/create-problem', label: 'Create Problem' },
  ];
}
