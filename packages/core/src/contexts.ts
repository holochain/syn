import { createContext } from '@lit-labs/context';
import type {
  SessionStore,
  WorkspaceStore,
  SynStore,
  DocumentStore,
} from '@holochain-syn/store';

export const synContext = createContext<SynStore>('syn-context');

export const synDocumentContext = createContext<DocumentStore<any> | undefined>(
  'syn-document-context'
);

export const synWorkspaceContext = createContext<
  WorkspaceStore<any> | undefined
>('syn-workspace-context');

export const synSessionContext = createContext<SessionStore<any> | undefined>(
  'syn-session-context'
);
