import { html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { CodemirrorMarkdown } from '@scoped-elements/codemirror';
import {
  ProfilesStore,
  profilesStoreContext,
} from '@holochain-open-dev/profiles';
import {
  sharedStyles,
  synContext,
  synSessionContext,
  getFolkColors,
} from '@syn/elements';
import { contextProvided } from '@lit-labs/context';
import type { SessionStore, SynStore } from '@syn/store';
import { StoreSubscriber } from 'lit-svelte-stores';

import { TextEditorDelta, TextEditorDeltaType } from './text-editor-delta';

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

  @contextProvided({ context: profilesStoreContext, multiple: true })
  @state()
  profilesStore!: ProfilesStore;

  _content = new StoreSubscriber(this, () => this.sessionStore?.content);
  _ephemeral = new StoreSubscriber(this, () => this.sessionStore?.ephemeral);
  _allProfiles = new StoreSubscriber(
    this,
    () => this.profilesStore?.knownProfiles
  );

  _deltasNotEmmitted: TextEditorDelta[] = [];
  _cursorPosition: number | undefined = 0;

  firstUpdated() {
    setInterval(() => this.emitDeltas(), this.debounceMs);
  }

  emitDeltas() {
    if (this._deltasNotEmmitted.length > 0) {
      this.dispatchEvent(
        new CustomEvent('changes-requested', {
          detail: {
            deltas: this._deltasNotEmmitted,
            ephemeral: {
              [this.synStore.myPubKey]: this._cursorPosition,
            },
          },
          bubbles: true,
          composed: true,
        })
      );
      this._deltasNotEmmitted = [];
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

  onTextInserted(from: number, text: string) {
    this._deltasNotEmmitted.push({
      type: TextEditorDeltaType.Insert,
      text: text,
      position: from,
    });
  }

  onTextDeleted(from: number, characterCount: number) {
    this._deltasNotEmmitted.push({
      type: TextEditorDeltaType.Delete,
      position: from,
      characterCount
    });
  }

  onSelectionChanged(ranges: Array<{ from: number; to: number }>) {
    this._cursorPosition = ranges[0].to;
  }

  remoteCursors() {
    if (!this._ephemeral.value) return [];
    return Object.entries(this._ephemeral.value as any)
      .filter(([pubKey, _]) => pubKey !== this.synStore.myPubKey)
      .map(([agentPubKey, position]) => {
        const { r, g, b } = getFolkColors(agentPubKey);

        const name = this._allProfiles.value[agentPubKey].nickname;
        return {
          position,
          color: `${r} ${g} ${b}`,
          name: name || 'Loading...',
        };
      });
  }

  render() {
    return html`<codemirror-markdown
      style="flex: 1;"
      id="editor"
      .text=${this._content.value}
      .additionalCursors=${this.remoteCursors()}
      @text-inserted=${e => this.onTextInserted(e.detail.from, e.detail.text)}
      @text-deleted=${e => this.onTextDeleted(e.detail.from, e.detail.characterCount)}
      @selection-changed=${e => this.onSelectionChanged(e.detail.ranges)}
    ></codemirror-markdown>`;
  }

  static styles = [sharedStyles];

  static get scopedElements() {
    return {
      'codemirror-markdown': CodemirrorMarkdown,
    };
  }
}
