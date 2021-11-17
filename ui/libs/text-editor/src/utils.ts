import type { Dictionary } from '@holochain-open-dev/core-types';
import { TextEditorDelta, TextEditorDeltaType } from './grammar';

export function moveCursors(
  delta: TextEditorDelta,
  cursors: Dictionary<number>
): Dictionary<number> {
  const newCursors: Dictionary<number> = { ...cursors };

  for (const key of Object.keys(cursors)) {
    if (delta.position < newCursors[key]) {
      if (delta.type === TextEditorDeltaType.Insert) {
        newCursors[key] += delta.text.length;
      } else if (delta.type === TextEditorDeltaType.Delete) {
        newCursors[key] -= delta.characterCount;
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
