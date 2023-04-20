import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SliceStore } from '@holochain-syn/core';
import '@vanillawc/wc-codemirror/index.js';

import {
  AgentSelection,
  TextEditorDeltaType,
  TextEditorGrammar,
} from '../grammar.js';
import { elemIdToPosition } from '../utils.js';
import {
  AgentPubKey,
  decodeHashFromBase64,
  encodeHashToBase64,
} from '@holochain/client';
import { sharedStyles } from '@holochain-open-dev/elements';
import { derived, StoreSubscriber } from '@holochain-open-dev/stores';
import { styleMap } from 'lit/directives/style-map.js';
import './agent-cursor.js';

@customElement('syn-markdown-editor')
export class SynMarkdownEditor extends LitElement {
  @property({ type: Object })
  slice!: SliceStore<TextEditorGrammar>;

  _state = new StoreSubscriber(
    this,
    () => this.slice.state,
    () => [this.slice]
  );

  _cursors = new StoreSubscriber(
    this,
    () => this.slice.ephemeral,
    () => [this.slice]
  );

  _lastCursorPosition = 0;
  _cursorPosition = 0;

  editor: any;

  get editorEl() {
    return this.shadowRoot?.getElementById('editor')! as any;
  }

  firstUpdated() {
    this.editor = this.editorEl.editor;

    derived([this.slice.state, this.slice.ephemeral], i => i).subscribe(
      ([state, cursors]) => {
        console.log(state.text, 'ss');
        const stateText = state.text.toString();
        const myAgentSelection =
          cursors[encodeHashToBase64(this.slice.myPubKey)];

        if (this.editor.doc.getValue() !== stateText) {
          this.editor.doc.setValue(stateText);
        }
        if (myAgentSelection) {
          if (state.text.toString().length > 0) {
            const position = elemIdToPosition(
              myAgentSelection.left,
              myAgentSelection.position,
              state.text
            )!;

            this.editor.doc.setSelection(
              this.editor.posFromIndex(position),
              this.editor.posFromIndex(
                position + myAgentSelection.characterCount
              )
            );
          } else {
            this.editor.doc.setSelection(
              this.editor.posFromIndex(0),
              this.editor.posFromIndex(0)
            );
          }
        }
      }
    );

    this.editor.on('beforeChange', (_, e) => {
      if (e.origin === 'setValue') return;
      e.cancel();
      const fromIndex = this.editor.indexFromPos({
        line: e.from.line,
        ch: e.from.ch,
      });
      const toIndex = this.editor.indexFromPos({
        line: e.to.line,
        ch: e.to.ch,
      });
      if (toIndex > fromIndex) {
        this.onTextDeleted(fromIndex, toIndex - fromIndex);
      }

      if (e.text[0] !== '' || e.text.length > 1) {
        this.onTextInserted(
          this.editor.indexFromPos(e.from),
          e.text.join('\n')
        );
      }
    });

    this.editor.on('beforeSelectionChange', (_, e) => {
      if (e.origin !== undefined) {
        const ranges = e.ranges;
        const transformedRanges = ranges.map(r => ({
          from: this.editor.indexFromPos(r.anchor),
          to: this.editor.indexFromPos(r.head),
        }));
        this.onSelectionChanged(transformedRanges);
      }
    });
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

  renderCursor(agent: AgentPubKey, agentSelection: AgentSelection) {
    const position = elemIdToPosition(
      agentSelection.left,
      agentSelection.position,
      this._state.value.text
    )!;
    if (!this.editor) return html``;

    if (this.editorEl.value.length < position) return html``;

    const coords = this.editor.cursorCoords(
      this.editor.posFromIndex(position),
      'local'
    );

    if (!coords) return html``;

    return html`<agent-cursor
      style=${styleMap({
        left: `${coords.left + 30}px`,
        top: `${coords.top}px`,
      })}
      class="cursor"
      .agent=${agent}
    ></agent-cursor>`;
  }

  render() {
    if (this._state.value === undefined) return html``;

    return html`
      <div
        style="position: relative; overflow: auto; flex: 1; background-color: white;"
      >
        <wc-codemirror
          id="editor"
          mode="markdown"
          style="height: auto;"
          viewport-margin="infinity"
        >
        </wc-codemirror>

        ${Object.entries(this._cursors.value)
          .filter(
            ([pubKeyB64, _]) =>
              pubKeyB64 !== encodeHashToBase64(this.slice.myPubKey)
          )
          .map(([pubKeyB64, position]) =>
            this.renderCursor(decodeHashFromBase64(pubKeyB64), position)
          )}
      </div>
    `;
  }

  static styles = [
    sharedStyles,
    css`
      :host {
        display: flex;
        flex: 1;
        position: relative;
      }
      .cursor {
        position: absolute;
      }
    `,
  ];
}
