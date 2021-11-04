import type { EntryHashB64 } from '@holochain-open-dev/core-types';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { css, html, LitElement, PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { SessionStore, SynStore } from '@syn/store';
import { Context, contextProvided, ContextProvider } from '@lit-labs/context';

import { synSessionContext, synContext } from './contexts';

export class SynSessionContext extends ScopedElementsMixin(LitElement) {
  @property({ attribute: 'session-hash' })
  sessionHash!: EntryHashB64;

  @contextProvided({ context: synContext, multiple: true })
  @state()
  synStore!: SynStore<any, any>;

  provider!: ContextProvider<Context<SessionStore<any, any> | undefined>>;

  connectedCallback() {
    super.connectedCallback();

    this.provider = new ContextProvider(
      this,
      synSessionContext,
      this.synStore.sessionStore(this.sessionHash)
    );
  }

  update(changedValues: PropertyValues) {
    super.update(changedValues);
    if (changedValues.has('sessionHash')) {
      this.provider.setValue(this.synStore.sessionStore(this.sessionHash));
    }
  }

  render() {
    return html`<slot></slot>`;
  }

  static get styles() {
    return css`
      :host {
        display: contents;
      }
    `;
  }
}
