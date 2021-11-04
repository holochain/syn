import type { EntryHashB64 } from '@holochain-open-dev/core-types';
import type { SynWorkspace } from '../../workspace';
export declare function commitChanges<CONTENT, DELTA>(workspace: SynWorkspace<CONTENT, DELTA>, sessionHash: EntryHashB64): Promise<import("../../../state/syn-state").SynState | undefined>;
