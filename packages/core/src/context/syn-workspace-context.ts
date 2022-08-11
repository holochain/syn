import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import type { WorkspaceStore } from '@holochain-syn/store';
import { contextProvider } from '@lit-labs/context';

import { synWorkspaceContext } from './contexts';

export class SynWorkspaceContext extends ScopedElementsMixin(LitElement) {
  @contextProvider({ context: synWorkspaceContext })
  @property()
  workspaceStore!: WorkspaceStore<any>;

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
