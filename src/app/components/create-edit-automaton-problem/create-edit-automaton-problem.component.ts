import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';

import { stylesheetObject } from '../../stylesheetObject';
import { InputSymbolModalComponent } from '../input-symbol-modal/input-symbol-modal.component';
import { State } from '../../models/state';
import { Transition } from '../../models/transition';
import { Problem, WordGenerationType } from '../../models/problem';
import { Automaton, AutomatonValidity } from '../../models/automaton';
import { SharedService } from '../../services/shared.service';

import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import edgehandles from 'cytoscape-edgehandles';
import { CheckEquivalenceService } from '../../services/check-equivalence.service';

cytoscape.use(dagre);
cytoscape.use(edgehandles);

export interface Arrow {
  initialState: string;
  targetState: string;
  inputSymbols: string[];
}

@Component({
  selector: 'app-create-edit-automaton-problem',
  templateUrl: './create-edit-automaton-problem.component.html',
})
export class CreateEditAutomatonProblemComponent implements AfterViewInit {
  @ViewChild('cy') el: ElementRef;
  cy = new cytoscape();
  eh;

  automatonValidity: AutomatonValidity;
  automatonToEdit: Automaton = undefined; // Set (to the unedited Automaton) if editing, else undefined.
  problemToAttempt: Problem = undefined; // Set to the problem if attempting, else undefined.
  problemAcceptExamples: string = undefined;
  problemRejectExamples: string = undefined;
  problemAttemptFeedback: string = undefined; // Set when user first checks their solution, else undefined.
  creatingProblem: Boolean = false; // true if creating a problem, false otherwise.
  inputSymbols: string[] = ['a', 'b'];
  problemNameValue = '';
  problemDescriptionValue = '';
  drawModeChecked: boolean = false;
  enableExampleWords: boolean = false;

  inputSymbolsForm = new FormControl();
  minimumLengthValue: number = 0;
  maximumLengthValue: number = 4;
  acceptedWords: string[] = undefined;
  rejectedWords: string[] = undefined;
  wordToCheck: string = '';
  wordAccepted: Boolean | string = undefined;

  constructor(
    private checkEquivalenceService: CheckEquivalenceService,
    private sharedService: SharedService,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router
  ) {
    const url = this.router.url;
    const id = parseInt(this.route.snapshot.paramMap.get('id')!);

    const allAutomata: Automaton[] = [
      ...this.sharedService.testAutomata,
      ...this.sharedService.userDefinedAutomata,
    ];

    if (url.startsWith('/edit') && id) {
      this.automatonToEdit = allAutomata.find(
        (automaton) => automaton.id === id
      );

      this.inputSymbols = this.automatonToEdit.inputSymbols;
    } else if (url.startsWith('/create-problem')) {
      this.creatingProblem = true;
      this.inputSymbols = ['a'];
    } else if (url.startsWith('/attempt-problem') && id) {
      this.problemToAttempt = this.sharedService.problems.find(
        (problem) => problem.id === id
      );
      if (this.problemToAttempt) {
        this.inputSymbols = this.problemToAttempt.solution.inputSymbols;

        // Show example accepted and/or rejected words if the WordGenerationType is set to automatic and there is at least one accepting/non-accepting state (as applies).
        const showAcceptWords =
          this.problemToAttempt.acceptedOptions.type ===
            WordGenerationType.Automatic &&
          this.problemToAttempt.solution.acceptingStates.length > 0;
        const showRejectWords =
          this.problemToAttempt.rejectedOptions.type ===
            WordGenerationType.Automatic &&
          this.problemToAttempt.solution.acceptingStates.length <
            this.problemToAttempt.solution.states.length;

        let acceptWords: string[] = [];
        let rejectWords: string[] = [];

        if (showAcceptWords && showRejectWords) {
          let maxWordLength: number = 4;
          while (acceptWords.length === 0 || rejectWords.length === 0) {
            const words = this.problemToAttempt.solution.generateWords(
              0,
              maxWordLength
            );
            if (acceptWords.length === 0) {
              acceptWords = words.acceptedWords;
            }
            if (rejectWords.length === 0) {
              rejectWords = words.rejectedWords;
            }
            maxWordLength++;
          }
        } else if (showAcceptWords) {
          let maxWordLength: number = 4;
          while (acceptWords.length === 0) {
            acceptWords = this.problemToAttempt.solution.generateWords(
              0,
              maxWordLength
            ).acceptedWords;
            maxWordLength++;
          }
        } else if (showRejectWords) {
          let maxWordLength: number = 4;
          while (rejectWords.length === 0) {
            rejectWords = this.problemToAttempt.solution.generateWords(
              0,
              maxWordLength
            ).rejectedWords;
            maxWordLength++;
          }
        }

        let acceptWordsToShow: string[] = [];
        let usedIndexes: number[] = [];
        if (acceptWords.length <= 3) {
          acceptWordsToShow = acceptWords;
        } else {
          while (
            acceptWordsToShow.length < 3 &&
            acceptWords.length - usedIndexes.length > 0
          ) {
            let randIndex = Math.floor(Math.random() * acceptWords.length);
            if (usedIndexes.findIndex((x) => x === randIndex) < 0) {
              acceptWordsToShow.push(acceptWords[randIndex]);
              usedIndexes.push(randIndex);
            }
          }
        }

        let rejectWordsToShow: string[] = [];
        usedIndexes = [];
        if (rejectWords.length <= 3) {
          rejectWordsToShow = rejectWords;
        } else {
          while (
            rejectWordsToShow.length < 3 &&
            rejectWords.length - usedIndexes.length > 0
          ) {
            let randIndex = Math.floor(Math.random() * rejectWords.length);
            if (usedIndexes.findIndex((x) => x === randIndex) < 0) {
              rejectWordsToShow.push(rejectWords[randIndex]);
              usedIndexes.push(randIndex);
            }
          }
        }

        if (acceptWordsToShow.length > 0) {
          this.problemAcceptExamples =
            "'" + acceptWordsToShow.sort().join(`', '`) + "'";
        }
        if (rejectWordsToShow.length > 0) {
          this.problemRejectExamples =
            "'" + rejectWordsToShow.sort().join(`', '`) + "'";
        }
      }
    }
  }

