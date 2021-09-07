import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import type { SynStore } from '@syn/store';
import { provide } from '@lit-labs/context';
import { DynamicStore } from 'lit-svelte-stores';

import { synContext } from './contexts';
import { SynSession } from './syn-session';

/**
 * Context provider element to serve as a container for all the
 * other syn elements
 */
export class SynContext extends ScopedElementsMixin(LitElement) {
  @property()
  store!: SynStore<any, any>;

  _activeSession = new DynamicStore(this, () => this.store.activeSession);

  render() {
    return html`
      <syn-session
        .sessionHash=${this._activeSession.value?.sessionHash}
        ${provide(synContext, this.store)}
      >
        <slot></slot>
      </syn-session>
    `;
  }

  static get styles() {
    return css`
      :host {
        display: contents;
      }
    `;
  }

  static get scopedElements() {
    return {
      'syn-session': SynSession,
    };
  }
}
