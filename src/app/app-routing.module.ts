import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CreateEditAutomatonProblemComponent } from './components/create-edit-automaton-problem/create-edit-automaton-problem.component';
import { ViewProblemsComponent } from './components/view-problems/view-problems.component';

const routes: Routes = [
  { path: 'view-problems', component: ViewProblemsComponent },
  { path: 'create-problem', component: CreateEditAutomatonProblemComponent },
  {
    path: 'attempt-problem/:id',
    component: CreateEditAutomatonProblemComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
