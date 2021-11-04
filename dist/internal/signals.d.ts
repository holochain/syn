import { SynSignal } from '@syn/zome-client';
import type { SynWorkspace } from './workspace';
export declare function handleSignal<CONTENT, DELTA>(workspace: SynWorkspace<CONTENT, DELTA>, signal: SynSignal): void;
