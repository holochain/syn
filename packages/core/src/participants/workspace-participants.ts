import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { css, html, LitElement } from 'lit';
import type { WorkspaceStore } from '@holochain-syn/store';
import { StoreSubscriber } from 'lit-svelte-stores';
import { property } from 'lit/decorators.js';
import { contextProvided } from '@lit-labs/context';

import { synWorkspaceContext } from '../context/contexts';
import { sharedStyles } from '../shared-styles';
import { AgentAvatar } from '@holochain-open-dev/profiles';
import { classMap } from 'lit/directives/class-map';
import { AgentPubKey } from '@holochain/client';

export class SynFolks extends ScopedElementsMixin(LitElement) {
  @contextProvided({ context: synWorkspaceContext, subscribe: true })
  @property()
  workspaceStore!: WorkspaceStore<any>;

  _participants = new StoreSubscriber(
    this,
    () => this.workspaceStore.participants
  );

  renderParticipant(pubKey: AgentPubKey, idle: boolean) {
    return html`
      <agent-avatar
        class="${classMap({
          'out-of-session': idle,
        })}"
        .agentPubKey=${pubKey}
      ></agent-avatar>
    `;
  }

  render() {
    return html`
      <div class="column">
        ${this._participants.value.active.map(pubKey =>
          this.renderParticipant(pubKey, false)
        )}
        ${this._participants.value.idle.map(pubKey =>
          this.renderParticipant(pubKey, true)
        )}
      </div>
    `;
  }

  static get scopedElements() {
    return {
      'agent-avatar': AgentAvatar,
    };
  }

  static get styles() {
    return [
      sharedStyles,
      css`
        .out-of-session {
          opacity: 0.5;
        }
      `,
    ];
  }
}
