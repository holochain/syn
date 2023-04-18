import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@scoped-elements/codemirror';
import {
  ProfilesStore,
  profilesStoreContext,
} from '@holochain-open-dev/profiles';
import { getFolkColors, SliceStore } from '@holochain-syn/core';
import { consume } from '@lit-labs/context';
import { StoreSubscriber } from 'lit-svelte-stores';

import { TextEditorDeltaType, TextEditorGrammar } from '../grammar.js';
import { elemIdToPosition } from '../utils.js';
import {
  AgentPubKey,
  decodeHashFromBase64,
  encodeHashToBase64,
} from '@holochain/client';
import { LazyHoloHashMap } from '@holochain-open-dev/utils';
import { msg } from '@lit/localize';
import { sharedStyles } from '@holochain-open-dev/elements';

@customElement('syn-markdown-editor')
export class SynMarkdownEditor extends LitElement {
  @property({ type: Object })
  slice!: SliceStore<TextEditorGrammar>;

  @property({ attribute: 'debounce-ms' })
  debounceMs: number = 1000;

  @consume({ context: profilesStoreContext, subscribe: true })
  @state()
  profilesStore!: ProfilesStore;

  _state = new StoreSubscriber(this, () => this.slice.state);
  _cursors = new StoreSubscriber(this, () => this.slice.ephemeral);
  _peersProfiles = new LazyHoloHashMap(
    (peer: AgentPubKey) =>
      new StoreSubscriber(this, () => this.profilesStore.profiles.get(peer))
  );

  _lastCursorPosition = 0;
  _cursorPosition = 0;

  onTextInserted(from: number, text: string) {
    this.slice.requestChanges([
      {
        type: TextEditorDeltaType.Insert,
        position: from,
        text: text,
      },
    ]);
  }

  onTextDeleted(from: number, characterCount: number) {
    this.slice.requestChanges([
      {
        type: TextEditorDeltaType.Delete,
        position: from,
        characterCount,
      },
    ]);
  }

  onSelectionChanged(ranges: Array<{ from: number; to: number }>) {
    this.slice.requestChanges([
      {
        type: TextEditorDeltaType.ChangeSelection,
        position: ranges[0].from,
        characterCount: ranges[0].to - ranges[0].from,
      },
    ]);
  }

  remoteCursors() {
    const myPubKey = encodeHashToBase64(this.slice.myPubKey);
    if (!this._cursors.value) return [];
    return Object.entries(this._cursors.value)
      .filter(([pubKey, _]) => pubKey !== myPubKey)
      .map(([agentPubKey, position]) => {
        const { r, g, b } = getFolkColors(agentPubKey);
        const peerProfile = this._peersProfiles.get(
          decodeHashFromBase64(agentPubKey)
        ).value;
        const name =
          peerProfile?.status === 'complete'
            ? peerProfile.value
              ? peerProfile.value.nickname
              : msg('Unknown')
            : msg('Loading...');
        return {
          position: elemIdToPosition(
            position.left,
            position.position,
            this._state.value.text
          ),
          color: `rgb(${r}, ${g}, ${b})`,
          name: name,
        };
      });
  }

  render() {
    if (this._state.value === undefined) return html``;

    const mySelection =
      this._cursors.value[encodeHashToBase64(this.slice.myPubKey)];

    const myPosition =
      mySelection &&
      elemIdToPosition(
        mySelection.left,
        mySelection.position,
        this._state.value.text
      );

    const selection = myPosition
      ? {
          from: myPosition,
          to: myPosition + mySelection.characterCount,
        }
      : undefined;

    return html`
      <codemirror-markdown
        style="flex: 1; background-color: rgb(40, 44, 52);"
        id="editor"
        .state=${{
          text: this._state.value.text.toString(),
          selection,
        }}
        .additionalCursors=${this.remoteCursors()}
        @text-inserted=${e => this.onTextInserted(e.detail.from, e.detail.text)}
        @text-deleted=${e =>
          this.onTextDeleted(e.detail.from, e.detail.characterCount)}
        @selection-changed=${e => this.onSelectionChanged(e.detail.ranges)}
      ></codemirror-markdown>
    `;
  }

  static styles = [
    sharedStyles,
    css`
      :host {
        display: flex;
        flex: 1;
      }
    `,
  ];
}
