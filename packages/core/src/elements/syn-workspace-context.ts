import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { WorkspaceStore } from '@holochain-syn/store';
import { provide } from '@lit/context';

import { synWorkspaceContext } from '../contexts.js';

@customElement('syn-workspace-context')
export class SynWorkspaceContext extends LitElement {
  @provide({ context: synWorkspaceContext })
  @property()
  workspacestore!: WorkspaceStore<any, any>;

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
