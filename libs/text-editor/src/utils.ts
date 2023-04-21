import { Text } from '@automerge/automerge';
import { TextEditorDelta, TextEditorDeltaType } from './grammar';

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

export function elemIdToPosition(
  left: boolean,
  elemId: string,
  text: Text
): number | undefined {
  for (let i = 0; i < text.length; i++) {
    if ((text as any).getElemId(i) === elemId) return left ? i : i + 1;
  }

  return undefined;
}
