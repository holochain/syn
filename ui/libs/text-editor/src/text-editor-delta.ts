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

export function applyTextEditorDelta(
  content: string,
  delta: TextEditorDelta
): string {
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
}
