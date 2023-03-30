import { AgentPubKeyB64 } from '@holochain/client';
export declare type HSL = [number, number, number];
export declare function CSSifyHSL(hslArray: HSL): string;
export interface FolkColors {
    primary: HSL;
    hexagon: HSL;
    selection: HSL;
    lookingSelection: HSL;
    lookingCursor: HSL;
}
export declare function getFolkColors(pubKey: AgentPubKeyB64): {
    r: number;
    g: number;
    b: number;
};
