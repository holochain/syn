import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { contextProvider } from '@lit-labs/context';

import { synRootContext } from './contexts';
import { RootStore } from '@holochain-syn/store';

export class SynRootContext extends ScopedElementsMixin(LitElement) {
  @contextProvider({ context: synRootContext })
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
