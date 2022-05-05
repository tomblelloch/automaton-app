import { State } from './state';
import { SymbolTransitions, Transition } from './transition';

export interface WordReport {
  acceptedWords: string[];
  rejectedWords: string[];
}

export interface Word {
  symbols: string;
  state: State;
}

export interface AutomatonValidity {
  validAutomaton: Boolean;
  validDFA: Boolean;
  validityReasons: string[];
}

export class Automaton {
  public id: number;
  public name: string;
  public states: State[];
  public acceptingStates: State[];
  public initialState: State;
  public inputSymbols: string[];
  public transitions: Transition[];

  constructor(
    states: State[],
    acceptingStates: State[],
    initialState: State,
    inputSymbols: string[],
    transitions: Transition[],
    id?: number,
    name?: string
  ) {
    this.states = states;
    this.acceptingStates = acceptingStates;
    this.initialState = initialState;
    this.inputSymbols = inputSymbols;
    this.transitions = transitions;
    if (id) {
      this.id = id;
    }
    if (name) {
      this.name = name;
    }
  }

  public isAcceptingState(state: State): boolean {
    return this.acceptingStates.indexOf(state) >= 0;
  }

  public isValidDfa(): AutomatonValidity {
    // Check the automaton is valid (i.e. an NFA).
    const automatonVality: AutomatonValidity = this.isValidAutomaton();
    if (!automatonVality.validAutomaton) {
      return automatonVality;
    }

    // There must be exactly one transition from each state for each input symbol.
    for (const state of this.states) {
      for (const symbol of this.inputSymbols) {
        const transitions = this.transitions.filter(
          (t) => t.initialState == state && t.inputSymbol == symbol
        );
        if (transitions.length !== 1) {
          return {
            validAutomaton: true,
            validDFA: false,
            validityReasons: [
              `Invalid transitions for DFA. There are ${
                transitions.length === 0 ? 'no' : transitions.length
              } transitions from state '${
                state.name
              }' on input symbol '${symbol}'.`,
            ],
          };
        }
      }
    }

    return { validAutomaton: true, validDFA: true, validityReasons: [] }; // Valid DFA
  }

  public isValidAutomaton(): AutomatonValidity {
    let invalidReasons: string[] = [];

    if (this.states.length === 0) {
      invalidReasons.push('There must be at least one state.');
    }
    if (this.inputSymbols.length === 0) {
      invalidReasons.push('There must be at least one input symbol.');
    }
    if (!this.inputSymbols.every((x) => x.length > 0)) {
      invalidReasons.push('All input symbols must have length at least one.');
    }
    if (this.states.indexOf(this.initialState) < 0) {
      invalidReasons.push(
        `Invalid initial state: one of the automaton's states must be the initial state.`
      );
    }
    if (
      !this.acceptingStates.every(
        (acceptState) => this.states.indexOf(acceptState) >= 0
      )
    ) {
      invalidReasons.push(
        `Invalid accepting state: all accepting states must be present in the automaton's states.`
      );
    }

    if (invalidReasons.length > 0) {
      return {
        validAutomaton: false,
        validDFA: false,
        validityReasons: ['Invalid states or symbols.', ...invalidReasons],
      };
    }

    // All transitions must use valid symbols and states.
    for (const transition of this.transitions) {
      if (
        this.inputSymbols.indexOf(transition.inputSymbol) < 0 ||
        this.states.indexOf(transition.initialState) < 0 ||
        this.states.indexOf(transition.nextState) < 0
      ) {
        return {
          validAutomaton: false,
          validDFA: false,
          validityReasons: [
            'Invalid transitions. All transitions must use valid symbols and states.',
          ],
        };
      }
    }

    // All states must be reachable.
    let reachableStates = this.getReachableStates();
    if (reachableStates.length !== this.states.length) {
      const unreachableStateNames = this.states
        .map((state) => state.name)
        .filter((x) => reachableStates.map((s) => s.name).indexOf(x) < 0);

      return {
        validAutomaton: false,
        validDFA: false,
        validityReasons: [
          `Not all states reachable. Found that ${reachableStates.length} of ${
            this.states.length
          } states are reachable. Unreachable states: ${unreachableStateNames.join(
            ', '
          )}.`,
        ],
      };
    }

    return { validAutomaton: true, validDFA: undefined, validityReasons: [] }; // Valid NFA
  }

