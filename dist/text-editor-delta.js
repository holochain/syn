export var TextEditorDeltaType;
(function (TextEditorDeltaType) {
    TextEditorDeltaType["Insert"] = "insert";
    TextEditorDeltaType["Delete"] = "delete";
})(TextEditorDeltaType || (TextEditorDeltaType = {}));
export function applyTextEditorDelta(content, delta) {
    switch (delta.type) {
        case TextEditorDeltaType.Insert:
            return (content.slice(0, delta.position) +
                delta.text +
                content.slice(delta.position));
        case TextEditorDeltaType.Delete:
            return (content.slice(0, delta.position) +
                content.slice(delta.position + delta.characterCount));
    }
}
//# sourceMappingURL=text-editor-delta.js.map