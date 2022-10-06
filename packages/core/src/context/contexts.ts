import { createContext } from '@lit-labs/context';
import type { WorkspaceStore, SynStore, RootStore } from '@holochain-syn/store';

export const synContext = createContext<SynStore>('syn-context');

export const synRootContext = createContext<RootStore<any> | undefined>(
  'syn-root-context'
);

export const synWorkspaceContext = createContext<WorkspaceStore<any> | undefined>(
  'syn-workspace-context'
);
