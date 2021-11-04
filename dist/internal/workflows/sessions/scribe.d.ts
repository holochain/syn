import type { EntryHashB64 } from '@holochain-open-dev/core-types';
import type { SynWorkspace } from '../../workspace';
export declare function newSession<CONTENT, DELTA>(workspace: SynWorkspace<CONTENT, DELTA>, fromSnapshot?: EntryHashB64): Promise<EntryHashB64>;
