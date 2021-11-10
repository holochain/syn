import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { html, LitElement } from 'lit';
import { CytoscapeDagre } from '@scoped-elements/cytoscape';
import { state } from 'lit/decorators.js';
import { contextProvided } from '@lit-labs/context';
import { CircularProgress } from '@scoped-elements/material-web';
import { StoreSubscriber } from 'lit-svelte-stores';
import type { NodeDefinition, EdgeDefinition } from 'cytoscape';
import type { Dictionary } from '@holochain-open-dev/core-types';

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

  _allCommits = new StoreSubscriber(this, () => this._synStore.allCommits);

  async firstUpdated() {
    await this._synStore.fetchCommitHistory();
    this._loading = false;
  }

  render() {
    if (this._loading)
      return html`<mwc-circular-progress></mwc-circular-progress>`;

    const { nodes, edges } = getCommitGraph(this._allCommits.value);
    return html`<cytoscape-dagre
      style="flex: 1;"
      .nodes=${nodes}
      .edges=${edges}
      @node-selected=${(e: CustomEvent) =>
        this.dispatchEvent(
          new CustomEvent('commit-selected', {
            bubbles: true,
            composed: true,
            detail: {
              commitHash: e.detail.id(),
            },
          })
        )}
    ></cytoscape-dagre>`;
  }

  static get scopedElements() {
    return {
      'cytoscape-dagre': CytoscapeDagre,
      'mwc-circular-progress': CircularProgress,
    };
  }

  static styles = [sharedStyles];
}

function getCommitGraph(commits: Dictionary<Commit>): {
  nodes: NodeDefinition[];
  edges: EdgeDefinition[];
} {
  const nodes: NodeDefinition[] = [];
  const edges: EdgeDefinition[] = [];

  for (const [commitHash, commit] of Object.entries(commits)) {
    nodes.push({
      data: {
        id: commitHash,
      },
    });

    for (const parentCommitHash of commit.previousCommitHashes) {
      edges.push({
        data: {
          id: `${parentCommitHash}->${commitHash}`,
          source: parentCommitHash,
          target: commitHash,
        },
      });
    }
  }

  return {
    nodes,
    edges,
  };
}