  // Generates all words in the automaton's language up to maxLength, determining for each whether it is accepted or rejected. Lists of all acceptedWords and rejectedWords between minLength and maxLength (inclusive) are returned.
  public generateWords(minLength: number = 0, maxLength: number): WordReport {
    if (minLength < 0 || maxLength < 0 || maxLength < minLength) {
      return;
    }

    let acceptedWords: string[] = [];
    let rejectedWords: string[] = [];

    let currentWords: Word[] = [{ symbols: '', state: this.initialState }];
    let newWords: Word[] = [];

    // Classify the empty word (if applicable)
    if (minLength === 0) {
      if (this.isAcceptingState(this.initialState)) {
        acceptedWords.push('');
      } else {
        rejectedWords.push('');
      }
    }

    for (let currentLength = 1; currentLength <= maxLength; currentLength++) {
      for (const word of currentWords) {
        // Get all transitions from the word's current state.
        const stateTransitions: Transition[] = this.transitions.filter(
          (t) => t.initialState == word.state
        );

        // For each transition, create a new word by appending the transition's inputSymbol to the current word's symbols.
        for (const transition of stateTransitions) {
          newWords.push({
            symbols: word.symbols + transition.inputSymbol,
            state: transition.nextState,
          });
        }
      }

      // Classify the new words as accepted or rejected.
      if (currentLength >= minLength) {
        for (const word of newWords) {
          if (this.isAcceptingState(word.state)) {
            acceptedWords.push(word.symbols);
          } else {
            rejectedWords.push(word.symbols);
          }
        }
      }

      currentWords = newWords;
      newWords = [];
    }

    const generatedWordCount = acceptedWords.length + rejectedWords.length;
    let expectedCount = 0;
    for (let length = minLength; length <= maxLength; length++) {
      expectedCount += this.inputSymbols.length ** length;
    }
    if (generatedWordCount !== expectedCount) {
      console.log(
        'generatedWordCount',
        generatedWordCount,
        'is not equal to expectedCount',
        expectedCount
      );
    }

    return {
      acceptedWords,
      rejectedWords,
    };
  }

  // Returns whether the automaton accepts the given word.
  public classifyWord(word: string): Boolean | string {
    let currentState = this.initialState;
    for (let i = 0; i < word.length; i++) {
      const transitions: Transition[] = this.transitions.filter(
        (t) => t.initialState == currentState && t.inputSymbol === word[i]
      );
      if (transitions.length !== 1) {
        return this.inputSymbols.indexOf(word[i]) < 0
          ? `Error: invalid symbol. The input symbol '${word[i]}' is not one of the automaton's valid input symbols.`
          : `Error: invalid transitions. The automaton contains ${transitions.length} transitions for input symbol '${word[i]}' from state ${currentState.name}.`;
      }

      currentState = transitions[0].nextState;
    }

    return this.isAcceptingState(currentState);
  }

  public isEmpty(): boolean {
    if (this.acceptingStates.indexOf(this.initialState) >= 0) {
      return false;
    }

    let statesReached: State[] = [this.initialState];
    let statesFound: boolean = true;

    // Iterate over states in the same way as getReachableStates()
    while (statesFound && statesReached.length < this.states.length) {
      let nextStates = this.transitions
        .filter(
          (t) =>
            statesReached.indexOf(t.initialState) >= 0 &&
            statesReached.indexOf(t.nextState) < 0
        )
        .map((t) => t.nextState);

      statesFound = nextStates.length > 0;
      if (statesFound) {
        // Check if any states found are accepting
        for (const state of nextStates) {
          if (this.isAcceptingState(state)) {
            return false;
          }
        }

        statesReached = [...new Set([...statesReached, ...nextStates])];
      }
    }

    return true;
  }

  // Returns the list of states that are reachable by transitions from the initial state.
  public getReachableStates(): State[] {
    let statesReached: State[] = [this.initialState];
    let statesFound: boolean = true;

    while (statesFound && statesReached.length < this.states.length) {
      // Find all states that are reachable from a state in statesReached by a single transition that are not already present in statesReached.
      let nextStates = this.transitions
        .filter(
          (t) =>
            statesReached.indexOf(t.initialState) >= 0 &&
            statesReached.indexOf(t.nextState) < 0
        )
        .map((t) => t.nextState);

      // If any such states were found, add them to statesReached and perform another iteration.
      statesFound = nextStates.length > 0;
      if (statesFound) {
        // Convert nextStates to a set in order to remove duplicate elements
        statesReached.push(...new Set(nextStates));
      }
    }

    return statesReached;
  }

  // Returns an equivalent automaton without unreachable states.
  public withoutUnreachableStates(): Automaton {
    const reachableStates = this.getReachableStates();
    if (reachableStates.length === this.states.length) {
      // All states are reachable, so no changes needed.
      return this;
    }

    return new Automaton(
      reachableStates,
      this.acceptingStates.filter((x) => reachableStates.indexOf(x) >= 0),
      this.initialState,
      this.inputSymbols,
      this.transitions.filter(
        (t) => reachableStates.indexOf(t.initialState) >= 0
      )
    );
  }

  convertToDatasource(): SymbolTransitions[] {
    let datasource: SymbolTransitions[] = [];
    for (const symbol of this.inputSymbols) {
      datasource.push({
        inputSymbol: symbol,
        transitions: this.transitions
          .filter((t) => t.inputSymbol == symbol)
          .map((t) => {
            return { initialState: t.initialState, nextState: t.nextState };
          }),
      });
    }
    return datasource;
  }

  generateAcceptedWords(): string[] {
    let words: string[] = [];

    let minLength: number = 0;
    let maxLength: number = 4;
    while (words.length === 0) {
      words = this.generateWords(minLength, maxLength).acceptedWords;
      minLength = maxLength;
      maxLength++;
    }

    return words;
  }
}