  ngAfterViewInit(): void {
    this.cy = cytoscape({
      container: document.getElementById('cy'),
      elements: {
        nodes: this.automatonToEdit
          ? this.getCyNodesFromAutomaton()
          : this.problemToAttempt || this.creatingProblem
          ? [
              {
                data: {
                  id: 'q0',
                  label: 'q0',
                  group: 'nodes',
                  type: 'initial',
                  initialState: true,
                  acceptingState: false,
                },
              },
            ]
          : [
              {
                data: {
                  id: 'q0',
                  label: 'q0',
                  group: 'nodes',
                  type: 'initial',
                  initialState: true,
                  acceptingState: false,
                },
              },
              {
                data: {
                  id: 'q1',
                  label: 'q1',
                  group: 'nodes',
                  type: 'accepting',
                  initialState: false,
                  acceptingState: true,
                },
              },
              {
                data: {
                  id: 'q2',
                  label: 'q2',
                  group: 'nodes',
                  type: 'standard',
                  initialState: false,
                  acceptingState: false,
                },
              },
            ],
        edges: this.automatonToEdit
          ? this.getCyEdgesFromAutomaton()
          : this.problemToAttempt || this.creatingProblem
          ? []
          : [
              {
                data: {
                  source: 'q0',
                  target: 'q1',
                  group: 'edges',
                  label: 'a',
                  symbols: ['a'],
                },
              },
              {
                data: {
                  source: 'q2',
                  target: 'q2',
                  group: 'edges',
                  label: 'a',
                  symbols: ['a'],
                },
              },
            ],
      },
      layout: {
        name: 'dagre',
        rankDir: 'LR',
        nodeSep: 90,
        edgeSep: 160,
        rankSep: 300,
        padding: 10,
        animate: true, // whether to transition the node positions
      },
      style: stylesheetObject,
      userZoomingEnabled: false,
      userPanningEnabled: false,
    });

    this.resize();
    this.updateAutomatonValidity();

    // the default values of each option are outlined below:
    let defaults = {
      canConnect: function (sourceNode, targetNode) {
        // Allow connections if there is no existing edge from sourceNode to targetNode.
        const sourceData = sourceNode.map((n) => n.data())[0];
        const targetData = targetNode.map((n) => n.data())[0];

        if (typeof targetData === undefined) {
          return false;
        }
        const matchingEdges = this.cy
          .edges()
          .map((edge) => edge.data())
          .filter(
            (edge) =>
              edge.source == sourceData.label && edge.target == targetData.label
          );
        return matchingEdges.length === 0;
      },
      edgeParams: function (_sourceNode, _targetNode) {
        return { data: { group: 'edges' } };
      },
      hoverDelay: 150,
      snap: true,
      snapThreshold: 50,
      snapFrequency: 15,
      noEdgeEventsInDraw: true,
      disableBrowserGestures: true,
    };

    this.eh = this.cy.edgehandles(defaults);

    this.cy.on('ehcomplete', (_event, _sourceNode, _targetNode, addedEdge) => {
      const idToRemove = this.cy
        .nodes()
        .map((node) => node.data())
        .find((node) => node.label == undefined).id;
      this.cy.remove('#' + idToRemove);

      if (this.inputSymbols.length === 1) {
        addedEdge.data({
          symbols: [this.inputSymbols[0]],
          label: this.inputSymbols[0],
        });
        this.updateAutomatonValidity();
        return;
      }

      const dialogRef = this.dialog.open(InputSymbolModalComponent, {
        width: '275px',
        data: {
          symbols: this.inputSymbols,
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result === undefined) {
          this.cy.remove('#' + addedEdge.data().id);
          return;
        }

        const checkedSymbols: string[] = result
          .filter((symbol) => symbol.checked)
          .map((symbol) => symbol.name);

        addedEdge.data({
          symbols: checkedSymbols,
          label: checkedSymbols.join(', '),
        });

        this.updateAutomatonValidity();
      });
    });
  }

