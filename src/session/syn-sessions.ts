import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { html, LitElement } from 'lit';
import type { SynStore } from '@syn/store';
import { StoreSubscriber } from 'lit-svelte-stores';
import { state } from 'lit/decorators.js';
import { contextProvided } from '@lit-labs/context';
import {
  List,
  ListItem,
  Button,
  CircularProgress,
} from '@scoped-elements/material-web';

import { synContext } from '../context/contexts';
import { sharedStyles } from '../shared-styles';
import type { EntryHashB64 } from '@holochain-open-dev/core-types';
import { SynFolk } from '../folks/syn-folk';
import type { Session } from '@syn/zome-client';

export class SynSessions extends ScopedElementsMixin(LitElement) {
  @contextProvided({ context: synContext, multiple: true })
  @state()
  syn!: SynStore<any, any>;

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
      <div class="column" style="align-items: center">
        <div class="row" style="align-items: center; margin-bottom: 4px;">
          <syn-folk .pubKey=${session.scribe} in-session></syn-folk>

          <span style="margin-left: 4px;"
            >${new Date(session.createdAt).toLocaleTimeString([], {
              second: undefined,
            })}</span
          >
        </div>

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
      return html`<mwc-circular-progress
        indeterminate
      ></mwc-circular-progress>`;
    return html`
      <mwc-list activatable>
        ${Object.entries(this._allSessions.value).map(
          ([sessionHash, session]) => this.renderSession(sessionHash, session)
        )}
      </mwc-list>
    `;
  }

  static get scopedElements() {
    return {
      'mwc-list': List,
      'mwc-list-item': ListItem,
      'mwc-button': Button,
      'syn-folk': SynFolk,
      'mwc-circular-progress': CircularProgress,
    };
  }

  static get styles() {
    return sharedStyles;
  }
}
