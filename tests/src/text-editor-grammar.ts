import { AgentPubKey, encodeHashToBase64 } from '@holochain/client';
import * as Automerge from '@automerge/automerge'

export interface AgentSelection {
  left: boolean;
  position: string;
  characterCount: number;
}

export type TextEditorState = {
  text: string[];
};
export type TextEditorEphemeralState = { [key: string]: AgentSelection };

export const textEditorGrammar = {
  initialState() {
    return {
      text: [],
    };
  },
  changes(
    myPubKey: AgentPubKey,
    state: TextEditorState,
    cursors: TextEditorEphemeralState
  ) {
    return {
      insert(from: number, text: string) {
        // Ensure the insertion position is within bounds
        const safeFrom = Math.max(0, Math.min(from, state.text.length));
        state.text.splice(safeFrom, 0, ...text.split(''));
        const elementId = Automerge.getObjectId(state.text, safeFrom + text.length - 1) || '';

        cursors[encodeHashToBase64(myPubKey)] = {
          left: false,
          position: elementId,
          characterCount: 0,
        };
      },
      delete(position: number, characterCount: number) {
        // Ensure the deletion position and count are within bounds
        const safePosition = Math.max(0, Math.min(position, state.text.length));
        const safeCount = Math.max(0, Math.min(characterCount, state.text.length - safePosition));
        state.text.splice(safePosition, safeCount);

        if (state.text.length === 0) return;

        if (safePosition === 0) {
          const elementId = Automerge.getObjectId(state.text, 0) || '';

          cursors[encodeHashToBase64(myPubKey)] = {
            left: true,
            position: elementId,
            characterCount: 0,
          };
        } else {
          const elementId = Automerge.getObjectId(state.text, safePosition - 1) || '';

          cursors[encodeHashToBase64(myPubKey)] = {
            left: false,
            position: elementId,
            characterCount: 0,
          };
        }
      },
      changeSelection(from: number, characterCount: number) {
        if (state.text.length === 0) {
        } else {
          // Ensure the selection position is within bounds
          const safeFrom = Math.max(0, Math.min(from, state.text.length));
          if (safeFrom === state.text.length) {
            cursors[encodeHashToBase64(myPubKey)] = {
              left: false,
              position: Automerge.getObjectId(state.text, safeFrom - 1) || '',
              characterCount: characterCount,
            };
          } else {
            cursors[encodeHashToBase64(myPubKey)] = {
              left: true,
              position: Automerge.getObjectId(state.text, safeFrom) || '',
              characterCount: characterCount,
            };
          }
        }
      },
    };
  },
};
