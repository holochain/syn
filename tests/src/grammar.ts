import type {
  AgentPubKeyB64,
  Dictionary,
} from '@holochain-open-dev/core-types';
import type { SynGrammar } from '@syn/store';

export function moveSelections(
  delta: TextEditorDelta,
  cursors: Dictionary<AgentSelection>
): Dictionary<AgentSelection> {
  const newCursors: Dictionary<AgentSelection> = { ...cursors };

  for (const key of Object.keys(cursors)) {
    if (delta.position < newCursors[key].from) {
      if (delta.type === TextEditorDeltaType.Insert) {
        newCursors[key].from += delta.text.length;
        const to = newCursors[key].to;
        if (to) {
          newCursors[key].to = to + delta.text.length;
        }
      } else if (delta.type === TextEditorDeltaType.Delete) {
        newCursors[key].from -= delta.characterCount;
        const to = newCursors[key].to;
        if (to) {
          newCursors[key].to = to - delta.characterCount;
        }
      }
    }
  }

  return newCursors;
}

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
  | { type: TextEditorDeltaType.ChangeSelection; position: number; to: number };

export interface AgentSelection {
  from: number;
  to?: number;
}

export interface TextEditorState {
  text: string;
  selections: Dictionary<AgentSelection>;
}

export type TextEditorGrammar = SynGrammar<TextEditorState, TextEditorDelta>;

export const textEditorGrammar: TextEditorGrammar = {
  initialState: {
    text: '',
    selections: {},
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
          selections: {
            ...moveSelections(delta, content.selections),
            [author]: {
              from: delta.position + delta.text.length,
            },
          },
        };
      case TextEditorDeltaType.Delete:
        const textRemaining =
          content.text.slice(0, delta.position) +
          content.text.slice(delta.position + delta.characterCount);
        return {
          text: textRemaining,
          selections: {
            ...moveSelections(delta, content.selections),
            [author]: {
              from: delta.position,
            },
          },
        };
      case TextEditorDeltaType.ChangeSelection:
        return {
          text: content.text,
          selections: {
            ...content.selections,
            [author]: {
              from: delta.position,
              to: delta.to,
            },
          },
        };
    }
  },

  transformDelta(
    toTransform: TextEditorDelta,
    conflictingDelta: TextEditorDelta
  ): TextEditorDelta {
    if (conflictingDelta.type === TextEditorDeltaType.ChangeSelection)
      return toTransform;

    if (toTransform.position < conflictingDelta.position) return toTransform;

    if (conflictingDelta.type === TextEditorDeltaType.Insert) {
      return {
        ...toTransform,
        position: toTransform.position + conflictingDelta.text.length,
      };
    } else {
      return {
        ...toTransform,
        position: toTransform.position - conflictingDelta.characterCount,
      };
    }
  },

  selectPersistedState(state) {
    return {
      text: state.text,
      selections: {},
    };
  },
};
