import type { RequestSyncInput } from "@syn/zome-client";
import type { EntryHashB64 } from "@holochain-open-dev/core-types";
import type { SynWorkspace } from "../../workspace";
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
export declare function handleSyncRequest<CONTENT, DELTA>(workspace: SynWorkspace<CONTENT, DELTA>, sessionHash: EntryHashB64, requestSyncInput: RequestSyncInput): void;
