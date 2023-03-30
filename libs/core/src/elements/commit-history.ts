import { html, LitElement } from 'lit';
import { CytoscapeDagre } from '@scoped-elements/cytoscape';
customElements.define('cytoscape-dagre', CytoscapeDagre);
import { customElement, property } from 'lit/decorators.js';
import { consume } from '@lit-labs/context';
import type { NodeDefinition, EdgeDefinition } from 'cytoscape';

import { encodeHashToBase64, EntryHashB64 } from '@holochain/client';
import { RecordBag } from '@holochain-open-dev/utils';

import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@holochain-open-dev/elements/elements/display-error.js';

import { Commit } from '@holochain-syn/client';
import { RootStore } from '@holochain-syn/store';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import { localized, msg } from '@lit/localize';

import { synRootContext } from '../contexts';
import { sharedStyles } from '@holochain-open-dev/elements';

@localized()
@customElement('commit-history')
export class CommitHistory extends LitElement {
  @consume({ context: synRootContext, subscribe: true })
  @property()
  rootstore!: RootStore<any>;

  @property()
  selectedCommitHash: EntryHashB64 | undefined;

  _allCommits = new StoreSubscriber(this, () => this.rootstore.allCommits);

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
    switch (this._allCommits.value.status) {
      case 'pending':
        return html`
          <div
            class="row"
            style="flex: 1; align-items: center; justify-content: center;"
          >
            <sl-spinner style="font-size: 2rem"></sl-spinner>
          </div>
        `;
      case 'complete':
        return html`<sl-card style="flex: 1;">
          <div class="column" style="flex: 1;">
            <span class="title" style="margin: 16px; margin-bottom: 4px;"
              >Commit History</span
            >
            ${this.renderContent(
              new RecordBag(this._allCommits.value.value.map(er => er.record))
            )}
          </div>
        </sl-card>`;
      case 'error':
        return html`<display-error
          .headline=${msg('Error fetching the commit history')}
          .error=${this._allCommits.value.error.data.data}
        ></display-error>`;
    }
  }

  static styles = [sharedStyles];
}

function getCommitGraph(
  commits: RecordBag<Commit>
): Array<NodeDefinition | EdgeDefinition> {
  const elements: Array<NodeDefinition | EdgeDefinition> = [];

  for (const [commitHash, commit] of commits.entryMap.entries()) {
    const strCommitHash = encodeHashToBase64(commitHash);
    elements.push({
      data: {
        id: strCommitHash,
      },
    });

    for (const parentCommitHash of commit.previous_commit_hashes) {
      const strParentCommitHash = encodeHashToBase64(parentCommitHash);

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
