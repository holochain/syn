import type { ChangeBundle, LastDeltaSeen } from '@syn/zome-client';
import type {
  AgentPubKeyB64,
  EntryHashB64,
} from '@holochain-open-dev/core-types';
import type { SessionState, SynState } from './syn-state';

export function amIScribe(
  synState: SynState,
  sessionHash: EntryHashB64
): boolean {
  return selectScribe(synState, sessionHash) === synState.myPubKey;
}

export function selectScribe(
  synState: SynState,
  sessionHash: EntryHashB64
): AgentPubKeyB64 {
  const session = synState.sessions[sessionHash];
  return session.scribe;
}

export function selectLastCommitTime(
  synState: SynState,
  sessionHash: EntryHashB64
): number {
  const session = synState.joinedSessions[sessionHash];
  if (session.currentCommitHash)
    return synState.commits[session.currentCommitHash].createdAt;
  return synState.sessions[sessionHash].createdAt;
}

export function selectSessionState(
  synState: SynState,
  sessionHash: EntryHashB64
): SessionState {
  return synState.joinedSessions[sessionHash];
}

export function areWeJoiningSession(
  synState: SynState,
  sessionHash: EntryHashB64
): boolean {
  return !!synState.joiningSessions[sessionHash];
}

export function selectLatestSnapshotHash(
  synState: SynState,
  sessionHash: EntryHashB64
): EntryHashB64 | undefined {
  const session = selectSessionState(synState, sessionHash);
  if (!session || !session.currentCommitHash) return undefined;
  return synState.commits[session.currentCommitHash].newContentHash;
}

export function selectMissedUncommittedChanges(
  synState: SynState,
  sessionHash: EntryHashB64,
  lastDeltaSeen: LastDeltaSeen | undefined
): ChangeBundle {
  const sessionState = synState.joinedSessions[sessionHash];

  if (
    !lastDeltaSeen ||
    lastDeltaSeen.commitHash !== sessionState.currentCommitHash
  ) {
    return sessionState.uncommittedChanges;
  } else {
    // Only return the changes that they haven't seen yet
    return {
      deltas: sessionState.uncommittedChanges.deltas.slice(
        lastDeltaSeen.deltaIndexInCommit
      ),
      authors: sessionState.uncommittedChanges.authors, // TODO: optimization of only sending the authors of the missed deltas?
    };
  }
}

export function selectLastDeltaSeen(sessionState: SessionState): LastDeltaSeen {
  return {
    commitHash: sessionState.currentCommitHash,
    deltaIndexInCommit: sessionState.uncommittedChanges.deltas.length,
  };
}

export function selectFolksInSession(
  sessionWorkspace: SessionState
): AgentPubKeyB64[] {
  return Object.entries(sessionWorkspace.folks)
    .filter(([_, info]) => info.inSession)
    .map(([f, _]) => f);
}
