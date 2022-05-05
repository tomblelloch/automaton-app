import { Injectable } from '@angular/core';

import { State } from '../models/state';
import { Transition } from '../models/transition';
import { Automaton } from './../models/automaton';
import { SharedService } from './shared.service';

export interface EquivalenceResult {
  equivalent: boolean;
  incorrectlyAccepted?: string[];
  incorrectlyRejected?: string[];
}

@Injectable()
export class CheckEquivalenceService {
  sharedService: SharedService;

  constructor(sharedService: SharedService) {
    this.sharedService = sharedService;
  }

  // We assume automaton A is the correct solution and B is the user's attempt
  public checkEquivalence(
    A: Automaton,
    B: Automaton,
    getIncorrectWords: boolean = false
  ): EquivalenceResult {
    if (!A.isValidDfa() || !B.isValidDfa()) {
      return { equivalent: false };
    }

    if (!this.arraysMatch(A.inputSymbols, B.inputSymbols)) {
      return { equivalent: false };
    }

    // Construct inverse automata A' and B'
    const complementA: Automaton = this.invertAutomaton(A);
    const complementB: Automaton = this.invertAutomaton(B);

    // Construct automata C = A' ∩ B and D = A ∩ B'
    const C: Automaton = this.intersectAutomata(complementA, B);
    const D: Automaton = this.intersectAutomata(A, complementB);

    // Check emptiness of C and D
    const CEmpty: boolean = C.isEmpty();
    const DEmpty: boolean = D.isEmpty();

    if (CEmpty && DEmpty) {
      // Automata are equivalent
      return { equivalent: true };
    }

    // Automata are not equivalent

    if (!getIncorrectWords) {
      return { equivalent: false };
    }

    // Determine incorrectly accepted and/or rejected words
    let incorrectlyAccepted: string[] = [];
    let incorrectlyRejected: string[] = [];

    // Words accepted by C are incorrecty accepted by B.
    if (!CEmpty) {
      incorrectlyAccepted = C.generateAcceptedWords();
    }

    // Words accepted by D are incorrectly rejected by B.
    if (!DEmpty) {
      incorrectlyRejected = D.generateAcceptedWords();
    }

    return {
      equivalent: false,
      incorrectlyAccepted: incorrectlyAccepted,
      incorrectlyRejected: incorrectlyRejected,
    };
  }

  public diffArrays(arr1: string[], arr2: string[]) {
    return arr1.filter((x) => arr2.indexOf(x) < 0);
  }

  public arraysMatch(arr1: string[], arr2: string[]): boolean {
    if (arr1.length !== arr2.length) {
      return false;
    }

    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) {
        return false;
      }
    }

    return true;
  }

  public intersectAutomata(A: Automaton, B: Automaton): Automaton {

    if (!this.arraysMatch(A.inputSymbols, B.inputSymbols)) {
      return;
    }

    const inputSymbols = A.inputSymbols;
    const statesProduct: any[] = this.cartesianProduct([A.states, B.states]);

    let acceptingStates: State[] = [];
    let transitions: Transition[] = [];
    // Iterate over states
    for (let i = 0; i < statesProduct.length; i++) {
      // Check if the state is an accepting state
      if (
        A.acceptingStates.find((x) => x == statesProduct[i][0]) &&
        B.acceptingStates.find((x) => x == statesProduct[i][1])
      ) {
        acceptingStates.push(statesProduct[i]);
      }

      // Iterate over input symbols
      for (let j = 0; j < inputSymbols.length; j++) {
        // Find the corresponding transition
        let nextStateA = A.transitions.find(
          (x) =>
            x.initialState === statesProduct[i][0] &&
            x.inputSymbol === inputSymbols[j]
        ).nextState;

        let nextStateB = B.transitions.find(
          (x) =>
            x.initialState === statesProduct[i][1] &&
            x.inputSymbol === inputSymbols[j]
        ).nextState;

        const nextState: State = statesProduct.find(
          (x) => x[0] == nextStateA && x[1] == nextStateB
        );

        transitions.push(
          new Transition(inputSymbols[j], statesProduct[i], nextState)
        );
      }
    }

    this.sharedService.highestIdInUse++;

    return new Automaton(
      statesProduct,
      acceptingStates,
      statesProduct.find(
        (x) => x[0] == A.initialState && x[1] == B.initialState
      ),
      inputSymbols,
      transitions,
      this.sharedService.highestIdInUse,
      `'${A.name}' ∩ '${B.name}'`
    );
  }

  public cartesianProduct(arr) {
    return arr.reduce(
      function (a, b) {
        return a
          .map(function (x) {
            return b.map(function (y) {
              return x.concat([y]);
            });
          })
          .reduce(function (a, b) {
            return a.concat(b);
          }, []);
      },
      [[]]
    );
  }

  public invertAutomaton(automaton: Automaton) {
    let invertedAcceptingStates = automaton.states.filter(
      (state) => automaton.acceptingStates.indexOf(state) < 0
    );
    this.sharedService.highestIdInUse++;
    return new Automaton(
      automaton.states,
      invertedAcceptingStates,
      automaton.initialState,
      automaton.inputSymbols,
      automaton.transitions,
      this.sharedService.highestIdInUse,
      `Inverted '${automaton.name}'`
    );
  }
}
