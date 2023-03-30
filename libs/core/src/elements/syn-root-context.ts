import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { RootStore } from '@holochain-syn/store';
import { synRootContext } from '../contexts';
import { provide } from '@lit-labs/context';

@customElement('syn-root-context')
export class SynRootContext extends LitElement {
  @provide({ context: synRootContext })
  @property()
  rootstore!: RootStore<any>;

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
