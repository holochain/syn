import type { ChangeBundle, Commit } from "@syn/zome-client";
import type {
  AgentPubKeyB64,
  EntryHashB64,
  HeaderHashB64,
  Dictionary,
} from "@holochain-open-dev/core-types";
import type { SessionWorkspace, SynState } from "./syn-state";

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
  const session = synState.joinedSessions[sessionHash];
  return session.session.scribe;
}

export function selectSession(
  synState: SynState,
  sessionHash: EntryHashB64
): SessionWorkspace {
  return synState.joinedSessions[sessionHash];
}

export function selectLatestCommit(
  state: SynState,
  sessionHash: EntryHashB64
): Commit | undefined {
  const commitHash = selectLatestCommitHash(
    selectSession(state, sessionHash) as SessionWorkspace
  );
  return commitHash ? state.commits[commitHash] : undefined;
}

export function selectLatestCommitHash(
  session: SessionWorkspace
): HeaderHashB64 | undefined {
  if (session.commitHashes.length === 0) return undefined;

  return session.commitHashes[session.commitHashes.length - 1];
}

export function selectLatestCommittedContentHash(
  synState: SynState,
  sessionHash: EntryHashB64
): EntryHashB64 {
  const latestCommit = selectLatestCommit(synState, sessionHash);
  if (latestCommit) return latestCommit.newContentHash;
  // If there is no commit after the initial snapshot,
  // the last committed entry hash is the initial snapshot hash
  return synState.joinedSessions[sessionHash].session.snapshotHash;
}

export function selectAllCommits(
  synState: SynState,
  sessionHash: EntryHashB64
): Array<[EntryHashB64, Commit]> {
  const session = synState.joinedSessions[sessionHash];

  return session.commitHashes.map((hash) => [hash, synState.commits[hash]]);
}

// Returns the commits that have been missed since the last session change seen
export function selectMissedCommits(
  synState: SynState,
  sessionHash: EntryHashB64,
  latestSeenSessionIndex: number
): Dictionary<Commit> {
  const commits = selectAllCommits(synState, sessionHash);

  const missedCommits: Dictionary<Commit> = {};

  // Traverse the commits in reverse order, and when we find one that has already been seen, return
  for (const commit of commits.reverse()) {
    if (commit[1].changes.atSessionIndex > latestSeenSessionIndex) {
      missedCommits[commit[0]] = commit[1];
    } else {
      return missedCommits;
    }
  }
  return missedCommits;
}

export function selectMissedUncommittedChanges(
  synState: SynState,
  sessionHash: EntryHashB64,
  latestSeenSessionIndex: number
): ChangeBundle {
  const sessionWorkspace = synState.joinedSessions[sessionHash];

  if (
    sessionWorkspace.uncommittedChanges.atSessionIndex > latestSeenSessionIndex
  )
    return sessionWorkspace.uncommittedChanges;
  else {
    // Only return the changes that they haven't seen yet

    const uncommittedChanges = sessionWorkspace.uncommittedChanges;

    const uncommittedDeltaIndex =
      latestSeenSessionIndex - uncommittedChanges.atSessionIndex;

    return {
      atSessionIndex: latestSeenSessionIndex + 1,
      deltas: uncommittedChanges.deltas.slice(uncommittedDeltaIndex),
      authors: uncommittedChanges.authors, // TODO: optimization of only sending the authors of the missed deltas?
    };
  }
}

export function selectCurrentSessionIndex(
  sessionWorkspace: SessionWorkspace
): number {
  return (
    sessionWorkspace.uncommittedChanges.atSessionIndex +
    sessionWorkspace.uncommittedChanges.deltas.length
  );
}

export function selectFolksInSession(
  sessionWorkspace: SessionWorkspace
): AgentPubKeyB64[] {
  return Object.entries(sessionWorkspace.folks)
    .filter(([_, info]) => info.inSession)
    .map(([f, _]) => f);
}
