import type { EntryHashB64 } from '@holochain-open-dev/core-types';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import type { SynStore } from '@syn/store';
import { contextProvided, provide } from '@lit-labs/context';

import { synSessionContext, synContext } from './contexts';

export class SynSession extends ScopedElementsMixin(LitElement) {
  @property({ attribute: 'session-hash' })
  sessionHash!: EntryHashB64;

  @contextProvided({ context: synContext, multiple: true })
  synStore!: SynStore<any, any>;

  render() {
    return html`<slot
      ${provide(
        synSessionContext,
        this.synStore?.sessionStore(this.sessionHash)
      )}
    ></slot>`;
  }

  static get styles() {
    return css`
      :host {
        display: contents;
      }
    `;
  }
}
