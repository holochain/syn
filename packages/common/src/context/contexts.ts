import { createContext } from '@lit-labs/context';
import type { SessionStore, SynStore } from '@holochain-syn/store';

export const synContext = createContext<SynStore<any>>('syn-context');

export const synSessionContext = createContext<SessionStore<any> | undefined>(
  'syn-session-context'
);
