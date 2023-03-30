import type { SynGrammar } from '@holochain-syn/store';
import Automerge from 'automerge';
export declare enum TextEditorDeltaType {
    Insert = "insert",
    Delete = "delete",
    ChangeSelection = "change_selection"
}
export declare type TextEditorDelta = {
    type: TextEditorDeltaType.Insert;
    text: string;
    position: number;
} | {
    type: TextEditorDeltaType.Delete;
    position: number;
    characterCount: number;
} | {
    type: TextEditorDeltaType.ChangeSelection;
    position: number;
    characterCount: number;
};
export interface AgentSelection {
    left: boolean;
    position: string;
    characterCount: number;
}
export declare type TextEditorState = {
    text: Automerge.Text;
};
export declare type TextEditorEphemeralState = {
    [key: string]: AgentSelection;
};
export declare type TextEditorGrammar = SynGrammar<TextEditorDelta, TextEditorState, TextEditorEphemeralState>;
export declare const textEditorGrammar: TextEditorGrammar;
