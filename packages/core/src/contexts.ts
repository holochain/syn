import { createContext } from '@lit/context';
import type {
  SessionStore,
  WorkspaceStore,
  SynStore,
  DocumentStore,
} from '@holochain-syn/store';

export const synContext = createContext<SynStore>('syn-context');

export const synDocumentContext = createContext<DocumentStore<any, any>>(
  'syn-document-context'
);

export const synWorkspaceContext = createContext<WorkspaceStore<any, any>>(
  'syn-workspace-context'
);

export const synSessionContext = createContext<SessionStore<any, any>>(
  'syn-session-context'
);
