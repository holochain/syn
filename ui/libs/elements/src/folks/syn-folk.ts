import type { AgentPubKeyB64 } from '@holochain-open-dev/core-types';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { AgentAvatar } from '@holochain-open-dev/profiles';
import { contextProvided } from '@lit-labs/context';
import type { SessionStore, SynStore } from '@syn/store';
import { StoreSubscriber } from 'lit-svelte-stores';

import { synContext, synSessionContext } from '../context/contexts';

export class SynFolk extends ScopedElementsMixin(LitElement) {
  @property()
  agentPubKey!: AgentPubKeyB64;

  @contextProvided({ context: synContext, multiple: true })
  @state()
  synStore!: SynStore<any, any>;

  @contextProvided({ context: synSessionContext, multiple: true })
  @state()
  sessionStore!: SessionStore<any, any>;

  _folks = new StoreSubscriber(this, () => this.sessionStore?.folks);

  get inSession() {
    if (this.agentPubKey === this.synStore.myPubKey) return true;
    if (!this._folks.value) return false;
    if (!this._folks.value[this.agentPubKey]) return false;
    return this._folks.value[this.agentPubKey].inSession;
  }

  get isScribe() {
    return this.sessionStore?.session.scribe === this.agentPubKey;
  }

  render() {
    return html`
      <div
        class="${classMap({
          scribe: this.isScribe,
        })}"
        style="padding: 4px;"
      >
        <agent-avatar
          class="${classMap({
            'out-of-session': !this.inSession,
          })}"
          .agentPubKey=${this.agentPubKey}
        ></agent-avatar>
      </div>
    `;
  }

  static get styles() {
    return css`
      .scribe {
        background-color: grey;
        border-radius: 50%;
      }

      .out-of-session {
        opacity: 0.5;
      }
    `;
  }

  static get scopedElements() {
    return {
      'agent-avatar': AgentAvatar,
    };
  }
}
