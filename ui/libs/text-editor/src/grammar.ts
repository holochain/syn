import type {
  AgentPubKeyB64,
  Dictionary,
} from '@holochain-open-dev/core-types';
import type { SynGrammar } from '@holochain-syn/store';
import Automerge from 'automerge';

export enum TextEditorDeltaType {
  Insert = 'insert',
  Delete = 'delete',
  ChangeSelection = 'change_selection',
}

export type TextEditorDelta =
  | {
      type: TextEditorDeltaType.Insert;
      text: string;
      position: number;
    }
  | {
      type: TextEditorDeltaType.Delete;
      position: number;
      characterCount: number;
    }
  | {
      type: TextEditorDeltaType.ChangeSelection;
      position: number;
      characterCount: number;
    };

export interface AgentSelection {
  position: Automerge.Counter;
  characterCount: number;
}

export type TextEditorState = Automerge.Text;
export type TextEditorEphemeralState = Dictionary<AgentSelection>;

export type TextEditorGrammar = SynGrammar<
  TextEditorState,
  TextEditorDelta,
  TextEditorEphemeralState
>;

export const textEditorGrammar: TextEditorGrammar = {
  initState(doc, _ephemeral) {
    doc.text = new Automerge.Text();
  },
  applyDelta(
    state: TextEditorState,
    delta: TextEditorDelta,
    ephemeral: TextEditorEphemeralState,
    author: AgentPubKeyB64
  ) {
    let finalCursorPosition;

    if (!ephemeral[author]) {
      ephemeral[author] = {
        position: new Automerge.Counter(),
        characterCount: 0,
      };
    }

    if (delta.type === TextEditorDeltaType.Insert) {
      state.insertAt!(delta.position, ...delta.text);

      finalCursorPosition = delta.position + delta.text.length;
      ephemeral[author].characterCount = 0;

      for (const [agentPubKey, counter] of Object.entries(ephemeral)) {
        if (agentPubKey !== author && delta.position < counter.position.value) {
          counter.position.increment(delta.text.length);
        }
      }
    } else if (delta.type === TextEditorDeltaType.Delete) {
      state.deleteAt!(delta.position, delta.characterCount);

      ephemeral[author].characterCount = 0;
      finalCursorPosition = delta.position;

      for (const [agentPubKey, counter] of Object.entries(ephemeral)) {
        if (agentPubKey !== author && delta.position < counter.position.value) {
          counter.position.decrement(delta.characterCount);
        }
      }
    } else if (delta.type === TextEditorDeltaType.ChangeSelection) {
      ephemeral[author].characterCount = delta.characterCount;

      finalCursorPosition = delta.position;
    }

    const cursorDelta = finalCursorPosition - ephemeral[author].position.value;

    if (cursorDelta > 0) {
      ephemeral[author].position.increment(cursorDelta);
    } else {
      ephemeral[author].position.decrement(cursorDelta);
    }
  },
};
