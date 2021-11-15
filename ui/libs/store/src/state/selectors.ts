import type { ChangeBundle, LastDeltaSeen, Session } from '@syn/zome-client';
import type {
  AgentPubKeyB64,
  EntryHashB64,
} from '@holochain-open-dev/core-types';
import type { SessionState, SynState } from './syn-state';
import type { SynWorkspace } from '../internal/workspace';
import type { SynEngine } from '../engine';

export function amIScribe<E extends SynEngine<any, any>>(
  synState: SynState<E>,
  sessionHash: EntryHashB64
): boolean {
  return selectScribe(synState, sessionHash) === synState.myPubKey;
}

export function selectScribe<E extends SynEngine<any, any>>(
  synState: SynState<E>,
  sessionHash: EntryHashB64
): AgentPubKeyB64 {
  const session = synState.sessions[sessionHash];
  return session.scribe;
}

export function selectLastCommitTime<E extends SynEngine<any, any>>(
  synState: SynState<E>,
  sessionHash: EntryHashB64
): number {
  const session = synState.joinedSessions[sessionHash];
  if (session.lastCommitHash)
    return synState.commits[session.lastCommitHash].createdAt;
  return synState.sessions[sessionHash].createdAt;
}

export function selectSession<E extends SynEngine<any, any>>(
  synState: SynState<E>,
  sessionHash: EntryHashB64
): Session {
  return synState.sessions[sessionHash];
}

export function selectSessionState<E extends SynEngine<any, any>>(
  synState: SynState<E>,
  sessionHash: EntryHashB64
): SessionState<E> {
  return synState.joinedSessions[sessionHash];
}

export function areWeJoiningSession<E extends SynEngine<any, any>>(
  synState: SynState<E>,
  sessionHash: EntryHashB64
): boolean {
  return !!synState.joiningSessions[sessionHash];
}

export function selectLatestSnapshotHash<E extends SynEngine<any, any>>(
  synState: SynState<E>,
  sessionHash: EntryHashB64
): EntryHashB64 | undefined {
  const session = selectSessionState(synState, sessionHash);
  if (!session || !session.lastCommitHash) return undefined;
  return synState.commits[session.lastCommitHash].newContentHash;
}

export function selectMissedUncommittedChanges<E extends SynEngine<any, any>>(
  synState: SynState<E>,
  sessionHash: EntryHashB64,
  lastDeltaSeen: LastDeltaSeen | undefined
): ChangeBundle {
  const sessionState = synState.joinedSessions[sessionHash];

  if (
    !lastDeltaSeen ||
    lastDeltaSeen.commitHash !== sessionState.lastCommitHash
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

export function selectLastDeltaSeen<E extends SynEngine<any, any>>(
  sessionState: SessionState<E>
): LastDeltaSeen {
  return {
    commitHash: sessionState.lastCommitHash,
    deltaIndexInCommit: sessionState.uncommittedChanges.deltas.length,
  };
}

export function selectFolksInSession<E extends SynEngine<any, any>>(
  workspace: SynWorkspace<E>,
  sessionState: SessionState<E>
): AgentPubKeyB64[] {
  return Object.entries(sessionState.folks)
    .filter(
      ([_, info]) =>
        Date.now() - info.lastSeen < workspace.config.outOfSessionTimeout
    )
    .map(([f, _]) => f);
}
