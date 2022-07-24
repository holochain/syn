import type {
  Dictionary,
  EntryHashB64,
  HeaderHashB64,
} from '@holochain-open-dev/core-types';
import type { Commit } from '@holochain-syn/client';

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
      throw new Error('We have a corrupted chain of commits');

    orderedCommits.push(byPreviousContentHash[contentHash] as string);

    byPreviousContentHash[contentHash] = undefined;
    delete byPreviousContentHash[contentHash];
  }

  return orderedCommits;
}
