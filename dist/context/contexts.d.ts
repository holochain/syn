import { Context } from '@lit-labs/context';
import type { SessionStore, SynStore } from '@syn/store';
export declare const synContext: Readonly<Context<SynStore<any, any>>>;
export declare const synSessionContext: Readonly<Context<SessionStore<any, any> | undefined>>;
