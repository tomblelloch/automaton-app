import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SymbolTransitions } from '../../models/transition';
import { Automaton } from '../../models/automaton';
import { Problem } from '../../models/problem';
import { CheckEquivalenceService } from '../../services/check-equivalence.service';
import { SharedService } from '../../services/shared.service';
import { SystemTestService } from '../../services/system-test.service';

export interface AutomatonAndDatasource {
  automaton: Automaton;
  datasource: SymbolTransitions[];
}

export interface ProblemAndDatasource {
  problem: Problem;
  datasource: SymbolTransitions[];
}

@Component({
  selector: 'app-view-problems',
  templateUrl: './view-problems.component.html',
})
export class ViewProblemsComponent {
  problems: ProblemAndDatasource[] = [];

  constructor(
    private router: Router,
    private sharedService: SharedService,
    private checkEquivalenceService: CheckEquivalenceService,
    private systemTestService: SystemTestService
  ) {
    this.systemTestService.runAutomatonObjectTests();

    for (const p of this.sharedService.problems) {
      this.problems.push({
        problem: p,
        datasource: p.solution.convertToDatasource(),
      });
    }
  }

  attemptProblem(problem: Problem): void {
    this.router.navigate(['/attempt-problem', problem.id]);
  }
}
