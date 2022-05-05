export class State {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  public setName(name: string): void {
    this.name = name;
  }
}
