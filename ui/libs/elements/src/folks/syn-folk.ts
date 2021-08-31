import type { AgentPubKeyB64 } from '@holochain-open-dev/core-types';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { css, html, LitElement     } from 'lit';
import { property } from 'lit/decorators.js';
import type { SessionFolk } from '@syn/store';
import { styleMap } from 'lit/directives/style-map.js';
import { classMap } from 'lit/directives/class-map.js';

import { CSSifyHSL } from '../utils/colors';

export class SynFolk extends ScopedElementsMixin(LitElement) {
  @property()
  pubKey!: AgentPubKeyB64;

  @property()
  folk!: SessionFolk;

  @property({ attribute: 'is-scribe' })
  isScribe: boolean = false;

  render() {
    return html`
      <div class=${classMap({ 'scribe-wrapper': this.isScribe })}>
        <div
          class=${classMap({
            folk: true,
            scribe: this.isScribe,
            'out-of-session': this.folk.inSession,
          })}
          class="folk scribe"
          class:me
          class:out-of-session="{outOfSession}"
          style=${styleMap({
            'background-color': CSSifyHSL(this.folk.colors.primary),
          })}
        >
          <div
            class="folk-color"
            style=${styleMap({
              'background-color': CSSifyHSL(this.folk.colors.hexagon),
            })}
          ></div>
          ${this.pubKey.slice(-4)}
        </div>
        ${this.isScribe ? html` <div class="scribe-halo"></div> ` : html``}
      </div>
    `;
  }

  static get styles() {
    return css`
      :host {
        --folk-hex-width: 60px;
        --folk-hex-height: calc(var(--folk-hex-width) * 0.8666);
        --hex-border: 4px;
        --scribe-hex-width: calc(var(--folk-hex-width) - 2 * var(--hex-border));
        --scribe-hex-height: calc(
          var(--folk-hex-height) - 2 * var(--hex-border)
        );
        --scribe-scale: 0.8666;
      }
      .folk {
        display: grid;
        width: var(--folk-hex-width);
        height: var(--folk-hex-height);
        clip-path: polygon(
          25% 0%,
          75% 0%,
          100% 50%,
          75% 100%,
          25% 100%,
          0% 50%
        );
        place-items: center;
        color: white;
        text-shadow: 0 0 5px black;
        cursor: pointer;
      }
      .folk-color {
        z-index: -10;
        content: '';
        width: calc(var(--folk-hex-width) - (var(--hex-border)) * 2);
        height: calc(var(--folk-hex-height) - (var(--hex-border)) * 2);
        clip-path: polygon(
          25% 0%,
          75% 0%,
          100% 50%,
          75% 100%,
          25% 100%,
          0% 50%
        );
        position: absolute;
      }

      .scribe-wrapper {
        display: grid;
        position: relative;
        place-items: center;
      }
      .scribe-halo {
        width: var(--folk-hex-width);
        height: var(--folk-hex-height);
        /* https://www.desmos.com/calculator/bgt97otugr */
        clip-path: polygon(
          25%0%,
          75%0%,
          100%50%,
          75%100%,
          25%100%,
          12.5% 75%,
          calc(12.5% + 1.732px) calc(75% - 1px),
          calc(25% + 1.15px) calc(100% - 2px),
          50% calc(100% - 2px),
          50% 100%,
          75% 100%,
          87.5% 75%,
          calc(87.5% - 1.732px) calc(75% - 1px),
          calc(100% - 2.31px) 50%,
          calc(87.5% - 1.732px) calc(25% + 1px),
          87.5% 25%,
          75%0%,
          50%0%,
          50% calc(0% + 2px),
          calc(25% + 1.15px) calc(0% + 2px),
          calc(12.5% + 1.732px) calc(25% + 1px),
          12.5% 25%
        );
        background-color: hsl(0, 0%, 10%);
        position: absolute;
      }
      .scribe {
        margin: var(--hex-border) 0;
        scale: var(--scribe-scale);
      }

      .out-of-session {
        /* folk hex outline */
        background-color: goldenrod !important;
      }
      .out-of-session div {
        /* folk-color */
        background-color: goldenrodyellow !important;
        /* FIXME: this should grey out the hex instead of make it yellow :)*/
      }
    `;
  }
}
