import { html, LitElement, PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { sharedStyles, synSessionContext } from '@syn/elements';
import { contextProvided } from '@lit-labs/context';
import type { SessionStore } from '@syn/store';
import Quill from 'quill';
import { StoreSubscriber } from 'lit-svelte-stores';
import { derived, readable } from 'svelte/store';

export class SynTextEditor<CONTENT> extends ScopedElementsMixin(LitElement) {
  @property()
  selectContent: (c: CONTENT) => string = c => c as unknown as string;

  @contextProvided({ context: synSessionContext })
  @state()
  sessionStore!: SessionStore<CONTENT, any>;

  _content = new StoreSubscriber(this, () =>
    this.sessionStore
      ? derived(this.sessionStore.content, c => this.selectContent(c))
      : readable('')
  );

  _quill!: Quill;

  firstUpdated() {
    this._quill = new Quill(
      this.shadowRoot?.getElementById('editor') as Element,
      {
        modules: {},
        theme: 'snow',
      }
    );
  }

  updated(changedValues: PropertyValues) {
    super.updated(changedValues);

    this._quill.setText(this._content.value);
  }

  render() {
    return html`<div id="editor"></div>`;
  }

  static styles = [sharedStyles];
}
