import type {
  AgentPubKeyB64,
  Dictionary,
  EntryHashB64,
} from '@holochain-open-dev/core-types';
import type { Commit, Delta, Session, FolkInfo } from '@holochain-syn/client';
import type { SyncState, Doc } from 'automerge';
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
  joiningSessionsPromises: Dictionary<() => void>;
  joinedSessions: Dictionary<SessionState<G>>; // Segmented by EntryHashB64
  commits: Dictionary<Commit>; // Segmented by EntryHashB64
  snapshots: Dictionary<any>; // Segmented by EntryHashB64
}

export interface SessionState<G extends SynGrammar<any, any>> {
  sessionHash: EntryHashB64;

  lastCommitHash: EntryHashB64 | undefined;

  initialSnapshot: Doc<GrammarState<G>>;

  state: Doc<GrammarState<G>>;
  ephemeral: Doc<GrammarState<G>>;

  // Only my requested changes that haven't been requested back to me
  unpublishedChanges: Array<Delta>;
  unpublishedEphemeralChanges: Array<Delta>;

  syncStates: Dictionary<{ state: SyncState; ephemeral: SyncState }>;

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
    joiningSessionsPromises: {},
    commits: {},
    snapshots: {},
  };
  return internalStore;
}
