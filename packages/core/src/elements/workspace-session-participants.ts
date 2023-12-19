import { css, html, LitElement } from 'lit';
import type { WorkspaceStore } from '@holochain-syn/store';
import { customElement, property } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { msg } from '@lit/localize';
import { classMap } from 'lit/directives/class-map.js';

import { StoreSubscriber } from '@holochain-open-dev/stores';
import { AgentPubKey } from '@holochain/client';
import { sharedStyles } from '@holochain-open-dev/elements';
import '@holochain-open-dev/profiles/dist/elements/agent-avatar.js';

import { synWorkspaceContext } from '../contexts.js';

/**
 * @element workspace-session-participants
 * Shows an up to date list of the participants of the workspace, without needing to join the session
 */
@customElement('workspace-session-participants')
export class WorkspaceParticipants extends LitElement {
  @consume({ context: synWorkspaceContext, subscribe: true })
  @property()
  workspacestore!: WorkspaceStore<any, any>;

  @property()
  direction: 'column' | 'row' = 'column';

  private _participants = new StoreSubscriber(
    this,
    () => this.workspacestore.sessionParticipants,
    () => [this.workspacestore]
  );

  renderParticipant(pubKey: AgentPubKey) {
    return html` <agent-avatar .agentPubKey=${pubKey}></agent-avatar> `;
  }

  renderContent() {
    switch (this._participants.value.status) {
      case 'pending':
        return html`
          <sl-skeleton style="width: 32px; height: 32px"></sl-skeleton>
        `;
      case 'complete':
        return this._participants.value.value.map(pubKey =>
          this.renderParticipant(pubKey)
        );
      case 'error':
        return html`<display-error
          tooltip
          .headline=${msg('Error fetching the participants for the session')}
          .error=${this._participants.value.error}
        ></display-error>`;
    }
  }

  render() {
    return html`
      <div
        class=${classMap({
          column: this.direction === 'column',
          row: this.direction === 'row',
        })}
        style="gap: 8px"
      >
        ${this.renderContent()}
      </div>
    `;
  }

  static styles = [
    sharedStyles,
    css`
      .out-of-session {
        opacity: 0.5;
      }
    `,
  ];
}
