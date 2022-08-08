import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { css, html, LitElement, PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { SynStore } from '@holochain-syn/store';
import { contextProvided, ContextProvider } from '@lit-labs/context';

import { synWorkspaceContext, synContext } from './contexts';
import { EntryHash } from '@holochain/client';

export class SynWorkspaceContext extends ScopedElementsMixin(LitElement) {
  @property({ type: Object })
  workspaceHash!: EntryHash;

  @contextProvided({ context: synContext, subscribe: true })
  @state()
  synStore!: SynStore;

  provider!: ContextProvider<typeof synWorkspaceContext>;

  connectedCallback() {
    super.connectedCallback();

    this.provider = new ContextProvider(
      this,
      synWorkspaceContext,
      this.sessionHash
        ? this.synStore.sessionStore(this.sessionHash)
        : undefined
    );
  }

  update(changedValues: PropertyValues) {
    super.update(changedValues);
    if (changedValues.has('sessionHash')) {
      this.provider.setValue(
        this.sessionHash
          ? this.synStore.sessionStore(this.sessionHash)
          : undefined
      );
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
