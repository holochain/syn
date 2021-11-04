import { TextEditorDelta } from './text-editor-delta';
import type { DeltaOperation as QuillDelta } from 'quill';
export declare function quillDeltasToTextEditorDelta(quillDeltas: QuillDelta[]): TextEditorDelta;