  public addSymbol(): void {
    this.inputSymbols.push('');
    this.updateAutomatonValidity();
  }

  public editSymbol(
    index: number,
    previousValue: string,
    newValue: string
  ): void {
    if (previousValue == newValue) {
      return;
    }

    const edges = this.cy.edges();
    const edgesData = edges.map((e) => e.data());
    for (let i = 0; i < edges.length; i++) {
      const edgeSymbolIndex: number =
        edgesData[i].symbols.indexOf(previousValue);
      if (edgeSymbolIndex > -1) {
        // Edge contains the symbol
        if (edgesData[i].symbols.length === 1) {
          edges[i].data({
            symbols: [newValue],
            label: newValue,
          });
        } else {
          const newSymbols = edgesData[i].symbols;
          newSymbols[edgeSymbolIndex] = newValue;
          edges[i].data({
            symbols: newSymbols,
            label: newSymbols.join(', '),
          });
        }
      }
    }

    this.inputSymbols[index] = newValue;
    this.updateAutomatonValidity();
  }

  // If a user deletes a symbol while creating a problem, all edges with this input symbol should be deleted (if it's the only symbol) or edited to remove it (if there's at least one other symbol).
  public deleteSymbol(index: number, value: string): void {
    const edges = this.cy.edges();
    for (const edge of edges) {
      const edgeData = edge.map((e) => e.data())[0];
      if (edgeData.symbols.indexOf(value) > -1) {
        if (edgeData.symbols.length === 1) {
          this.cy.remove(edge);
        } else {
          const newSymbols = edgeData.symbols.filter((s) => s != value);
          edge.data({
            symbols: newSymbols,
            label: newSymbols.join(', '),
          });
        }
      }
    }

    this.inputSymbols.splice(index, 1);
    this.updateAutomatonValidity();
  }

  getValidityReasons(): string {
    return this.automatonValidity.validityReasons.join(' ');
  }

  public updateAutomatonValidity(): void {
    const automaton = this.convertToAutomaton();
    this.automatonValidity = automaton.isValidDfa();
  }

  public getCyNodesFromAutomaton(): any[] {
    let nodes = [];
    for (const state of this.automatonToEdit.states) {
      const isInitialState: boolean =
        this.automatonToEdit.initialState.name == state.name;
      const isAcceptingState: State | undefined =
        this.automatonToEdit.acceptingStates.find(
          (s) => s.name == state.name
        ) || undefined;
      nodes.push({
        data: {
          id: state.name,
          label: state.name,
          group: 'nodes',
          type: isInitialState
            ? isAcceptingState
              ? 'initial-accepting'
              : 'initial'
            : isAcceptingState
            ? 'accepting'
            : 'standard',
          initialState: isInitialState,
          acceptingState: isAcceptingState,
        },
      });
    }

    return nodes;
  }

