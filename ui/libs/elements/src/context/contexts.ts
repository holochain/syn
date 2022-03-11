import { createContext, Context } from '@holochain-open-dev/context';
import type { SessionStore, SynStore } from '@holochain-syn/store';

export const synContext: Readonly<Context<SynStore<any>>> =
  createContext('syn-context', undefined);

export const synSessionContext: Readonly<
  Context<SessionStore<any> | undefined>
> = createContext('syn-session-context', undefined);
