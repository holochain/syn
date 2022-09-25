import { html, LitElement, PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { CodemirrorMarkdown } from '@scoped-elements/codemirror';
import {
  Profile,
  ProfilesStore,
  profilesStoreContext,
} from '@holochain-open-dev/profiles';
import {
  sharedStyles,
  synContext,
  getFolkColors,
  SynStore,
  SliceStore,
} from '@holochain-syn/core';
import { contextProvided } from '@lit-labs/context';
import { StoreSubscriber, TaskSubscriber } from 'lit-svelte-stores';
import {
  AgentPubKeyMap,
  deserializeHash,
  serializeHash,
} from '@holochain-open-dev/utils';

import { TextEditorDeltaType, TextEditorGrammar } from './grammar';
import { elemIdToPosition } from './utils';

export class SynMarkdownEditor extends ScopedElementsMixin(LitElement) {
  @property({ type: Object })
  slice!: SliceStore<TextEditorGrammar>;

  @property({ attribute: 'debounce-ms' })
  debounceMs: number = 1000;

  @contextProvided({ context: synContext, subscribe: true })
  @property()
  synStore!: SynStore;

  @contextProvided({ context: profilesStoreContext, subscribe: true })
  @state()
  profilesStore!: ProfilesStore;

  _state = new StoreSubscriber(this, () => this.slice.state);
  _cursors = new StoreSubscriber(this, () => this.slice.ephemeral);
  _peersProfiles: AgentPubKeyMap<TaskSubscriber<[], Profile | undefined>> =
    new AgentPubKeyMap();

  _lastCursorPosition = 0;
  _cursorPosition = 0;

  updated(cv: PropertyValues) {
    super.updated(cv);
    if (cv.has('slice') && this.slice) {
      this.slice.worskpace.participants.subscribe(participants => {
        const allFolksPubKey = [...participants.active, ...participants.idle];

        const unknownPeers = allFolksPubKey.filter(
          pubKey => !this._peersProfiles.has(pubKey)
        );

        for (const peer of unknownPeers) {
          this._peersProfiles.put(
            peer,
            new TaskSubscriber(this, () =>
              this.profilesStore.fetchAgentProfile(peer)
            )
          );
        }
      });
    }
  }

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
    const myPubKey = serializeHash(this.synStore.myPubKey);
    if (!this._cursors.value) return [];
    return Object.entries(this._cursors.value)
      .filter(([pubKey, _]) => pubKey !== myPubKey)
      .map(([agentPubKey, position]) => {
        const { r, g, b } = getFolkColors(agentPubKey);

        const name = this._peersProfiles.get(deserializeHash(agentPubKey))
          ?.value?.nickname;
        return {
          position: elemIdToPosition(
            position.left,
            position.position,
            this._state.value.text
          ),
          color: `${r} ${g} ${b}`,
          name: name || 'Loading...',
        };
      });
  }

  render() {
    if (this._state.value === undefined) return html``;

    const mySelection =
      this._cursors.value[serializeHash(this.synStore.myPubKey)];

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
      <div
        class="flex-scrollable-parent"
        style="background-color: rgb(40, 44, 52);"
      >
        <div class="flex-scrollable-container">
          <div class="flex-scrollable-y">
            <codemirror-markdown
              style="flex: 1; "
              id="editor"
              .state=${{
                text: this._state.value.text.toString(),
                selection,
              }}
              .additionalCursors=${this.remoteCursors()}
              @text-inserted=${e =>
                this.onTextInserted(e.detail.from, e.detail.text)}
              @text-deleted=${e =>
                this.onTextDeleted(e.detail.from, e.detail.characterCount)}
              @selection-changed=${e =>
                this.onSelectionChanged(e.detail.ranges)}
            ></codemirror-markdown>
          </div>
        </div>
      </div>
    `;
  }

  static styles = [sharedStyles];

  static get scopedElements() {
    return {
      'codemirror-markdown': CodemirrorMarkdown,
    };
  }
}
