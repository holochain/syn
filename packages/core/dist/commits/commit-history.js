var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { html, LitElement } from 'lit';
import { CytoscapeDagre } from '@scoped-elements/cytoscape';
import { property } from 'lit/decorators.js';
import { contextProvided } from '@lit-labs/context';
import { Card, CircularProgress } from '@scoped-elements/material-web';
import { TaskSubscriber } from 'lit-svelte-stores';
import { encodeHashToBase64 } from '@holochain/client';
import { sharedStyles } from '../shared-styles';
import { synRootContext } from '../context/contexts';
export class CommitHistory extends ScopedElementsMixin(LitElement) {
    constructor() {
        super(...arguments);
        this._allCommitsTask = new TaskSubscriber(this, () => this.rootstore.fetchCommits());
    }
    onNodeSelected(nodeId) {
        this.selectedCommitHash = nodeId;
        this.dispatchEvent(new CustomEvent('commit-selected', {
            bubbles: true,
            composed: true,
            detail: {
                commitHash: nodeId,
            },
        }));
    }
    get selectedNodeIds() {
        return this.selectedCommitHash ? [this.selectedCommitHash] : [];
    }
    renderContent(allCommits) {
        const elements = getCommitGraph(allCommits);
        if (elements.length === 0)
            return html ` <div
        class="row"
        style="flex: 1; align-items: center; justify-content: center;"
      >
        <span class="placeholder"> There are no commits yet </span>
      </div>`;
        return html `<cytoscape-dagre
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
      @node-selected=${(e) => this.onNodeSelected(e.detail.id())}
    ></cytoscape-dagre>`;
    }
    render() {
        return this._allCommitsTask.render({
            pending: () => html `
        <div
          class="row"
          style="flex: 1; align-items: center; justify-content: center;"
        >
          <mwc-circular-progress indeterminate></mwc-circular-progress>
        </div>
      `,
            complete: allCommits => html `<mwc-card style="flex: 1;">
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
}
CommitHistory.styles = [sharedStyles];
__decorate([
    contextProvided({ context: synRootContext, subscribe: true }),
    property()
], CommitHistory.prototype, "rootstore", void 0);
__decorate([
    property()
], CommitHistory.prototype, "selectedCommitHash", void 0);
function getCommitGraph(commits) {
    const elements = [];
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
//# sourceMappingURL=commit-history.js.map