import { TextEditorDelta, TextEditorDeltaType } from './text-editor-delta';
import type { DeltaOperation as QuillDelta } from 'quill';

export function quillDeltasToTextEditorDelta(
  quillDeltas: QuillDelta[]
): TextEditorDelta {
  const hasRetain = quillDeltas[0].retain;

  const position = (hasRetain ? quillDeltas[0].retain : 0) as number;
  const actualChange = hasRetain ? quillDeltas[1] : quillDeltas[0];

  if (actualChange.insert) {
    return {
      type: TextEditorDeltaType.Insert,
      text: actualChange.insert,
      position,
    };
  } else if (actualChange.delete) {
    return {
      type: TextEditorDeltaType.Delete,
      position,
      characterCount: actualChange.delete,
    };
  }
  throw new Error('Malformed quill delta');
}
