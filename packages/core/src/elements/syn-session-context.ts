import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { SessionStore } from '@holochain-syn/store';
import { provide } from '@lit/context';

import { synSessionContext } from '../contexts.js';

@customElement('syn-session-context')
export class SynSessionContext extends LitElement {
  @provide({ context: synSessionContext })
  @property()
  sessionstore!: SessionStore<any, any>;

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
