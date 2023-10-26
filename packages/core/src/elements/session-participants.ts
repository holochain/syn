import { css, html, LitElement } from 'lit';
import type { SessionStore } from '@holochain-syn/store';
import { customElement, property } from 'lit/decorators.js';
import { consume } from '@lit-labs/context';
import { AgentPubKey } from '@holochain/client';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { StoreSubscriber } from '@holochain-open-dev/stores';

import { sharedStyles } from '@holochain-open-dev/elements';
import '@holochain-open-dev/profiles/dist/elements/agent-avatar.js';

import { synSessionContext } from '../contexts.js';

@customElement('session-participants')
export class SessionParticipants extends LitElement {
  @consume({ context: synSessionContext, subscribe: true })
  @property()
  sessionstore!: SessionStore<any>;

  @property()
  direction: 'column' | 'row' = 'column';

  _participants = new StoreSubscriber(
    this,
    () => this.sessionstore.participants,
    () => [this.sessionstore]
  );

  renderParticipant(pubKey: AgentPubKey, idle: boolean) {
    return html`
      <agent-avatar
        class="${classMap({
          'out-of-session': idle,
        })}"
        .agentPubKey=${pubKey}
        style=${styleMap({
          'margin-bottom': this.direction === 'column' ? '8px' : '0px',
          'margin-right': this.direction === 'row' ? '8px' : '0px',
        })}
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
