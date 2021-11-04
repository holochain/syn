var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { html, LitElement } from 'lit';
import { StoreSubscriber } from 'lit-svelte-stores';
import { state } from 'lit/decorators.js';
import { contextProvided } from '@lit-labs/context';
import { synContext, synSessionContext } from '../context/contexts';
import { SynFolk } from './syn-folk';
import { sharedStyles } from '../shared-styles';
export class SynFolks extends ScopedElementsMixin(LitElement) {
    constructor() {
        super(...arguments);
        this._folks = new StoreSubscriber(this, () => { var _a; return (_a = this.sessionStore) === null || _a === void 0 ? void 0 : _a.folks; });
    }
    render() {
        if (!this.sessionStore || !this._folks.value)
            return html `<span>There is no active session</span>`;
        return html `
      <div class="column">
        <syn-folk .pubKey=${this.syn.myPubKey} in-session></syn-folk>
        ${Object.entries(this._folks.value).map(([pubKey, folk]) => html `<syn-folk
              .pubKey=${pubKey}
              .inSession=${folk.inSession}
              .isScribe=${this.sessionStore.session.scribe === pubKey}
            ></syn-folk>`)}
      </div>
    `;
    }
    static get scopedElements() {
        return {
            'syn-folk': SynFolk,
        };
    }
    static get styles() {
        return sharedStyles;
    }
}
__decorate([
    contextProvided({ context: synContext, multiple: true }),
    state()
], SynFolks.prototype, "syn", void 0);
__decorate([
    contextProvided({ context: synSessionContext, multiple: true }),
    state()
], SynFolks.prototype, "sessionStore", void 0);
//# sourceMappingURL=syn-folks.js.map