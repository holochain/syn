import type { Dictionary } from '@holochain-open-dev/core-types';
import {
  SetCursorPosition,
  TextEditorDelta,
  TextEditorDeltaType,
} from './engine';

export function moveCursors(
  deltas: TextEditorDelta[],
  cursors: Dictionary<number>
): Array<SetCursorPosition> {
  const newCursors: Dictionary<number> = {};

  for (const delta of deltas) {
    for (const key of Object.keys(cursors)) {
      if (delta.position > cursors[key]) {
        if (delta.type === TextEditorDeltaType.Insert) {
          newCursors[key] += cursors[key] + delta.text.length;
        } else {
          newCursors[key] += cursors[key] + delta.characterCount;
        }
      }
    }
  }

  return Object.entries(newCursors).map(([key, position]) => ({
    agent: key,
    position,
  }));
}
