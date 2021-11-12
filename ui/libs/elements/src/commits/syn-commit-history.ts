import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { html, LitElement } from 'lit';
import { CytoscapeDagre } from '@scoped-elements/cytoscape';
import { property, state } from 'lit/decorators.js';
import { contextProvided } from '@lit-labs/context';
import { Card, CircularProgress } from '@scoped-elements/material-web';
import { StoreSubscriber } from 'lit-svelte-stores';
import type { NodeDefinition, EdgeDefinition } from 'cytoscape';
import type { Dictionary, EntryHashB64 } from '@holochain-open-dev/core-types';

import type { SynStore } from '@syn/store';
import type { Commit } from '@syn/zome-client';

import { sharedStyles } from '../shared-styles';
import { synContext } from '../context/contexts';

export class SynCommitHistory extends ScopedElementsMixin(LitElement) {
  @contextProvided({ context: synContext, multiple: true })
  @state()
  _synStore!: SynStore<any, any>;

  @state()
  _loading = true;

  @property()
  selectedCommitHash: EntryHashB64 | undefined;

  _allCommits = new StoreSubscriber(this, () => this._synStore.allCommits);

  async firstUpdated() {
    await this._synStore.fetchCommitHistory();
    this._loading = false;
  }

  onNodeSelected(nodeId: string) {
    this.selectedCommitHash = nodeId;
    this.dispatchEvent(
      new CustomEvent('commit-selected', {
        bubbles: true,
        composed: true,
        detail: {
          commitHash: nodeId,
        },
      })
    );
  }

  get selectedNodeIds() {
    return this.selectedCommitHash ? [this.selectedCommitHash] : [];
  }

  renderContent() {
    const elements = getCommitGraph(this._allCommits.value);
    if (elements.length === 0)
      return html` <div
        class="row"
        style="flex: 1; align-items: center; justify-content: center;"
      >
        <span class="placeholder"> There are no commits yet </span>
      </div>`;

    return html`<cytoscape-dagre
      style="flex: 1;"
      .fixed=${true}
      .options=${{
        style: `
          edge {
            target-arrow-shape: triangle;
            width: 2px;
          }
        `,
      }}
      .selectedNodesIds=${this.selectedNodeIds}
      .elements=${elements}
      .dagreOptions=${{
        rankDir: 'BT',
      }}
      @node-selected=${(e: CustomEvent) => this.onNodeSelected(e.detail.id())}
    ></cytoscape-dagre>`;
  }

  render() {
    if (this._loading)
      return html`
        <div
          class="row"
          style="flex: 1; align-items: center; justify-content: center;"
        >
          <mwc-circular-progress indeterminate></mwc-circular-progress>
        </div>
      `;

    return html`<mwc-card style="flex: 1;">
      <div class="column" style="flex: 1;">
        <span class="title" style="margin: 16px; margin-bottom: 4px;"
          >Commit History</span
        >
        ${this.renderContent()}
      </div>
    </mwc-card>`;
  }

  static get scopedElements() {
    return {
      'cytoscape-dagre': CytoscapeDagre,
      'mwc-circular-progress': CircularProgress,
      'mwc-card': Card,
    };
  }

  static styles = [sharedStyles];
}

function getCommitGraph(
  commits: Dictionary<Commit>
): Array<NodeDefinition | EdgeDefinition> {
  const elements: Array<NodeDefinition | EdgeDefinition> = [];

  for (const [commitHash, commit] of Object.entries(commits)) {
    elements.push({
      data: {
        id: commitHash,
      },
    });

    for (const parentCommitHash of commit.previousCommitHashes) {
      elements.push({
        data: {
          id: `${parentCommitHash}->${commitHash}`,
          source: parentCommitHash,
          target: commitHash,
        },
      });
    }
  }

  return elements;
}
