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
import { List, ListItem, Button, CircularProgress, } from '@scoped-elements/material-web';
import { synContext } from '../context/contexts';
import { sharedStyles } from '../shared-styles';
import { SynFolk } from '../folks/syn-folk';
export class SynSessions extends ScopedElementsMixin(LitElement) {
    constructor() {
        super(...arguments);
        this._allSessions = new StoreSubscriber(this, () => this.syn.knownSessions);
        this._joinedSessions = new StoreSubscriber(this, () => this.syn.joinedSessions);
        this._loaded = false;
    }
    async firstUpdated() {
        await this.syn.getAllSessions();
        this._loaded = true;
    }
    async joinSession(sessionHash) {
        // TODO: extract this into its own config
        if (this._joinedSessions.value.length > 0) {
            await this.syn.sessionStore(this._joinedSessions.value[0]).leave();
        }
        await this.syn.joinSession(sessionHash);
    }
    renderSession(sessionHash, session) {
        return html `
      <div class="column" style="align-items: center">
        <div class="row" style="align-items: center; margin-bottom: 4px;">
          <syn-folk .pubKey=${session.scribe} in-session></syn-folk>

          <span style="margin-left: 4px;"
            >${new Date(session.createdAt).toLocaleTimeString([], {
            second: undefined,
        })}</span
          >
        </div>

        ${this._joinedSessions.value.includes(sessionHash)
            ? html `<span class="placeholder">Already Joined</span>`
            : html `
              <mwc-button @click=${() => this.joinSession(sessionHash)}
                >Join</mwc-button
              >
            `}
      </div>
    `;
    }
    render() {
        if (!this._loaded)
            return html `<mwc-circular-progress
        indeterminate
      ></mwc-circular-progress>`;
        return html `
      <mwc-list activatable>
        ${Object.entries(this._allSessions.value).map(([sessionHash, session]) => this.renderSession(sessionHash, session))}
      </mwc-list>
    `;
    }
    static get scopedElements() {
        return {
            'mwc-list': List,
            'mwc-list-item': ListItem,
            'mwc-button': Button,
            'syn-folk': SynFolk,
            'mwc-circular-progress': CircularProgress,
        };
    }
    static get styles() {
        return sharedStyles;
    }
}
__decorate([
    contextProvided({ context: synContext, multiple: true }),
    state()
], SynSessions.prototype, "syn", void 0);
__decorate([
    state()
], SynSessions.prototype, "_loaded", void 0);
//# sourceMappingURL=syn-sessions.js.map