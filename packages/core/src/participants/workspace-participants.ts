import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { css, html, LitElement } from 'lit';
import type { WorkspaceStore } from '@holochain-syn/store';
import { StoreSubscriber } from 'lit-svelte-stores';
import { property } from 'lit/decorators.js';
import { contextProvided } from '@lit-labs/context';
import { AgentPubKey } from '@holochain/client';
import { classMap } from 'lit/directives/class-map.js';
import { serializeHash } from '@holochain-open-dev/utils';
import { AgentAvatar } from '@holochain-open-dev/profiles';

import { synWorkspaceContext } from '../context/contexts';
import { sharedStyles } from '../shared-styles';

export class WorkspaceParticipants extends ScopedElementsMixin(LitElement) {
  @contextProvided({ context: synWorkspaceContext, subscribe: true })
  @property()
  workspacestore!: WorkspaceStore<any>;

  @property()
  direction: 'column' | 'row' = 'column';

  _participants = new StoreSubscriber(
    this,
    () => this.workspacestore.participants
  );

  renderParticipant(pubKey: AgentPubKey, idle: boolean) {
    return html`
      <agent-avatar
        class="${classMap({
          'out-of-session': idle,
        })}"
        .agentPubKey=${serializeHash(pubKey)}
        style="margin-bottom: 8px;"
      ></agent-avatar>
    `;
  }

  render() {
    return html`
      <div
        class=${classMap({
          column: this.direction === 'column',
          row: this.direction === 'row',
        })}
      >
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
