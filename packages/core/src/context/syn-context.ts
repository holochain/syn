import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import type { SynStore } from '@holochain-syn/store';
import { contextProvider } from '@lit-labs/context';
import { StoreSubscriber } from 'lit-svelte-stores';

import { synContext } from './contexts';
import { SynWorkspaceContext } from './syn-workspace-context';

/**
 * Context provider element to serve as a container for all the
 * other syn elements
 */
export class SynContext extends ScopedElementsMixin(LitElement) {
  @contextProvider({ context: synContext })
  @property()
  store!: SynStore;

  _activeSession = new StoreSubscriber(this, () => this.store.activeSession);

  render() {
    return html`
      <syn-session-context
        .sessionHash=${this._activeSession.value?.sessionHash}
      >
        <slot></slot>
      </syn-session-context>
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
      'syn-session-context': SynSessionContext,
    };
  }
}
