import type {
  AgentPubKeyB64,
  Dictionary,
} from '@holochain-open-dev/core-types';
import type { SynGrammar } from '@syn/store';

export enum TextEditorDeltaType {
  Insert = 'insert',
  Delete = 'delete',
  MoveCursor = 'move_cursor',
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
  | { type: TextEditorDeltaType.MoveCursor; position: number };

export interface TextEditorState {
  text: string;
  cursors: Dictionary<number>;
}

export type TextEditorGrammar = SynGrammar<TextEditorState, TextEditorDelta>;

export const textEditorGrammar: TextEditorGrammar = {
  initialState: {
    text: '',
    cursors: {},
  },
  applyDelta(
    content: TextEditorState,
    delta: TextEditorDelta,
    author: AgentPubKeyB64
  ) {
    switch (delta.type) {
      case TextEditorDeltaType.Insert:
        const text =
          content.text.slice(0, delta.position) +
          delta.text +
          content.text.slice(delta.position);
        return {
          text,
          cursors: {
            ...content.cursors,
            [author]: delta.position + delta.text.length,
          },
        };
      case TextEditorDeltaType.Delete:
        const textRemaining =
          content.text.slice(0, delta.position) +
          content.text.slice(delta.position + delta.characterCount);
        return {
          text: textRemaining,
          cursors: {
            ...content.cursors,
            [author]: delta.position,
          },
        };
      case TextEditorDeltaType.MoveCursor:
        return {
          text: content.text,
          cursors: {
            ...content.cursors,
            [author]: delta.position,
          },
        };
    }
  },
};
