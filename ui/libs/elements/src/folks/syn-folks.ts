import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { html, LitElement } from 'lit';
import type { SynStore } from '@syn/store';
import { StoreSubscriber } from 'lit-svelte-stores';
import { state } from 'lit/decorators.js';
import { contextProvided } from '@lit-labs/context';

import { synContext } from '../context/contexts';
import { SynFolk } from './syn-folk';
import { sharedStyles } from '../shared-styles';

export class SynFolks extends ScopedElementsMixin(LitElement) {
  @contextProvided({ context: synContext, multiple: true })
  @state()
  syn!: SynStore<any>;

  _activeSession = new StoreSubscriber(this, () => this.syn.activeSession);
  _folks = new StoreSubscriber(this, () => this._activeSession.value?.folks);

  render() {
    if (!this.syn || !this._folks.value)
      return html`<span>There is no active session</span>`;

    return html`
      <div class="column">
        <syn-folk .agentPubKey=${this.syn.myPubKey}></syn-folk>
        ${Object.keys(this._folks.value).map(
          pubKey => html`<syn-folk .agentPubKey=${pubKey}></syn-folk>`
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
