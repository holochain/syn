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
  FolkInfo,
} from '@syn/zome-client';
import type { GrammarState, SynGrammar } from '../grammar';

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

export interface SynState<G extends SynGrammar<any, any>> {
  myPubKey: AgentPubKeyB64;
  activeSessionHash: EntryHashB64 | undefined; // Optional
  sessions: Dictionary<Session>; // Segmented by EntryHashB64
  joiningSessions: Dictionary<() => void>;
  joinedSessions: Dictionary<SessionState<G>>; // Segmented by EntryHashB64
  commits: Dictionary<Commit>; // Segmented by EntryHashB64
  snapshots: Dictionary<any>; // Segmented by EntryHashB64
}

export interface RequestedChange {
  atDate: number;
  atFolkIndex: number;
  lastDeltaSeen: LastDeltaSeen;
  delta: Delta;
}

export interface SessionState<G extends SynGrammar<any, any>> {
  sessionHash: EntryHashB64;

  lastCommitHash: EntryHashB64 | undefined;

  myFolkIndex: number;

  currentContent: GrammarState<G>;
  //currentContentHash: EntryHashB64;

  // Content before the request to the scribe was made
  prerequestContent:
    | {
        lastDeltaSeen: LastDeltaSeen;
        content: GrammarState<G>;
      }
    | undefined;

  // Only my requested changes
  requestedChanges: Array<RequestedChange>;

  nonRequestedChanges: Array<RequestedChange>;
  nonRequestedChangesAtLastDeltaSeen: LastDeltaSeen | undefined;
  nonRequestedChangesAtFolkIndex: number | undefined;

  nonEmittedChangeBundle: ChangeBundle | undefined;
  nonEmittedLastDeltaSeen: LastDeltaSeen | undefined;

  uncommittedChanges: ChangeBundle;

  // AgentPubKeyB64 -> lastSeen
  folks: Dictionary<FolkInfo>;
}

export function initialState<G extends SynGrammar<any, any>>(
  myPubKey: AgentPubKeyB64
): SynState<G> {
  const internalStore: SynState<G> = {
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
