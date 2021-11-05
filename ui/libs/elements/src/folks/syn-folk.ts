import type { AgentPubKeyB64 } from '@holochain-open-dev/core-types';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { AgentAvatar } from '@holochain-open-dev/profiles';

export class SynFolk extends ScopedElementsMixin(LitElement) {
  @property()
  agentPubKey!: AgentPubKeyB64;

  @property({ attribute: 'in-session' })
  inSession: boolean = false;

  @property({ attribute: 'is-scribe' })
  isScribe: boolean = false;

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
