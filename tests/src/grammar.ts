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

export type TextEditorState = {
  text: Automerge.Text;
};

export type TextEditorGrammar = SynGrammar<TextEditorDelta, TextEditorState>;

export const textEditorGrammar: TextEditorGrammar = {
  initState(doc) {
    doc.text = new Automerge.Text();
  },
  applyDelta(delta: TextEditorDelta, state: TextEditorState) {
    if (delta.type === TextEditorDeltaType.Insert) {
      state.text.insertAt!(delta.position, ...delta.text);
    } else if (delta.type === TextEditorDeltaType.Delete) {
      state.text.deleteAt!(delta.position, delta.characterCount);
    }
  },
};
