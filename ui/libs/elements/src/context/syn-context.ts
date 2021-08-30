import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { css, html, LitElement } from "lit";

/**
 * Context provider element to serve as a container for all the 
 * other syn elements
 */
export class SynContext extends ScopedElementsMixin(LitElement) {


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
