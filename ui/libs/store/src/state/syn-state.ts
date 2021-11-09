import type {
  AgentPubKeyB64,
  Dictionary,
  EntryHashB64,
} from '@holochain-open-dev/core-types';
import type {
  ChangeBundle,
  Commit,
  Delta,
  Session,
  LastDeltaSeen,
} from '@syn/zome-client';

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
  activeSessionHash: EntryHashB64 | undefined; // Optional
  sessions: Dictionary<Session>; // Segmented by EntryHashB64
  joiningSessions: Dictionary<() => void>;
  joinedSessions: Dictionary<SessionState>; // Segmented by EntryHashB64
  commits: Dictionary<Commit>; // Segmented by EntryHashB64
  snapshots: Dictionary<any>; // Segmented by EntryHashB64
}

export interface RequestedChange {
  atDate: number;
  atFolkIndex: number;
  lastDeltaSeen: LastDeltaSeen;
  delta: Delta;
}

export interface SessionFolk {
  lastSeen: number;
  inSession: boolean;
}

export interface SessionState {
  sessionHash: EntryHashB64;

  currentCommitHash: EntryHashB64 | undefined;

  myFolkIndex: number;

  currentContent: any;
  ephemeral: any;
  //currentContentHash: EntryHashB64;

  // Content before the request to the scribe was made
  prerequestContent:
    | {
        lastDeltaSeen: LastDeltaSeen;
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
    activeSessionHash: undefined,
    sessions: {},
    joinedSessions: {},
    joiningSessions: {},
    commits: {},
    snapshots: {},
  };
  return internalStore;
}
