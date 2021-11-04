import type { CellClient } from '@holochain-open-dev/cell-client';
import type { EntryHashB64, HeaderHashB64, Dictionary, AgentPubKeyB64 } from '@holochain-open-dev/core-types';
import type { SendChangeInput, SendChangeRequestInput } from './types/delta';
import type { CommitInput, Content } from './types/commit';
import type { SendFolkLoreInput } from './types/folks';
import type { SendHeartbeatInput } from './types/heartbeat';
import type { NewSessionInput, Session, SessionInfo } from './types/session';
import type { SendSyncRequestInput, SendSyncResponseInput } from './types/sync';
import { SynSignal } from './types/signal';
export declare class SynClient {
    cellClient: CellClient;
    protected handleSignal: (synSignal: SynSignal) => void;
    protected zomeName: string;
    unsubscribe: () => void;
    constructor(cellClient: CellClient, handleSignal: (synSignal: SynSignal) => void, zomeName?: string);
    close(): void;
    /** Content */
    putSnapshot(content: Content): Promise<EntryHashB64>;
    getSnapshot(snapshotHash: EntryHashB64): Promise<Content>;
    /** Commits */
    commit(commitInput: CommitInput): Promise<HeaderHashB64>;
    /** Hash */
    hashContent(content: Content): Promise<EntryHashB64>;
    /** Session */
    getSession(sessionHash: EntryHashB64): Promise<SessionInfo>;
    newSession(newSessionInput: NewSessionInput): Promise<SessionInfo>;
    deleteSession(sessionHash: EntryHashB64): Promise<void>;
    getSessions(): Promise<Dictionary<Session>>;
    /** Folks */
    getFolks(): Promise<Array<AgentPubKeyB64>>;
    sendFolkLore(sendFolkLoreInput: SendFolkLoreInput): Promise<void>;
    /** Sync */
    sendSyncRequest(syncRequestInput: SendSyncRequestInput): Promise<void>;
    sendSyncResponse(syncResponseInput: SendSyncResponseInput): Promise<void>;
    /** Changes */
    sendChangeRequest(changeRequestInput: SendChangeRequestInput): Promise<void>;
    sendChange(sendChangeInput: SendChangeInput): Promise<void>;
    /** Heartbeat */
    sendHeartbeat(heartbeatInput: SendHeartbeatInput): Promise<void>;
    /** Helpers */
    private callZome;
    private decodeSessionInfo;
    private encodeCommit;
    private encodeChangeBundle;
    private decodeCommit;
}
