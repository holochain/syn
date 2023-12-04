import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { provide } from '@lit/context';

import { DocumentStore } from '@holochain-syn/store';

import { synDocumentContext } from '../contexts.js';

@customElement('syn-document-context')
export class SynDocumentContext extends LitElement {
  @provide({ context: synDocumentContext })
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
