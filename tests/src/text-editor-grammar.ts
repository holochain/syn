import { AgentPubKey, encodeHashToBase64 } from '@holochain/client';
import Automerge from 'automerge';

export interface AgentSelection {
  left: boolean;
  position: string;
  characterCount: number;
}

export type TextEditorState = {
  text: Automerge.Text;
};
export type TextEditorEphemeralState = { [key: string]: AgentSelection };

export const textEditorGrammar = {
  initialState() {
    return {
      text: new Automerge.Text(),
    };
  },
  changes(
    myPubKey: AgentPubKey,
    state: TextEditorState,
    cursors: TextEditorEphemeralState
  ) {
    return {
      insert(from: number, text: string) {
        state.text.insertAt!(from, ...text);
        const elementId = (state.text as any).getElemId(from + text.length - 1);

        cursors[encodeHashToBase64(myPubKey)] = {
          left: false,
          position: elementId,
          characterCount: 0,
        };
      },
      delete(position: number, characterCount: number) {
        state.text.deleteAt!(position, characterCount);

        if (state.text.length === 0) return;

        if (position === 0) {
          const elementId = (state.text as any).getElemId(0);

          cursors[encodeHashToBase64(myPubKey)] = {
            left: true,
            position: elementId,
            characterCount: 0,
          };
        } else {
          const elementId = (state.text as any).getElemId(position - 1);

          cursors[encodeHashToBase64(myPubKey)] = {
            left: false,
            position: elementId,
            characterCount: 0,
          };
        }
      },
      changeSelection(from: number, characterCount: number) {
        if (state.text.length === 0) {
        } else if (from === state.text.length) {
          cursors[encodeHashToBase64(myPubKey)] = {
            left: false,
            position: (state.text as any).getElemId(from - 1),
            characterCount: characterCount,
          };
        } else {
          cursors[encodeHashToBase64(myPubKey)] = {
            left: true,
            position: (state.text as any).getElemId(from),
            characterCount: characterCount,
          };
        }
      },
    };
  },
};
