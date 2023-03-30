import { TextEditorDeltaType } from './grammar';
export function textEditorDeltaToCodemirrorDelta(delta) {
    if (delta.type === TextEditorDeltaType.Insert) {
        return {
            from: delta.position,
            insert: delta.text,
        };
    }
    else if (delta.type === TextEditorDeltaType.Delete) {
        return {
            from: delta.position,
            to: delta.position + delta.characterCount,
            insert: '',
        };
    }
}
export function elemIdToPosition(left, elemId, text) {
    for (let i = 0; i < text.length; i++) {
        if (text.getElemId(i) === elemId)
            return left ? i : i + 1;
    }
    return undefined;
}
//# sourceMappingURL=utils.js.map