import { serializeHash } from '@holochain-open-dev/utils';
import type { SynGrammar } from '@holochain-syn/store';
import { AgentPubKey } from '@holochain/client';
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
export type TextEditorEphemeralState = { [key: string]: AgentSelection };

export type TextEditorGrammar = SynGrammar<
  TextEditorDelta,
  TextEditorState,
  TextEditorEphemeralState
>;

export const textEditorGrammar: TextEditorGrammar = {
  initState(doc) {
    doc.text = new Automerge.Text();
  },
  applyDelta(
    delta: TextEditorDelta,
    state: TextEditorState,
    ephemeral: TextEditorEphemeralState,
    author: AgentPubKey
  ) {
    let finalCursorPosition = delta.position;
    console.log('hey!', delta, state);

    if (delta.type === TextEditorDeltaType.Insert) {
      state.text.insertAt!(delta.position, ...delta.text);
      finalCursorPosition += delta.text.length;
    } else if (delta.type === TextEditorDeltaType.Delete) {
      state.text.deleteAt!(delta.position, delta.characterCount);
    }


    if (state.text.length > 0 && state.text.length > finalCursorPosition) {
      const elementId = (state.text as any).getElemId(finalCursorPosition);

      ephemeral[serializeHash(author)] = {
        position: elementId,
        characterCount: 0,
      };

      if (delta.type === TextEditorDeltaType.ChangeSelection) {
        ephemeral[serializeHash(author)].characterCount =
          delta.characterCount;
      }
    }
  },
};
