var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { sharedStyles, synSessionContext } from '@syn/elements';
import { contextProvided } from '@lit-labs/context';
import { StoreSubscriber } from 'lit-svelte-stores';
import { QuillSnow } from '@scoped-elements/quill';
import { quillDeltasToTextEditorDelta } from './utils';
export class SynTextEditor extends ScopedElementsMixin(LitElement) {
    constructor() {
        super(...arguments);
        this.contentPath = '';
        this._content = new StoreSubscriber(this, () => { var _a; return (_a = this.sessionStore) === null || _a === void 0 ? void 0 : _a.content; });
    }
    onTextChanged(deltas, source) {
        console.log(deltas);
        if (source !== 'user')
            return;
        const ops = deltas.ops;
        if (!ops || ops.length === 0)
            return;
        const delta = quillDeltasToTextEditorDelta(ops);
        this.dispatchEvent(new CustomEvent('change-requested', {
            detail: {
                delta,
            },
            bubbles: true,
            composed: true,
        }));
    }
    get quill() {
        var _a, _b;
        return (_b = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.getElementById('editor')) === null || _b === void 0 ? void 0 : _b.quill;
    }
    updated(changedValues) {
        super.updated(changedValues);
        if (this.quill)
            this.quill.setText(this.getContent());
    }
    getContent() {
        let content = this._content.value;
        const components = this.contentPath.split('.');
        for (const component of components) {
            if (!Object.keys(content).includes(component))
                throw new Error('Could not find object with content-path');
            content = content[component];
        }
        return content;
    }
    render() {
        return html `<quill-snow
      id="editor"
      @text-change=${e => this.onTextChanged(e.detail.delta, e.detail.source)}
    ></quill-snow>`;
    }
    static get scopedElements() {
        return {
            'quill-snow': QuillSnow,
        };
    }
}
SynTextEditor.styles = [sharedStyles];
__decorate([
    property({ attribute: 'content-path' })
], SynTextEditor.prototype, "contentPath", void 0);
__decorate([
    contextProvided({ context: synSessionContext }),
    state()
], SynTextEditor.prototype, "sessionStore", void 0);
//# sourceMappingURL=syn-text-editor.js.map