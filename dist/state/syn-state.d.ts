import type { AgentPubKeyB64, Dictionary, EntryHashB64, HeaderHashB64 } from '@holochain-open-dev/core-types';
import type { ChangeBundle, Commit, Delta, Session } from '@syn/zome-client';
/**
 * deltas: []
 * atSessionIndex: 0
 *
 * deltas: [{type: 'Add', content: 'hi0'}]
 * atSessionIndex: 1
 *
 * deltas: [{type: 'Add', content: 'hi0'},{type: 'Add', content: 'hi1'},{type: 'Add', content: 'hi2'},{type: 'Add', content: 'hi3'}]
 * atSessionIndex: 4
 */
export interface SynState {
    myPubKey: AgentPubKeyB64;
    activeSessionHash: EntryHashB64 | undefined;
    sessions: Dictionary<Session>;
    joinedSessions: Dictionary<SessionWorkspace>;
    commits: Dictionary<Commit>;
    snapshots: Dictionary<any>;
}
export interface RequestedChange {
    atDate: number;
    atFolkIndex: number;
    atSessionIndex: number;
    delta: Delta;
}
export interface SessionFolk {
    lastSeen: number;
    inSession: boolean;
}
export interface SessionWorkspace {
    sessionHash: EntryHashB64;
    commitHashes: Array<HeaderHashB64>;
    myFolkIndex: number;
    currentContent: any;
    prerequestContent: {
        atSessionIndex: number;
        content: any;
    } | undefined;
    requestedChanges: Array<RequestedChange>;
    uncommittedChanges: ChangeBundle;
    folks: Dictionary<SessionFolk>;
}
export declare function initialState(myPubKey: AgentPubKeyB64): SynState;
