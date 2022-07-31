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
  position: string;
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
    let finalCursorPosition = (state as any).getElemId(delta.position);

    ephemeral[author] = {
      position: finalCursorPosition,
      characterCount: 0,
    };

    if (delta.type === TextEditorDeltaType.Insert) {
      state.insertAt!(delta.position, ...delta.text);
    } else if (delta.type === TextEditorDeltaType.Delete) {
      state.deleteAt!(delta.position, delta.characterCount);
    } else if (delta.type === TextEditorDeltaType.ChangeSelection) {
      ephemeral[author].characterCount = delta.characterCount;
    }
  },
};
