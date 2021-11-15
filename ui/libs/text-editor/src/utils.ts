import type { Dictionary } from '@holochain-open-dev/core-types';
import { TextEditorDelta, TextEditorDeltaType } from './engine';

export function moveCursors(
  deltas: TextEditorDelta[],
  cursors: Dictionary<number>
): Dictionary<number> {
  const newCursors: Dictionary<number> = { ...cursors };

  for (const delta of deltas) {
    for (const key of Object.keys(cursors)) {
      if (delta.position <= newCursors[key]) {
        if (delta.type === TextEditorDeltaType.Insert) {
          newCursors[key] += delta.text.length;
        } else {
          newCursors[key] -= delta.characterCount;
        }
      }
    }
  }

  return newCursors;
}
