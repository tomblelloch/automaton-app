import { Injectable } from '@angular/core';
import { Automaton } from '../models/automaton';
import { Problem, WordGenerationType } from '../models/problem';
import { State } from '../models/state';
import { Transition } from '../models/transition';

@Injectable({ providedIn: 'root' })
export class SharedService {
  q1: State = new State('q1');
  q2: State = new State('q2');
  q3: State = new State('q3');
  q4: State = new State('q4');

  states = [this.q1, this.q2, this.q3, this.q4];
  acceptingStates = [this.q3];
  initialState = this.q1;
  inputSymbols = ['a', 'b'];

  transitions: Transition[] = [
    new Transition('a', this.q1, this.q2),
    new Transition('b', this.q1, this.q4),
    new Transition('a', this.q2, this.q3),
    new Transition('b', this.q2, this.q3),
    new Transition('a', this.q3, this.q3),
    new Transition('b', this.q3, this.q3),
    new Transition('a', this.q4, this.q4),
    new Transition('b', this.q4, this.q4),
  ];

  public testAutomaton1 = new Automaton(
    this.states,
    this.acceptingStates,
    this.initialState,
    this.inputSymbols,
    this.transitions,
    1,
    'Test Automaton 1'
  );

  q5: State = new State('q5');
  q6: State = new State('q6');
  q7: State = new State('q7');
  q8: State = new State('q8');
  q9: State = new State('q9');

  testAutomaton2 = new Automaton(
    [this.q5, this.q6, this.q7, this.q8, this.q9],
    [this.q8, this.q9],
    this.q5,
    this.inputSymbols,
    [
      new Transition('a', this.q5, this.q6),
      new Transition('b', this.q5, this.q7),
      new Transition('a', this.q6, this.q8),
      new Transition('b', this.q6, this.q9),
      new Transition('a', this.q7, this.q7),
      new Transition('b', this.q7, this.q7),
      new Transition('a', this.q8, this.q8),
      new Transition('b', this.q8, this.q9),
      new Transition('a', this.q9, this.q8),
      new Transition('b', this.q9, this.q9),
    ],
    2,
    'Test Automaton 2'
  );

  q10: State = new State('q10');
  q11: State = new State('q11');
  q12: State = new State('q12');
  q13: State = new State('q13');
  q14: State = new State('q14');

  testAutomaton3 = new Automaton(
    [this.q10, this.q11],
    [this.q10],
    this.q10,
    ['a', 'b'],
    [
      new Transition('a', this.q10, this.q11),
      new Transition('a', this.q11, this.q10),
      new Transition('b', this.q10, this.q11),
      new Transition('b', this.q11, this.q10),
    ],
    3,
    'Test Automaton 3'
  );

  testAutomaton4 = new Automaton(
    [this.q12, this.q13, this.q14],
    [this.q12, this.q14],
    this.q12,
    ['a', 'b'],
    [
      new Transition('a', this.q12, this.q13),
      new Transition('a', this.q13, this.q14),
      new Transition('a', this.q14, this.q13),
      new Transition('b', this.q12, this.q13),
      new Transition('b', this.q13, this.q14),
      new Transition('b', this.q14, this.q13),
    ],
    4,
    'Test Automaton 4'
  );

  problem1 = new Problem(
    1,
    'Level 1: Words without both a & b',
    "Create an automaton using the alphabet Σ = {a, b} that accepts all words that do not contain both 'a' and 'b'.",
    this.getLevel1Solution(),
    { type: WordGenerationType.Automatic },
    { type: WordGenerationType.Automatic }
  );

  problem2 = new Problem(
    2,
    'Level 2: Even length beginning b',
    "Create an automaton using the alphabet Σ = {a, b} that accepts words beginning with 'b' that are of even length.",
    this.getLevel2Solution(),
    { type: WordGenerationType.Automatic },
    { type: WordGenerationType.Automatic }
  );

  public testAutomata: Automaton[] = [
    this.testAutomaton1,
    this.testAutomaton2,
    this.testAutomaton3,
    this.testAutomaton4,
  ];
  public userDefinedAutomata: Automaton[] = [];
  public problems: Problem[] = [this.problem1, this.problem2];
  public highestIdInUse: number = 6;

  public getLevel1Solution(): Automaton {
    const q1: State = new State('q1');
    const q2: State = new State('q2');
    const q3: State = new State('q3');
    const q4: State = new State('q4');

    return new Automaton(
      [q1, q2, q3, q4],
      [q1, q2, q3],
      q1,
      ['a', 'b'],
      [
        new Transition('a', q1, q2),
        new Transition('b', q1, q3),
        new Transition('a', q2, q2),
        new Transition('b', q2, q4),
        new Transition('a', q3, q4),
        new Transition('b', q3, q3),
        new Transition('a', q4, q4),
        new Transition('b', q4, q4),
      ],
      5,
      'Solution 1'
    );
  }

  public getLevel2Solution(): Automaton {
    const q1: State = new State('q1');
    const q2: State = new State('q2');
    const q3: State = new State('q3');
    const q4: State = new State('q4');

    return new Automaton(
      [q1, q2, q3, q4],
      [q4],
      q1,
      ['a', 'b'],
      [
        new Transition('a', q1, q2),
        new Transition('b', q1, q3),
        new Transition('a', q2, q2),
        new Transition('b', q2, q2),
        new Transition('a', q3, q4),
        new Transition('b', q3, q4),
        new Transition('a', q4, q3),
        new Transition('b', q4, q3),
      ],
      6,
      'Solution 2'
    );
  }
}
