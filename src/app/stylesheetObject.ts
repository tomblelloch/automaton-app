export const stylesheetObject = [
  {
    selector: 'node',
    css: {
      label: 'data(label)',
      'text-valign': 'center',
      'text-halign': 'center',
      'font-size': 20,
      height: '44px',
      width: '44px',
      'border-style': 'solid',
      'border-width': '1.5px',
      'border-color': 'black',
      'background-color': 'white',
    },
  },
  {
    selector: 'node[type="accepting"]',
    css: {
      'border-style': 'double',
      'border-width': '4px',
      'border-color': 'black',
    },
  },
  {
    selector: 'node[type="initial"]',
    css: {
      'border-style': 'solid',
      'border-width': '1.5px',
      'border-color': 'red',
    },
  },
  {
    selector: 'node[type="initial-accepting"]',
    css: {
      'border-style': 'double',
      'border-width': '4px',
      'border-color': 'red',
    },
  },
  {
    selector: 'edge',
    style: {
      label: 'data(label)',
      'text-margin-y': -10,
      'curve-style': 'bezier',
      width: 1.5,
      'line-color': '#000',
      'target-arrow-color': '#000',
      'target-arrow-shape': 'triangle',
      'target-arrow-fill': 'filled',
      'arrow-scale': 1,
      'source-label': 'data(method)',
      'source-text-offset': '200%',
      'text-border-width': '2px',
      'control-point-step-size': 80,
      'loop-sweep': '-60deg',
    },
  },
];
