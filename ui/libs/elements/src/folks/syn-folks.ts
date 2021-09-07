import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { html, LitElement } from 'lit';
import type { SessionStore, SynStore } from '@syn/store';
import { DynamicStore } from 'lit-svelte-stores';
import { state } from 'lit/decorators.js';
import { contextProvided } from '@lit-labs/context';

import { synContext, synSessionContext } from '../context/contexts';
import { SynFolk } from './syn-folk';
import { sharedStyles } from '../shared-styles';

export class SynFolks extends ScopedElementsMixin(LitElement) {
  @contextProvided({ context: synContext, multiple: true })
  @state()
  syn!: SynStore<any, any>;

  @contextProvided({ context: synSessionContext, multiple: true })
  @state()
  sessionStore!: SessionStore<any, any>;

  _folks = new DynamicStore(this, () => this.sessionStore?.folks);
  
  render() {
    if (!this.sessionStore || !this._folks.value)
      return html`<span>There is no active session</span>`;

    return html`
      <div class="column">
        <syn-folk .pubKey=${this.syn.myPubKey} in-session></syn-folk>
        ${Object.entries(this._folks.value).map(
          ([pubKey, folk]) =>
            html`<syn-folk
              .pubKey=${pubKey}
              .inSession=${folk.inSession}
              .isScribe=${this.sessionStore.session.scribe === pubKey}
            ></syn-folk>`
        )}
      </div>
    `;
  }

  static get scopedElements() {
    return {
      'syn-folk': SynFolk,
    };
  }

  static get styles() {
    return sharedStyles;
  }
}
