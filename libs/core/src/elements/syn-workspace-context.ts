import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { WorkspaceStore } from '@holochain-syn/store';
import { provide } from '@lit-labs/context';

import { synWorkspaceContext } from '../contexts';

@customElement('syn-workspace-context')
export class SynWorkspaceContext extends LitElement {
  @provide({ context: synWorkspaceContext })
  @property()
  workspacestore!: WorkspaceStore<any>;

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
