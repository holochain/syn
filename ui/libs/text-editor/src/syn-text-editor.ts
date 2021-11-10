import { html, LitElement, PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { sharedStyles, synContext, synSessionContext } from '@syn/elements';
import { contextProvided } from '@lit-labs/context';
import type { SessionStore, SynStore } from '@syn/store';
import { StoreSubscriber } from 'lit-svelte-stores';
import type Quill from 'quill';
import type { Sources } from 'quill';
import { QuillSnow } from '@scoped-elements/quill';
import QuillCursors from 'quill-cursors';

import { quillDeltasToTextEditorDelta } from './utils';
import type { TextEditorDelta } from './text-editor-delta';

export class SynTextEditor<CONTENT> extends ScopedElementsMixin(LitElement) {
  @property({ attribute: 'content-path' })
  contentPath: string | undefined;

  @property({ attribute: 'debounce-ms' })
  debounceMs: number = 200;

  @contextProvided({ context: synContext, multiple: true })
  @state()
  synStore!: SynStore<CONTENT, any>;

  @contextProvided({ context: synSessionContext, multiple: true })
  @state()
  sessionStore!: SessionStore<CONTENT, any>;

  _content = new StoreSubscriber(this, () => this.sessionStore?.content);
  _ephemeral = new StoreSubscriber(this, () => this.sessionStore?.ephemeral);

  _deltasNotEmmitted: TextEditorDelta[] = [];
  _cursorPosition: number | undefined = 0;

  firstUpdated() {
    setInterval(() => this.emitDeltas(), this.debounceMs);

    setTimeout(() => {
      this.quill.on('selection-change', (range, _oldRange, source) => {
        console.log('hey', source, _oldRange, range);
        if (source !== 'user' || !range) return;

        this.dispatchEvent(
          new CustomEvent('changes-requested', {
            detail: {
              ephemeral: {
                [this.synStore.myPubKey]: range.index,
              },
            },
            bubbles: true,
            composed: true,
          })
        );
      });
    });
  }

  onTextChanged(deltas: any, source: Sources) {
    if (source !== 'user') return;

    const ops = deltas.ops;
    if (!ops || ops.length === 0) return;

    const delta = quillDeltasToTextEditorDelta(ops);
    this._deltasNotEmmitted.push(delta);
  }

  emitDeltas() {
    if (this._deltasNotEmmitted.length > 0) {
      this.dispatchEvent(
        new CustomEvent('changes-requested', {
          detail: {
            deltas: this._deltasNotEmmitted,
            ephemeral: {
              [this.synStore.myPubKey]: this._cursorPosition,
            }
          },
          bubbles: true,
          composed: true,
        })
      );
      this._deltasNotEmmitted = [];
    }
  }

  get quill(): Quill {
    return (this.shadowRoot?.getElementById('editor') as QuillSnow)?.quill;
  }

  updated(changedValues: PropertyValues) {
    super.updated(changedValues);

    if (this.quill) {
      this.updateQuill();
    }
  }

  updateQuill() {
    if (this.getContent()) {
      this.quill.setText(this.getContent());
    }
    if (this._ephemeral.value) {
      console.log('eph', this._ephemeral.value);
      const cursors = this.quill.getModule('cursors');

      for (const [agentPubKey, position] of Object.entries(
        this._ephemeral.value
      )) {
        const range = {
          index: position,
          length: 0,
        };
        cursors.createCursor({
          id: agentPubKey,
          name: '',
          range,
        });
        cursors.moveCursor(agentPubKey, range);
      }
    }
  }

  getContent(): string {
    let content = this._content.value;
    if (!this.contentPath) return content as unknown as string;

    const components = this.contentPath.split('.');
    for (const component of components) {
      if (!Object.keys(content).includes(component))
        throw new Error('Could not find object with content-path');
      content = content[component];
    }
    return content as any;
  }

  render() {
    return html`<quill-snow
      style="flex: 1;"
      id="editor"
      .modules=${{ 'modules/cursors': QuillCursors }}
      .options=${{
        placeholder: 'Write your note...',
        modules: {
          cursors: true,
        },
      }}
      @text-change=${e => this.onTextChanged(e.detail.delta, e.detail.source)}
    ></quill-snow>`;
  }

  static get scopedElements() {
    return {
      'quill-snow': QuillSnow,
    };
  }

  static styles = [sharedStyles];
}
