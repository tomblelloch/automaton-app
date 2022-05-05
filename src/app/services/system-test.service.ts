import { Injectable } from '@angular/core';
import { Automaton } from '../models/automaton';
import { State } from '../models/state';
import { Transition } from '../models/transition';
import { CheckEquivalenceService } from './check-equivalence.service';
import { SharedService } from './shared.service';

@Injectable()
export class SystemTestService {
  private automata: Automaton[];

  constructor(
    private sharedService: SharedService,
    private checkEquivalenceService: CheckEquivalenceService
  ) {
    let s1: State = new State('s1');
    let s2: State = new State('s2');
    let s3: State = new State('s3');

    this.automata = [
      new Automaton(
        [s1, s2],
        [s2],
        s1,
        ['a'],
        [new Transition('a', s1, s2), new Transition('a', s2, s1)],
        1,
        'Valid DFA'
      ),
      new Automaton(
        [s1, s2],
        [s2],
        s1,
        ['a'],
        [new Transition('a', s1, s2)],
        2,
        'Valid NFA'
      ),
      new Automaton(
        [],
        [s2],
        s1,
        ['a'],
        [new Transition('a', s1, s2), new Transition('a', s2, s1)],
        3,
        'No states'
      ),
      new Automaton(
        [s1, s2],
        [s2],
        s1,
        [],
        [new Transition('a', s1, s2), new Transition('a', s2, s1)],
        4,
        'No input symbols'
      ),
      new Automaton(
        [s1, s2],
        [s2],
        s1,
        [''],
        [new Transition('', s1, s2), new Transition('', s2, s1)],
        5,
        'Empty symbol'
      ),
      new Automaton(
        [s1, s2],
        [s2],
        s1,
        ['ab'],
        [new Transition('ab', s1, s2), new Transition('ab', s2, s1)],
        6,
        'Happy path: symbol of length > 1'
      ),
      new Automaton(
        [s1, s2],
        [s2],
        undefined,
        ['a'],
        [new Transition('a', s1, s2), new Transition('a', s2, s1)],
        7,
        'No initial state'
      ),
      new Automaton(
        [s1, s2],
        [s3],
        s3,
        ['a'],
        [new Transition('a', s1, s2), new Transition('a', s2, s1)],
        8,
        'Initial state and accepting state not present in states'
      ),
      new Automaton(
        [s1, s2],
        [],
        s1,
        ['a'],
        [new Transition('a', s1, s2), new Transition('a', s2, s1)],
        9,
        'Happy path: no accepting states'
      ),
      new Automaton(
        [s1, s2],
        [s2],
        s1,
        ['a'],
        [new Transition('a', s1, s3), new Transition('a', s2, s1)],
        10,
        'Transition using state not present in states'
      ),
      new Automaton(
        [s1, s2],
        [s2],
        s1,
        ['a'],
        [
          new Transition('a', s1, s2),
          new Transition('a', s2, s1),
          new Transition('b', s2, s1),
        ],
        11,
        'Transition using symbol not present in symbols'
      ),
      new Automaton(
        [s1, s2],
        [s2],
        s1,
        ['a'],
        [new Transition('a', s1, s1), new Transition('a', s2, s1)],
        12,
        'Unreachable state'
      ),
    ];
  }

  public runAutomatonObjectTests(): void {
    console.log('RUNNING TESTS');
    this.runValidDfaTests();
    this.runGenerateWordsTests();
    this.runCheckEquivalenceTests();
    console.log('TESTS COMPLETE');
  }

  private runValidDfaTests(): void {
    console.log('Running tests: Valid DFA');
    for (const a of this.automata) {
      console.log(`Validity of automaton with id ${a.id}: `, a.isValidDfa());
    }
  }

  private runGenerateWordsTests(): void {
    console.log('Running tests: Generate Words');
    console.log(
      'testing word generation for automaton',
      this.automata[0],
      this.automata[0].generateWords(0, 4)
    );
    console.log(
      'testing word generation for automaton',
      this.automata[5],
      this.automata[5].generateWords(0, 4)
    );
    console.log(
      'testing word generation for automaton',
      this.automata[8],
      this.automata[8].generateWords(0, 4)
    );
    console.log(
      'testing word generation for automaton',
      this.automata[0],
      this.automata[0].generateWords(2, 6)
    );
    console.log(
      'testing word generation for automaton',
      this.automata[0],
      this.automata[0].generateWords(-1, 4)
    );
    console.log(
      'testing word generation for automaton',
      this.automata[0],
      this.automata[0].generateWords(4, 2)
    );
  }

  private runCheckEquivalenceTests(): void {
    console.log('Running tests: Check Equivalence');
    console.log(
      'checking equivalence of 1&1:',
      this.checkEquivalenceService.checkEquivalence(
        this.sharedService.testAutomaton1,
        this.sharedService.testAutomaton1
      )
    );
    console.log(
      'checking equivalence of 1&2:',
      this.checkEquivalenceService.checkEquivalence(
        this.sharedService.testAutomaton1,
        this.sharedService.testAutomaton2
      )
    );
    console.log(
      'checking equivalence of 1&3:',
      this.checkEquivalenceService.checkEquivalence(
        this.sharedService.testAutomaton1,
        this.sharedService.testAutomaton3
      )
    );
  }
}
