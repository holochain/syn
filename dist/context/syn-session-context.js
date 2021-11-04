var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { contextProvided, ContextProvider } from '@lit-labs/context';
import { synSessionContext, synContext } from './contexts';
export class SynSessionContext extends ScopedElementsMixin(LitElement) {
    connectedCallback() {
        super.connectedCallback();
        this.provider = new ContextProvider(this, synSessionContext, this.synStore.sessionStore(this.sessionHash));
    }
    update(changedValues) {
        super.update(changedValues);
        if (changedValues.has('sessionHash')) {
            this.provider.setValue(this.synStore.sessionStore(this.sessionHash));
        }
    }
    render() {
        return html `<slot></slot>`;
    }
    static get styles() {
        return css `
      :host {
        display: contents;
      }
    `;
    }
}
__decorate([
    property({ attribute: 'session-hash' })
], SynSessionContext.prototype, "sessionHash", void 0);
__decorate([
    contextProvided({ context: synContext, multiple: true }),
    state()
], SynSessionContext.prototype, "synStore", void 0);
//# sourceMappingURL=syn-session-context.js.map