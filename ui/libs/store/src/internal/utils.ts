import type {
  Dictionary,
  EntryHashB64,
  HeaderHashB64,
} from "@holochain-open-dev/core-types";
import type { ChangeBundle, Commit } from "@syn/zome-client";
import type { EngineApplyDeltaFn, EngineContent, SynEngine } from "../engine";

export function orderCommits(
  initialContentHash: EntryHashB64,
  commits: Dictionary<Commit>
): Array<HeaderHashB64> {
  let byPreviousContentHash: Dictionary<HeaderHashB64 | undefined> = {};

  for (const [hash, commit] of Object.entries(commits)) {
    byPreviousContentHash[commit.previousContentHash] = hash;
  }

  let orderedCommits: HeaderHashB64[] = [];
  let contentHash = initialContentHash;

  while (Object.keys(byPreviousContentHash).length > 0) {
    if (!byPreviousContentHash[contentHash])
      throw new Error("We have a corrupted chain of commits");

    orderedCommits.push(byPreviousContentHash[contentHash] as string);

    byPreviousContentHash[contentHash] = undefined;
    delete byPreviousContentHash[contentHash];
  }

  return orderedCommits;
}


export function applyChangeBundle<E extends SynEngine<any, any>>(
  initialContent: EngineContent<E>,
  applyDeltaFn: EngineApplyDeltaFn<E>,
  changeBundle: ChangeBundle
): EngineContent<E> {
  let content = initialContent;
  for (const delta of changeBundle.deltas) {
    content = applyDeltaFn(content, delta);
  }
  return content;
}
