import type { Dictionary } from '@holochain-open-dev/core-types';
import {
  TextEditorDelta,
  TextEditorDeltaType,
  AgentSelection,
} from './grammar';

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

        if (newCursors[key].from < 0) newCursors[key].from = 0;

        const to = newCursors[key].to;
        if (to) {
          newCursors[key].to = to - delta.characterCount;
          if ((newCursors[key].to as number) < 0) newCursors[key].to = 0;
        }
      }
    }
  }

  return newCursors;
}

export function textEditorDeltaToCodemirrorDelta(delta: TextEditorDelta) {
  if (delta.type === TextEditorDeltaType.Insert) {
    return {
      from: delta.position,
      insert: delta.text,
    };
  } else if (delta.type === TextEditorDeltaType.Delete) {
    return {
      from: delta.position,
      to: delta.position + delta.characterCount,
      insert: '',
    };
  }
}
