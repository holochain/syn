import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { css, html, LitElement, PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import type { SessionStore, SynStore } from '@syn/store';
import { provide } from '@lit-labs/context';
import { StoreController } from 'lit-svelte-stores';

import { synContext } from './contexts';
import { SynSession } from './syn-session';

/**
 * Context provider element to serve as a container for all the
 * other syn elements
 */
export class SynContext extends ScopedElementsMixin(LitElement) {
  @property()
  store!: SynStore<any, any>;

  _activeSession!: StoreController<SessionStore<any, any> | undefined>;

  updated(cv: PropertyValues) {
    super.updated(cv);
    if (cv.has('store')) {
      this._activeSession = new StoreController(this, this.store.activeSession);
    }
  }

  render() {
    return html`
      <syn-session
        .sessionHash=${this._activeSession?.value?.hash}
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