  getCyEdgesFromAutomaton(): any[] {
    let arrows: Arrow[] = [];

    for (const transition of this.automatonToEdit.transitions) {
      const initialStateName = transition.initialState.name;
      const targetStateName = transition.nextState.name;

      let filteredArrows = arrows.filter(
        (arrow) =>
          arrow.initialState == initialStateName &&
          arrow.targetState == targetStateName
      );
      if (filteredArrows.length > 0) {
        for (const arrow of arrows) {
          if (
            arrow.initialState == initialStateName &&
            arrow.targetState == targetStateName
          ) {
            arrow.inputSymbols.push(transition.inputSymbol);
            break;
          }
        }
      } else {
        arrows.push({
          initialState: transition.initialState.name,
          targetState: transition.nextState.name,
          inputSymbols: [transition.inputSymbol],
        });
      }
    }

    let edges = [];
    for (const arrow of arrows) {
      edges.push({
        data: {
          source: arrow.initialState,
          target: arrow.targetState,
          group: 'edges',
          label: arrow.inputSymbols.join(', '),
          symbols: arrow.inputSymbols,
        },
      });
    }

    return edges;
  }

  public inputSymbolsValid(): Boolean {
    // There must be at least one symbol.
    if (this.inputSymbols.length === 0) {
      return false;
    }

    // All symbols must be unique, i.e. there cannot be any duplicate symbols.
    if (new Set(this.inputSymbols).size !== this.inputSymbols.length) {
      return false;
    }

    // All symbols must have length > 0.
    if (this.inputSymbols.find((symbol) => symbol.length === 0) !== undefined) {
      return false;
    }

    return true;
  }

  public getSelectedNodes() {
    const selected = this.cy.$(':selected').map((element) => element.data());

    if (selected.length === 0) {
      return;
    }

    for (const element of selected) {
      if (element.group != 'nodes') {
        return;
      }
    }

    return selected;
  }

  public getSelectedEdges() {
    const selected = this.cy.$(':selected').map((element) => element.data());

    if (selected.length === 0) {
      return;
    }

    for (const element of selected) {
      if (element.group != 'edges') {
        return;
      }
    }

    return selected;
  }

  addNode(): void {
    let stateNames: string[] = this.cy.nodes().map((node) => node.data().id);
    let stateIds: number[] = [];
    let name: string = 'q0';
    for (const name of stateNames) {
      if (!isNaN(+name.substring(1))) {
        stateIds.push(parseInt(name.substring(1)));
      }
    }
    if (stateIds.length > 0) {
      stateIds.sort(function (a, b) {
        return a - b;
      });
      name = 'q' + (stateIds[stateIds.length - 1] + 1);
    }

    this.cy.add({
      data: { id: name, label: name, type: 'parent', group: 'nodes' },
      position: { x: 0, y: 100 },
    });

    this.updateAutomatonValidity();
  }

  deleteSelected(): void {
    const selected = this.cy.$(':selected').map((element) => element.data());

    if (selected.length === 0) {
      return;
    }

    this.cy.remove(':selected');
    this.updateAutomatonValidity();
  }

  public makeInitialState(): void {
    const selected = this.getSelectedNodes();
    if (selected.length !== 1) {
      return;
    }

    const node = this.cy.nodes('#' + selected[0].id);

    if (!node.map((node) => node.data()).initialState) {
      for (const n of this.cy.nodes()) {
        const accepting = n.data('acceptingState');
        n.data({
          initialState: false,
          type: accepting ? 'accepting' : 'standard',
        });
      }
      const accepting = node.data('acceptingState');
      node.data({
        initialState: true,
        type: accepting ? 'initial-accepting' : 'initial',
      });
    }

    this.updateAutomatonValidity();
  }

