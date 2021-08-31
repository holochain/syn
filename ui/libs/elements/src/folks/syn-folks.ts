import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { html, LitElement, PropertyValues } from 'lit';
import type { SessionFolk, SessionStore, SynStore } from '@syn/store';
import { StoreController } from 'lit-svelte-stores';
import { state } from 'lit/decorators.js';
import type { Dictionary } from '@holochain-open-dev/core-types';

import { synContext, synSessionContext } from '../context/contexts';
import { contextProvided } from '@lit-labs/context';
import { SynFolk } from './syn-folk';
import { sharedStyles } from '../shared-styles';

export class SynFolks extends ScopedElementsMixin(LitElement) {
  @contextProvided({ context: synContext, multiple: true })
  @state()
  syn!: SynStore<any, any>;

  @contextProvided({ context: synSessionContext, multiple: true })
  @state()
  session!: SessionStore<any, any>;

  @state()
  _folks!: StoreController<Dictionary<SessionFolk>> | undefined;

  updated(changedValues: PropertyValues) {
    super.updated(changedValues);

    if (changedValues.has('session')) {
      console.log(this.session)
      this._folks = this.session
        ? new StoreController(this, this.session.folks)
        : undefined;
    }
  }

  render() {
    if (!this.session || !this._folks)
      return html`<span>There is no active session</span>`;

    return html`
      <div class="column">
        <syn-folk
          .pubKey=${this.syn.myPubKey}
          .folk=${{
            colors: this.syn.myColors,
            inSession: true,
            lastSeen: Date.now(),
          }}
        ></syn-folk>
        ${Object.entries(this._folks?.value).map(
          ([pubKey, folk]) =>
            html`<syn-folk
              .pubKey=${pubKey}
              .folk=${folk}
              .isScribe=${this.session.info.scribe === pubKey}
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
