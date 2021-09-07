import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { html, LitElement } from 'lit';
import type { SynStore } from '@syn/store';
import { DynamicStore } from 'lit-svelte-stores';
import { state } from 'lit/decorators.js';
import { contextProvided } from '@lit-labs/context';
import { List, ListItem, Button, CircularProgress } from '@scoped-elements/material-web';

import { synContext } from '../context/contexts';
import { sharedStyles } from '../shared-styles';
import type { EntryHashB64 } from '@holochain-open-dev/core-types';
import { SynFolk } from '../folks/syn-folk';

export class SynSessions extends ScopedElementsMixin(LitElement) {
  @contextProvided({ context: synContext, multiple: true })
  @state()
  syn!: SynStore<any, any>;

  _allSessions = new DynamicStore(this, () => this.syn.knownSessions);
  _joinedSessions = new DynamicStore(this, () => this.syn.joinedSessions);

  @state()
  _loaded = false;

  async firstUpdated() {
    await this.syn.fetchAllSessions();
    this._loaded = true;
  }

  joinSession(sessionHash: EntryHashB64) {
    this.syn.joinSession(sessionHash);
  }

  render() {
    if (!this._loaded)
      return html`<mwc-circular-progress
        indeterminate
      ></mwc-circular-progress>`;
    return html`
      <mwc-list activatable>
        ${Object.entries(this._allSessions.value).map(
          ([sessionHash, session]) => html`
            <div class="row">
              <mwc-list-item
                .activated=${this._joinedSessions.value.includes(sessionHash)}
              >
                <syn-folk .pubKey=${session.scribe} in-session></syn-folk>
              </mwc-list-item>
              <mwc-button @click=${() => this.joinSession(sessionHash)}
                >Join</mwc-button
              >
            </div>
          `
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
