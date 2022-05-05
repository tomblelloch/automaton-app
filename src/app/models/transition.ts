import { State } from './state';

export interface SymbolTransitions {
  inputSymbol: string;
  transitions: SubTransition[];
}

export interface SubTransition {
  initialState: State;
  nextState: State;
}

export class Transition {
  inputSymbol: string;
  initialState: State;
  nextState: State;

  constructor(inputSymbol: string, initialState: State, nextState: State) {
    this.inputSymbol = inputSymbol;
    this.initialState = initialState;
    this.nextState = nextState;
  }
}
