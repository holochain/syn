import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { html, LitElement, PropertyValues } from 'lit';
import type { SessionFolk, SessionStore } from '@syn/store';
import { StoreController } from 'lit-svelte-stores';
import { state } from 'lit/decorators.js';
import type { Dictionary } from '@holochain-open-dev/core-types';

import { synSessionContext } from './context/contexts';
import { contextProvided } from '@lit-labs/context';

export class SynFolks extends ScopedElementsMixin(LitElement) {
  @contextProvided({ context: synSessionContext, multiple: true })
  session!: SessionStore<any, any>;

  @state()
  _folks!: StoreController<Dictionary<SessionFolk>> | undefined;

  updated(changedValues: PropertyValues) {
    super.updated(changedValues);

    if (changedValues.has('session')) {
      this._folks = this.session
        ? new StoreController(this, this.session.folks)
        : undefined;
    }
  }

  render() {
    if (!this.session) return html`There is no active session`;

    return html` ${this._folks?.value} `;
  }
}
