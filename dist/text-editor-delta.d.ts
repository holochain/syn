export declare enum TextEditorDeltaType {
    Insert = "insert",
    Delete = "delete"
}
export declare type TextEditorDelta = {
    type: TextEditorDeltaType.Insert;
    text: string;
    position: number;
} | {
    type: TextEditorDeltaType.Delete;
    position: number;
    characterCount: number;
};
export declare function applyTextEditorDelta(content: string, delta: TextEditorDelta): string;
