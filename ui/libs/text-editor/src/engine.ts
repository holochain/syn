import type { Dictionary } from '@holochain-open-dev/core-types';
import type { SynEngine } from '@syn/store';

export enum TextEditorDeltaType {
  Insert = 'insert',
  Delete = 'delete',
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
    };

export type CursorPositions = Dictionary<number>;

export type TextEditorEngine = SynEngine<
  string,
  TextEditorDelta,
  CursorPositions,
  CursorPositions
>;

export const textEditorEngine: TextEditorEngine = {
  initialContent: '',
  applyDelta(content: string, delta: TextEditorDelta) {
    switch (delta.type) {
      case TextEditorDeltaType.Insert:
        return (
          content.slice(0, delta.position) +
          delta.text +
          content.slice(delta.position)
        );
      case TextEditorDeltaType.Delete:
        return (
          content.slice(0, delta.position) +
          content.slice(delta.position + delta.characterCount)
        );
    }
  },

  ephemeral: {
    initialState: {},

    applyEphemeral(state: CursorPositions, ephemeral: CursorPositions) {
      return {
        ...state,
        ...ephemeral,
      };
    },
  },
};
