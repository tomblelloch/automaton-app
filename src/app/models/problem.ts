import { Automaton } from './automaton';

export enum WordGenerationType {
  Disabled = 0, // No example words shown.
  Manual = 1, // Example words are specified by the teacher on problem creation, then the same words are shown each time. For this type, manuallySpecified is required.
  Automatic = 2, // Example words are randomly generated. If autoMinLength is not provided, assume 0. If autoMaxLength is not provided, assume no limit.
}

export interface WordGenerationOptions {
  type: WordGenerationType;
  manuallySpecified?: string[];
  autoMinLength?: number;
  autoMaxLength?: number;
}

export class Problem {
  id: number;
  title: string;
  description: string;
  solution: Automaton;
  acceptedOptions: WordGenerationOptions;
  rejectedOptions: WordGenerationOptions;

  constructor(
    id: number,
    title: string,
    description: string,
    solution: Automaton,
    acceptedOptions: WordGenerationOptions,
    rejectedOptions: WordGenerationOptions
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.solution = solution;
    this.acceptedOptions = acceptedOptions;
    this.rejectedOptions = rejectedOptions;
  }
}
