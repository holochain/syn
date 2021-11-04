import type { AgentPubKeyB64 } from '@holochain-open-dev/core-types';
import type { SessionWorkspace } from '../../../state/syn-state';
export declare function putJustSeenFolks(session: SessionWorkspace, myPubKey: AgentPubKeyB64, folks: AgentPubKeyB64[]): void;
