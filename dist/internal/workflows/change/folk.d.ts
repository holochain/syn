import type { ChangeBundle } from '@syn/zome-client';
import type { EntryHashB64 } from '@holochain-open-dev/core-types';
import type { SynWorkspace } from '../../workspace';
export declare function folkRequestChange<CONTENT, DELTA>(workspace: SynWorkspace<CONTENT, DELTA>, sessionHash: EntryHashB64, deltas: DELTA[]): void;
export declare function checkRequestedChanges<CONTENT, DELTA>(workspace: SynWorkspace<CONTENT, DELTA>, sessionHash: EntryHashB64): Promise<void>;
export declare function handleChangeNotice<CONTENT, DELTA>(workspace: SynWorkspace<CONTENT, DELTA>, sessionHash: EntryHashB64, changes: ChangeBundle): void;
