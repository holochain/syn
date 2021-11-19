import type {
  AgentPubKeyB64,
  Dictionary,
} from '@holochain-open-dev/core-types';
import type { SynGrammar } from '@syn/store';
import cloneDeep from 'lodash-es/cloneDeep';

export function moveSelections(
  endText: string,
  delta: TextEditorDelta,
  cursors: Dictionary<AgentSelection>
): Dictionary<AgentSelection> {
  const newCursors: Dictionary<AgentSelection> = { ...cursors };

  for (const key of Object.keys(newCursors)) {
    if (delta.position < newCursors[key].position) {
      if (delta.type === TextEditorDeltaType.Insert) {
        newCursors[key].position += delta.text.length;
      } else if (delta.type === TextEditorDeltaType.Delete) {
        newCursors[key].position -= delta.characterCount;

        if (newCursors[key].position < 0) newCursors[key].position = 0;
        if (newCursors[key].characterCount < endText.length)
          newCursors[key].characterCount = endText.length;
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
    state: TextEditorState,
    delta: TextEditorDelta,
    author: AgentPubKeyB64
  ) {
    return h(state, delta, author);
  },

  transformDelta(
    toTransform: TextEditorDelta,
    conflictingDelta: TextEditorDelta
  ): TextEditorDelta {
    const h = htransformDelta(toTransform, conflictingDelta);
    //console.log('transform', toTransform, conflictingDelta, h);
    return h;
  },

  selectPersistedState(state) {
    return {
      text: state.text,
      selections: {},
    };
  },
};

function htransformDelta(
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
      position:
        toTransform.position - conflictingDelta.characterCount >= 0
          ? toTransform.position - conflictingDelta.characterCount
          : 0,
    };
  }
}

function h(
  state: TextEditorState,
  delta: TextEditorDelta,
  author: AgentPubKeyB64
) {
  switch (delta.type) {
    case TextEditorDeltaType.Insert:
      if (state.text.length + 1 < delta.position) throw new Error('Bad bad');
      const text =
        state.text.slice(0, delta.position) +
        delta.text +
        state.text.slice(delta.position);
      return {
        text,
        selections: {
          ...moveSelections(text, delta, cloneDeep(state.selections)),
          [author]: {
            position: delta.position + delta.text.length,
            characterCount: 0,
          },
        },
      };
    case TextEditorDeltaType.Delete:
      const textRemaining =
        state.text.slice(0, delta.position) +
        state.text.slice(delta.position + delta.characterCount);
      return {
        text: textRemaining,
        selections: {
          ...moveSelections(textRemaining, delta, cloneDeep(state.selections)),
          [author]: {
            position: delta.position,
            characterCount: 0,
          },
        },
      };
    case TextEditorDeltaType.ChangeSelection:
      return {
        text: state.text,
        selections: {
          ...state.selections,
          [author]: {
            position: delta.position,
            characterCount: delta.characterCount,
          },
        },
      };
  }
}