  public toggleAcceptingState(): void {
    const selected = this.getSelectedNodes();

    for (const node of selected) {
      const theNode = this.cy.nodes('#' + node.id);
      const acceptingValue = theNode.data('acceptingState');
      const initialState = theNode.data('initialState');
      theNode.data({
        acceptingState: !acceptingValue,
        type: initialState
          ? acceptingValue
            ? 'initial'
            : 'initial-accepting'
          : acceptingValue
          ? 'standard'
          : 'accepting',
      });
    }

    this.updateAutomatonValidity();
  }

  public editTransitions(): void {
    const selected = this.getSelectedEdges();
    let willContinue: boolean = true;

    if (selected.length > 1) {
      willContinue = confirm(
        `Are you sure you want to set the transitions for ${selected.length} transitions at once?`
      );
    }

    if (!willContinue) {
      return;
    }

    const dialogRef = this.dialog.open(InputSymbolModalComponent, {
      width: '275px',
      data: {
        symbols: this.inputSymbols,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === undefined) {
        return;
      }
      const checkedSymbols: string[] = result
        .filter((symbol) => symbol.checked)
        .map((symbol) => symbol.name);

      for (const edge of selected) {
        this.cy.getElementById(edge.id).data({
          symbols: checkedSymbols,
          label: checkedSymbols.join(', '),
        });
      }

      this.updateAutomatonValidity();
    });
  }

  convertToAutomaton(): Automaton {
    let states: State[] = [];
    let acceptingStates: State[] = [];
    let initialState: State = undefined;

    let nodes = this.cy.nodes().map((node) => node.data());
    for (const node of nodes) {
      const state = new State(node.label);
      states.push(state);
      if (node.initialState) {
        initialState = state;
      }
      if (node.acceptingState) {
        acceptingStates.push(state);
      }
    }

    let transitions: Transition[] = [];
    for (const edge of this.cy.edges().map((edge) => edge.data())) {
      let initialState: State = states.find(
        (state) => state.name == edge.source
      );
      let nextState: State = states.find((state) => state.name == edge.target);

      for (const symbol of edge.symbols) {
        transitions.push(new Transition(symbol, initialState, nextState));
      }
    }

    if (!this.automatonToEdit) {
      this.sharedService.highestIdInUse++;
    }

    const automaton = new Automaton(
      states,
      acceptingStates,
      initialState,
      this.inputSymbols,
      transitions,
      this.automatonToEdit
        ? this.automatonToEdit.id
        : this.sharedService.highestIdInUse,
      this.automatonToEdit
        ? this.automatonToEdit.name
        : 'User Created Automaton'
    );
    return automaton;
  }

  public startDraw(): void {
    const selected = this.getSelectedNodes();

    if (selected.length !== 1) {
      return;
    }

    const sourceNode = this.cy.$(':selected')[0];

    this.eh.start(sourceNode);
  }

  public checkSolution(userAutomaton: Automaton): void {
    const res = this.checkEquivalenceService.checkEquivalence(
      this.problemToAttempt.solution,
      userAutomaton,
      true
    );

    let feedback = res.equivalent ? 'Correct!' : 'Incorrect: ';
    if (res.incorrectlyAccepted?.length > 0) {
      feedback +=
        userAutomaton.acceptingStates.length === userAutomaton.states.length
          ? ' Your automaton accepts all words. Remember to make at least one non-accepting state.'
          : ` Your automaton incorrectly accepts the word '${
              res.incorrectlyAccepted[
                Math.floor(Math.random() * res.incorrectlyAccepted.length)
              ]
            }'.`;
    }
    if (res.incorrectlyRejected?.length > 0) {
      feedback +=
        userAutomaton.acceptingStates.length === 0
          ? ' Your automaton rejects all words. Remember to add at least one accepting state.'
          : ` Your automaton incorrectly rejects the word '${
              res.incorrectlyRejected[
                Math.floor(Math.random() * res.incorrectlyRejected.length)
              ]
            }'.`;
    }

    this.problemAttemptFeedback = feedback;
  }

