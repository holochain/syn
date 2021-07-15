import type {
  AgentPubKeyB64,
  Dictionary,
  EntryHashB64,
  HeaderHashB64,
} from "@holochain-open-dev/core-types";
import type { ChangeBundle, Commit, Delta, Session } from "@syn/zome-client";

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
  joinedSessions: Dictionary<SessionWorkspace>; // Segmented by EntryHashB64
  commits: Dictionary<Commit>; // Segmented by HeaderHashB64
  snapshots: Dictionary<any>; // Segmented by EntryHashB64
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
  session: Session;

  commitHashes: Array<HeaderHashB64>;
  myFolkIndex: number;

  currentContent: any;
  //currentContentHash: EntryHashB64;

  // Content before the request to the scribe was made
  prerequestContent:
    | {
        atSessionIndex: number;
        content: any;
      }
    | undefined;

  // Only my requested changes
  requestedChanges: Array<RequestedChange>;

  uncommittedChanges: ChangeBundle;

  // AgentPubKeyB64 -> lastSeen
  folks: Dictionary<SessionFolk>;
}

export function initialState(myPubKey: AgentPubKeyB64): SynState {
  const internalStore: SynState = {
    myPubKey,
    joinedSessions: {},
    commits: {},
    snapshots: {},
  };
  return internalStore;
}
