import { html, LitElement, PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { sharedStyles, synSessionContext } from '@syn/elements';
import { contextProvided } from '@lit-labs/context';
import type { SessionStore } from '@syn/store';
import { StoreSubscriber } from 'lit-svelte-stores';
import type Quill from 'quill';
import type { Sources } from 'quill';
import { QuillSnow } from '@scoped-elements/quill';

import { quillDeltasToTextEditorDelta } from './utils';

export class SynTextEditor<CONTENT> extends ScopedElementsMixin(LitElement) {
  @property({ attribute: 'content-path' })
  contentPath: string = '';

  @contextProvided({ context: synSessionContext })
  @state()
  sessionStore!: SessionStore<CONTENT, any>;

  _content = new StoreSubscriber(this, () => this.sessionStore?.content);

  onTextChanged(deltas: any, source: Sources) {
    if (source !== 'user') return;

    const ops = deltas.ops;
    if (!ops || ops.length === 0) return;

    const delta = quillDeltasToTextEditorDelta(ops);
    this.dispatchEvent(
      new CustomEvent('change-requested', {
        detail: {
          delta,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  get quill(): Quill {
    return (this.shadowRoot?.getElementById('editor') as QuillSnow)?.quill;
  }

  updated(changedValues: PropertyValues) {
    super.updated(changedValues);

    this.quill.setText(this.getContent());
  }

  getContent(): string {
    let content = this._content.value;
    const components = this.contentPath.split('.');

    for (const component of components) {
      if (!content[component])
        throw new Error('Could not find object with content-path');
      content = content[component];
    }
    return content as any;
  }

  render() {
    return html`<quill-snow
      id="editor"
      @text-changed=${e => this.onTextChanged(e.detail.deltas, e.detail.source)}
    ></quill-snow>`;
  }

  static get scopedElements() {
    return {
      'quill-snow': QuillSnow,
    };
  }

  static styles = [sharedStyles];
}
