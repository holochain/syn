import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { SynStore } from '@holochain-syn/store';
import { provide } from '@lit/context';

import { synContext } from '../contexts.js';

/**
 * Context provider element to serve as a container for all the
 * other syn elements
 */
@customElement('syn-context')
export class SynContext extends LitElement {
  @provide({ context: synContext })
  @property()
  store!: SynStore;

  render() {
    return html` <slot></slot> `;
  }

  static get styles() {
    return css`
      :host {
        display: contents;
      }
    `;
  }
}
