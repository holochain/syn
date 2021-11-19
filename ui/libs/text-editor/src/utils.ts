import type { Dictionary } from '@holochain-open-dev/core-types';
import {
  TextEditorDelta,
  TextEditorDeltaType,
  AgentSelection,
} from './grammar';

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
        if (
          newCursors[key].position + newCursors[key].characterCount <
          endText.length
        )
          newCursors[key].characterCount =
            endText.length - newCursors[key].position;
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
