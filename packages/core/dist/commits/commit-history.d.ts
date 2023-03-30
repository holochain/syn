import { LitElement } from 'lit';
import { CytoscapeDagre } from '@scoped-elements/cytoscape';
import { Card, CircularProgress } from '@scoped-elements/material-web';
import { TaskSubscriber } from 'lit-svelte-stores';
import { EntryHashB64 } from '@holochain/client';
import { RecordBag } from '@holochain-open-dev/utils';
import { Commit } from '@holochain-syn/client';
import { RootStore } from '@holochain-syn/store';
declare const CommitHistory_base: typeof LitElement & import("@open-wc/dedupe-mixin").Constructor<import("@open-wc/scoped-elements/types/src/types").ScopedElementsHost>;
export declare class CommitHistory extends CommitHistory_base {
    rootstore: RootStore<any>;
    selectedCommitHash: EntryHashB64 | undefined;
    _allCommitsTask: TaskSubscriber<unknown[], RecordBag<Commit>>;
    onNodeSelected(nodeId: string): void;
    get selectedNodeIds(): string[];
    renderContent(allCommits: RecordBag<Commit>): import("lit-html").TemplateResult<1>;
    render(): unknown;
    static get scopedElements(): {
        'cytoscape-dagre': typeof CytoscapeDagre;
        'mwc-circular-progress': typeof CircularProgress;
        'mwc-card': typeof Card;
    };
    static styles: import("lit").CSSResult[];
}
export {};
