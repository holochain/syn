import type { WorkspaceStore, SynStore, RootStore } from '@holochain-syn/store';
export declare const synContext: {
    __context__: SynStore;
};
export declare const synRootContext: {
    __context__: RootStore<any> | undefined;
};
export declare const synWorkspaceContext: {
    __context__: WorkspaceStore<any> | undefined;
};
