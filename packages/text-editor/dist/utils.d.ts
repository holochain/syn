import Automerge from 'automerge';
import { TextEditorDelta } from './grammar';
export declare function textEditorDeltaToCodemirrorDelta(delta: TextEditorDelta): {
    from: number;
    insert: string;
    to?: undefined;
} | {
    from: number;
    to: number;
    insert: string;
} | undefined;
export declare function elemIdToPosition(left: boolean, elemId: string, text: Automerge.Text): number | undefined;
