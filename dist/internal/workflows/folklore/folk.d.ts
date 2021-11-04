import type { EntryHashB64 } from '@holochain-open-dev/core-types';
import type { FolkLore } from '@syn/zome-client';
import type { SynWorkspace } from '../../workspace';
export declare function handleFolkLore<CONTENT, DELTA>(workspace: SynWorkspace<CONTENT, DELTA>, sessionHash: EntryHashB64, folklore: FolkLore): void;
