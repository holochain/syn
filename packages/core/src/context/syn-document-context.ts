import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { contextProvider } from '@lit-labs/context';

import { synDocumentContext } from './contexts';
import { DocumentStore } from '@holochain-syn/store';

export class SynDocumentContext extends ScopedElementsMixin(LitElement) {
  @contextProvider({ context: synDocumentContext })
  @property()
  documentstore!: DocumentStore<any>;

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
