import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { html, LitElement } from 'lit';
import { CytoscapeDagre } from '@scoped-elements/cytoscape';
import { property } from 'lit/decorators.js';
import { contextProvided } from '@lit-labs/context';
import { Card, CircularProgress } from '@scoped-elements/material-web';
import { TaskSubscriber } from 'lit-svelte-stores';
import type { NodeDefinition, EdgeDefinition } from 'cytoscape';

import { EntryHashB64 } from '@holochain-open-dev/core-types';
import { serializeHash, RecordBag } from '@holochain-open-dev/utils';

import { Commit } from '@holochain-syn/client';
import { RootStore } from '@holochain-syn/store';

import { sharedStyles } from '../shared-styles';
import { synRootContext } from '../context/contexts';

export class CommitHistory extends ScopedElementsMixin(LitElement) {
  @contextProvided({ context: synRootContext, subscribe: true })
  @property()
  rootstore!: RootStore<any>;

  @property()
  selectedCommitHash: EntryHashB64 | undefined;

  _allCommitsTask = new TaskSubscriber(this, () =>
    this.rootstore.fetchCommits()
  );

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

  renderContent(allCommits: RecordBag<Commit>) {
    const elements = getCommitGraph(allCommits);
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
    return this._allCommitsTask.render({
      pending: () => html`
        <div
          class="row"
          style="flex: 1; align-items: center; justify-content: center;"
        >
          <mwc-circular-progress indeterminate></mwc-circular-progress>
        </div>
      `,
      complete: allCommits => html`<mwc-card style="flex: 1;">
        <div class="column" style="flex: 1;">
          <span class="title" style="margin: 16px; margin-bottom: 4px;"
            >Commit History</span
          >
          ${this.renderContent(allCommits)}
        </div>
      </mwc-card>`,
    });
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
  commits: RecordBag<Commit>
): Array<NodeDefinition | EdgeDefinition> {
  const elements: Array<NodeDefinition | EdgeDefinition> = [];

  for (const [commitHash, commit] of commits.entryMap.entries()) {
    const strCommitHash = serializeHash(commitHash);
    elements.push({
      data: {
        id: strCommitHash,
      },
    });

    for (const parentCommitHash of commit.previous_commit_hashes) {
      const strParentCommitHash = serializeHash(parentCommitHash);

      elements.push({
        data: {
          id: `${strParentCommitHash}->${strCommitHash}`,
          source: strParentCommitHash,
          target: strCommitHash,
        },
      });
    }
  }

  return elements;
}
