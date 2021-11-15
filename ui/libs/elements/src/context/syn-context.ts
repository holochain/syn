import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { css, html, LitElement, PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import type { SynStore } from '@syn/store';
import { Context, ContextProvider } from '@lit-labs/context';
import { StoreSubscriber } from 'lit-svelte-stores';

import { synContext } from './contexts';
import { SynSessionContext } from './syn-session-context';

/**
 * Context provider element to serve as a container for all the
 * other syn elements
 */
export class SynContext extends ScopedElementsMixin(LitElement) {
  @property()
  store!: SynStore<any>;

  _activeSession = new StoreSubscriber(this, () => this.store.activeSession);

  provider!: ContextProvider<Context<SynStore<any> | undefined>>;

  connectedCallback() {
    super.connectedCallback();
    this.provider = new ContextProvider(this, synContext, this.store);
  }

  update(changedValues: PropertyValues) {
    super.update(changedValues);
    if (changedValues.has('store')) {
      this.provider.setValue(this.store);
    }
  }
  
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
