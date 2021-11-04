var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { ContextProvider } from '@lit-labs/context';
import { StoreSubscriber } from 'lit-svelte-stores';
import { synContext } from './contexts';
import { SynSessionContext } from './syn-session-context';
/**
 * Context provider element to serve as a container for all the
 * other syn elements
 */
export class SynContext extends ScopedElementsMixin(LitElement) {
    constructor() {
        super(...arguments);
        this._activeSession = new StoreSubscriber(this, () => this.store.activeSession);
    }
    connectedCallback() {
        super.connectedCallback();
        this.provider = new ContextProvider(this, synContext, this.store);
    }
    update(changedValues) {
        super.update(changedValues);
        if (changedValues.has('store')) {
            this.provider.setValue(this.store);
        }
    }
    render() {
        var _a;
        return html `
      <syn-session-context
        .sessionHash=${(_a = this._activeSession.value) === null || _a === void 0 ? void 0 : _a.sessionHash}
      >
      <slot></slot>
      </syn-session-context>
    `;
    }
    static get styles() {
        return css `
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
__decorate([
    property()
], SynContext.prototype, "store", void 0);
//# sourceMappingURL=syn-context.js.map