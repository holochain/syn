import type { RequestSyncInput, StateForSync } from "@syn/zome-client";
import type { EntryHashB64 } from "@holochain-open-dev/core-types";

import {
  amIScribe,
  selectFolksInSession,
  selectMissedCommits,
  selectMissedUncommittedChanges,
  selectSession,
} from "../../../state/selectors";
import type { SynWorkspace } from "../../workspace";
import { putJustSeenFolks } from "../folklore/utils";
import type { SessionWorkspace } from "../../../state/syn-state";

/**
 * Scribe is managing the session, a folk comes in:
 *
 * - Folk: `SyncRequest`
 *     "Hey scribe! So I think I'm out of date and I don't know all the latest changes.
 *      This is the latest changes I've seen... Help me please?"
 * - Scribe: `SyncResponse`
 *     "Oh sure! Here is the commits you missed since you were gone, and here are the
 *      uncommitted changes on top of them. From now on I'll update you whenever a change happens."
 *
 */

export function handleSyncRequest<CONTENT, DELTA>(
  workspace: SynWorkspace<CONTENT, DELTA>,
  sessionHash: EntryHashB64,
  requestSyncInput: RequestSyncInput
): void {
  workspace.store.update((synState) => {
    if (!amIScribe(synState, sessionHash)) {
      console.log("syncReq received but I'm not the scribe!");
      return synState;
    }

    const session = selectSession(synState, sessionHash) as SessionWorkspace;

    putJustSeenFolks(session, synState.myPubKey, [requestSyncInput.folk]);

    const missedCommits = selectMissedCommits(
      synState,
      sessionHash,
      requestSyncInput.lastSessionIndexSeen
    );
    const uncommittedChanges = selectMissedUncommittedChanges(
      synState,
      sessionHash,
      requestSyncInput.lastSessionIndexSeen
    );

    const syncState: StateForSync = {
      uncommittedChanges,
      missedCommits,
      //currentContentHash:
    };

    workspace.client.sendSyncResponse({
      participant: requestSyncInput.folk,
      state: syncState,
      sessionHash,
    });

    const participants = selectFolksInSession(session);

    workspace.client.sendFolkLore({
      participants,
      sessionHash,
      data: { participants: [...participants, synState.myPubKey] },
    });
    return synState;
  });
}
