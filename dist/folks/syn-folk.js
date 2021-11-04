var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { classMap } from 'lit/directives/class-map.js';
import { CSSifyHSL, getFolkColors } from '../utils/colors';
export class SynFolk extends ScopedElementsMixin(LitElement) {
    constructor() {
        super(...arguments);
        this.inSession = false;
        this.isScribe = false;
    }
    render() {
        const colors = getFolkColors(this.pubKey);
        return html `
      <div class=${classMap({ 'scribe-wrapper': this.isScribe })}>
        <div
          class="folk ${classMap({
            scribe: this.isScribe,
            'out-of-session': !this.inSession,
        })}"
          style=${styleMap({
            'background-color': CSSifyHSL(colors.primary),
        })}
        >
          <div
            class="folk-color"
            style=${styleMap({
            'background-color': CSSifyHSL(colors.hexagon),
        })}
          ></div>
          ${this.pubKey.slice(-4)}
        </div>
        ${this.isScribe ? html ` <div class="scribe-halo"></div> ` : html ``}
      </div>
    `;
    }
    static get styles() {
        return css `
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
__decorate([
    property()
], SynFolk.prototype, "pubKey", void 0);
__decorate([
    property({ attribute: 'in-session' })
], SynFolk.prototype, "inSession", void 0);
__decorate([
    property({ attribute: 'is-scribe' })
], SynFolk.prototype, "isScribe", void 0);
//# sourceMappingURL=syn-folk.js.map