import { TextEditorDeltaType } from './text-editor-delta';
export function quillDeltasToTextEditorDelta(quillDeltas) {
    const hasRetain = quillDeltas[0].retain;
    const position = (hasRetain ? quillDeltas[0].retain : 0);
    const actualChange = hasRetain ? quillDeltas[1] : quillDeltas[0];
    if (actualChange.insert) {
        return {
            type: TextEditorDeltaType.Insert,
            text: actualChange.insert,
            position,
        };
    }
    else if (actualChange.delete) {
        return {
            type: TextEditorDeltaType.Delete,
            position,
            characterCount: actualChange.delete,
        };
    }
    throw new Error('Malformed quill delta');
}
//# sourceMappingURL=utils.js.map