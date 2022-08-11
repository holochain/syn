import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import type { SynStore } from '@holochain-syn/store';
import { contextProvider } from '@lit-labs/context';

import { synContext } from './contexts';

/**
 * Context provider element to serve as a container for all the
 * other syn elements
 */
export class SynContext extends ScopedElementsMixin(LitElement) {
  @contextProvider({ context: synContext })
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
