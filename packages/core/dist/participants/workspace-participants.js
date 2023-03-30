var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { css, html, LitElement } from 'lit';
import { StoreSubscriber } from 'lit-svelte-stores';
import { property } from 'lit/decorators.js';
import { contextProvided } from '@lit-labs/context';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { AgentAvatar } from '@holochain-open-dev/profiles';
import { synWorkspaceContext } from '../context/contexts';
import { sharedStyles } from '../shared-styles';
export class WorkspaceParticipants extends ScopedElementsMixin(LitElement) {
    constructor() {
        super(...arguments);
        this.direction = 'column';
        this._participants = new StoreSubscriber(this, () => this.workspacestore.participants);
    }
    renderParticipant(pubKey, idle) {
        return html `
      <agent-avatar
        class="${classMap({
            'out-of-session': idle,
        })}"
        .agentPubKey=${pubKey}
        style=${styleMap({
            'margin-bottom': this.direction === 'column' ? '8px' : '0px',
            'margin-right': this.direction === 'row' ? '8px' : '0px',
        })}
      ></agent-avatar>
    `;
    }
    render() {
        return html `
      <div
        class=${classMap({
            column: this.direction === 'column',
            row: this.direction === 'row',
        })}
      >
        ${this._participants.value.active.map(pubKey => this.renderParticipant(pubKey, false))}
        ${this._participants.value.idle.map(pubKey => this.renderParticipant(pubKey, true))}
      </div>
    `;
    }
    static get scopedElements() {
        return {
            'agent-avatar': AgentAvatar,
        };
    }
    static get styles() {
        return [
            sharedStyles,
            css `
        .out-of-session {
          opacity: 0.5;
        }
      `,
        ];
    }
}
__decorate([
    contextProvided({ context: synWorkspaceContext, subscribe: true }),
    property()
], WorkspaceParticipants.prototype, "workspacestore", void 0);
__decorate([
    property()
], WorkspaceParticipants.prototype, "direction", void 0);
//# sourceMappingURL=workspace-participants.js.map