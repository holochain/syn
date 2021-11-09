import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { html, LitElement } from 'lit';
import { CytoscapeDagre } from '@scoped-elements/cytoscape';
import { sharedStyles } from '../shared-styles';

export class SynCommitHistory extends ScopedElementsMixin(LitElement) {
  render() {
    return html`<cytoscape-dagre style="flex: 1;"></cytoscape-dagre>`;
  }

  static get scopedElements() {
    return {
      'cytoscape-dagre': CytoscapeDagre,
    };
  }

  static styles = [sharedStyles];
}
