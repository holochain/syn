import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { html, LitElement } from 'lit';
import type { SynStore } from '@holochain-syn/store';
import { StoreSubscriber } from 'lit-svelte-stores';
import { state } from 'lit/decorators.js';
import { contextProvided } from '@holochain-open-dev/context';
import {
  List,
  ListItem,
  Button,
  CircularProgress,
  Card,
} from '@scoped-elements/material-web';
import type { EntryHashB64 } from '@holochain-open-dev/core-types';
import type { Session } from '@holochain-syn/client';
import { AgentAvatar } from '@holochain-open-dev/profiles';
import { SlRelativeTime } from '@scoped-elements/shoelace';

import { synContext } from '../context/contexts';
import { sharedStyles } from '../shared-styles';

export class SynSessions extends ScopedElementsMixin(LitElement) {
  @contextProvided({ context: synContext, multiple: true })
  @state()
  syn!: SynStore<any>;

  _allSessions = new StoreSubscriber(this, () => this.syn.knownSessions);
  _joinedSessions = new StoreSubscriber(this, () => this.syn.joinedSessions);

  @state()
  _loaded = false;

  async firstUpdated() {
    await this.syn.getAllSessions();
    this._loaded = true;
  }

  async joinSession(sessionHash: EntryHashB64) {
    // TODO: extract this into its own config
    if (this._joinedSessions.value.length > 0) {
      await this.syn.sessionStore(this._joinedSessions.value[0]).leave();
    }

    await this.syn.joinSession(sessionHash);
  }

  renderSession(sessionHash: EntryHashB64, session: Session) {
    return html`
      <div class="row" style="flex: 1; align-items: center">
        <mwc-list-item graphic="avatar" style="flex: 1;">
          <agent-avatar
            slot="graphic"
            .agentPubKey=${session.scribe}
          ></agent-avatar>

          <sl-relative-time
            .date=${new Date(session.createdAt)}
            style="margin-left: 4px;"
          ></sl-relative-time>
        </mwc-list-item>

        ${this._joinedSessions.value.includes(sessionHash)
          ? html`<span class="placeholder">Already Joined</span>`
          : html`
              <mwc-button @click=${() => this.joinSession(sessionHash)}
                >Join</mwc-button
              >
            `}
      </div>
    `;
  }

  render() {
    if (!this._loaded)
      return html`
        <div
          class="row"
          style="flex: 1; align-items: center; justify-content: center;"
        >
          <mwc-circular-progress indeterminate></mwc-circular-progress>
        </div>
      `;
    return html`
      <mwc-card style="flex: 1;">
        <div class="column" style="flex: 1;">
          <span class="title" style="margin: 16px; margin-bottom: 0;">Live Sessions</span>

          ${Object.keys(this._allSessions.value).length === 0
            ? html`
                <div
                  class="row"
                  style="flex: 1; align-items: center; justify-content: center;"
                >
                  <span class="placeholder"
                    >There are no live sessions at the moment</span
                  >
                </div>
              `
            : html`
                <div class="flex-scrollable-parent">
                  <div class="flex-scrollable-container">
                    <div class="flex-scrollable-y">
                      <mwc-list>
                        ${Object.entries(this._allSessions.value).map(
                          ([sessionHash, session]) =>
                            this.renderSession(sessionHash, session)
                        )}
                      </mwc-list>
                    </div>
                  </div>
                </div>
              `}
        </div>
      </mwc-card>
    `;
  }

  static get scopedElements() {
    return {
      'mwc-list': List,
      'mwc-list-item': ListItem,
      'mwc-card': Card,
      'sl-relative-time': SlRelativeTime,
      'mwc-button': Button,
      'agent-avatar': AgentAvatar,
      'mwc-circular-progress': CircularProgress,
    };
  }

  static get styles() {
    return sharedStyles;
  }
}
