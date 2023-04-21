import type { SynGrammar } from '@holochain-syn/store';
import { AgentPubKey, encodeHashToBase64 } from '@holochain/client';
import { Text } from '@automerge/automerge';

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
  left: boolean;
  position: string;
  characterCount: number;
}

export type TextEditorState = {
  text: Text;
};
export type TextEditorEphemeralState = { [key: string]: AgentSelection };

export type TextEditorGrammar = SynGrammar<
  TextEditorDelta,
  TextEditorState,
  TextEditorEphemeralState
>;

export const textEditorGrammar: TextEditorGrammar = {
  initState(doc) {
    doc.text = new Text();
  },
  applyDelta(
    delta: TextEditorDelta,
    state: TextEditorState,
    ephemeral: TextEditorEphemeralState,
    author: AgentPubKey
  ) {
    if (delta.type === TextEditorDeltaType.Insert) {
      state.text.insertAt!(delta.position, ...delta.text);
      // const elementId = (state.text as any).getElemId(
      //   delta.position + delta.text.length - 1
      // );

      // ephemeral[encodeHashToBase64(author)] = {
      //   left: false,
      //   position: elementId,
      //   characterCount: 0,
      // };
    } else if (delta.type === TextEditorDeltaType.Delete) {
      state.text.deleteAt!(delta.position, delta.characterCount);

      if (state.text.length === 0) {
        return;
      }

      if (delta.position === 0) {
        const elementId = (state.text as any).getElemId(0);

        ephemeral[encodeHashToBase64(author)] = {
          left: true,
          position: elementId,
          characterCount: 0,
        };
      } else {
        const elementId = (state.text as any).getElemId(delta.position - 1);

        ephemeral[encodeHashToBase64(author)] = {
          left: false,
          position: elementId,
          characterCount: 0,
        };
      }
    } else {
      if (state.text.length === 0) {
      } else if (delta.position === state.text.length) {
        ephemeral[encodeHashToBase64(author)] = {
          left: false,
          position: (state.text as any).getElemId(delta.position - 1),
          characterCount: delta.characterCount,
        };
      } else {
        ephemeral[encodeHashToBase64(author)] = {
          left: true,
          position: (state.text as any).getElemId(delta.position),
          characterCount: delta.characterCount,
        };
      }
    }
  },
};
