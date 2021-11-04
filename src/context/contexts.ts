import { createContext, Context } from '@lit-labs/context';
import type { SessionStore, SynStore } from '@syn/store';

export const synContext: Readonly<Context<SynStore<any, any>>> = createContext(
  'syn-context',
  undefined
);

export const synSessionContext: Readonly<
  Context<SessionStore<any, any> | undefined>
> = createContext('syn-session-context', undefined);
