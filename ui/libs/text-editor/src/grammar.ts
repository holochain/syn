import type {
  AgentPubKeyB64,
  Dictionary,
} from '@holochain-open-dev/core-types';
import type { SynGrammar } from '@holochain-syn/store';
import { Text } from 'automerge';

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
  position: number;
  characterCount: number;
}

export interface TextEditorState {
  text: Text;
  selections: Dictionary<AgentSelection>;
}

export type TextEditorGrammar = SynGrammar<TextEditorState, TextEditorDelta>;

export const textEditorGrammar: TextEditorGrammar = {
  initialState(doc) {
    doc.text = new Text();
  },
  applyDelta(
    state: TextEditorState,
    delta: TextEditorDelta,
    _author: AgentPubKeyB64
  ) {
    if (delta.type === TextEditorDeltaType.Insert) {
      state.text.insertAt!(delta.position, ...delta.text);
    }
  },

  selectPersistedState(state) {
    return {
      text: state.text,
      selections: {},
    };
  },
};