  public createAutomaton(): void {
    const automaton = this.convertToAutomaton();

    if (!automaton.isValidDfa()) {
      return;
    }

    if (this.creatingProblem) {
      this.createProblem(automaton);
      return;
    } else if (this.problemToAttempt) {
      this.checkSolution(automaton);
      return;
    }

    if (this.automatonToEdit) {
      if (this.automatonToEdit.id <= 4) {
        this.sharedService.testAutomata[this.automatonToEdit.id - 1] =
          automaton;
      } else {
        const index = this.sharedService.userDefinedAutomata.findIndex(
          (automaton) => automaton.id == this.automatonToEdit.id
        );
        this.sharedService.userDefinedAutomata[index] = automaton;
      }
    } else {
      this.sharedService.userDefinedAutomata.push(automaton);
    }

    this.reset();
  }

  public createProblem(validDfa: Automaton): void {
    if (
      this.problemNameValue.length === 0 ||
      this.problemDescriptionValue.length === 0
    ) {
      return;
    }

    const problem = new Problem(
      this.sharedService.problems.length + 1,
      this.problemNameValue,
      this.problemDescriptionValue,
      validDfa,
      {
        type: this.enableExampleWords
          ? WordGenerationType.Automatic
          : WordGenerationType.Disabled,
      },
      {
        type: this.enableExampleWords
          ? WordGenerationType.Automatic
          : WordGenerationType.Disabled,
      }
    );

    this.sharedService.problems.push(problem);
    this.router.navigate(['/view-problems']);
  }

  public reset(): void {
    this.drawModeChecked = false;
    this.eh.disableDrawMode();
    this.inputSymbols = ['a', 'b'];
    this.cy.remove('edges');
    this.cy.remove('nodes');

    const defaultElements = [
      {
        data: {
          id: 'q0',
          label: 'q0',
          group: 'nodes',
          type: 'parent',
        },
      },
      {
        data: {
          id: 'q1',
          label: 'q1',
          group: 'nodes',
          type: 'parent',
        },
      },
      {
        data: {
          id: 'q2',
          label: 'q2',
          group: 'nodes',
          type: 'parent',
        },
      },
      {
        data: {
          source: 'q0',
          target: 'q1',
          group: 'edges',
          label: 'a',
        },
      },
    ];

    this.cy.add(defaultElements);
    this.updateAutomatonValidity();
  }

  public resize(): void {
    let container = document.getElementById('cy');
    container.style.height = `${this.cy.nodes().length * 80}px`;

    this.cy.resize();
    this.cy.fit();

    container.style.height = `600px`;
  }

  public deleteSelectedSymbols(): void {
    this.inputSymbols = this.inputSymbols.filter(
      (x) => !this.inputSymbolsForm.value.includes(x)
    );
  }

  public onDrawModeSliderChange(): void {
    if (this.drawModeChecked) {
      this.eh.enableDrawMode();
    } else {
      this.eh.disableDrawMode();
    }
  }

  // Exactly one node selected
  public oneNodeSelected(): Boolean {
    const selected = this.cy.$(':selected').map((element) => element.data());

    if (selected.length !== 1) {
      return false;
    }

    return selected[0].group == 'nodes';
  }

  // At least one node or edge selected
  public elementsSelected(): Boolean {
    const selected = this.cy.$(':selected').map((element) => element.data());

    return selected.length > 0;
  }

  // At least one node selected, only nodes selected
  public nodesSelected(): Boolean {
    const selected = this.cy.$(':selected').map((element) => element.data());

    if (selected.length === 0) {
      return false;
    }

    for (const element of selected) {
      if (element.group != 'nodes') {
        return false;
      }
    }

    return true;
  }

  // At least one edge selected, only edges selected
  public edgesSelected(): Boolean {
    const selected = this.cy.$(':selected').map((element) => element.data());

    if (selected.length === 0) {
      return false;
    }

    for (const element of selected) {
      if (element.group != 'edges') {
        return false;
      }
    }

    return true;
  }

  generateWords(): void {
    const automaton: Automaton = this.convertToAutomaton();

    const words = automaton.generateWords(
      this.minimumLengthValue,
      this.maximumLengthValue
    );

    this.acceptedWords = words.acceptedWords;
    this.rejectedWords = words.rejectedWords;
  }

  checkWord(): void {
    const automaton: Automaton = this.convertToAutomaton();
    this.wordAccepted = automaton.classifyWord(this.wordToCheck);
  }

  wordAcceptedIsError(): Boolean {
    return (
      typeof this.wordAccepted === 'string' &&
      this.wordAccepted.startsWith('Error')
    );
  }
}
