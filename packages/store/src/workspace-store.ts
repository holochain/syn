import { lazyLoadAndPoll, pipe } from '@holochain-open-dev/stores';
import { EntryHash } from '@holochain/client';

import type { GrammarState, SynGrammar } from './grammar.js';
import { defaultConfig, RecursivePartial, SynConfig } from './config.js';
import { DocumentStore } from './document-store.js';
import { SessionStore } from './session-store.js';
import { stateFromCommit } from './syn-store.js';

export class WorkspaceStore<G extends SynGrammar<any, any>> {
  constructor(
    public documentStore: DocumentStore<G>,
    public workspaceHash: EntryHash
  ) {}

  /**
   * Keeps an up to date array of the all the agents that are currently participating in
   * the session for this workspace
   */
  sessionParticipants = lazyLoadAndPoll(
    () =>
      this.documentStore.synStore.client.getWorkspaceSessionParticipants(
        this.workspaceHash
      ),
    4000
  );

  /**
   * Keeps an up to date copy of the tip for this workspace
   */
  tip = pipe(
    lazyLoadAndPoll(
      () =>
        this.documentStore.synStore.client.getWorkspaceTips(this.workspaceHash),
      4000
    ),
    commits => {
      if (commits.length > 1) throw new Error('There is a conflict!');
      return commits[0];
    },
    commit => this.documentStore.synStore.commits.get(commit)
  );

  /**
   * Keeps an up to date copy of the state of the tip for this workspace
   */
  latestSnapshot = pipe(
    this.tip,
    commit => stateFromCommit(commit.entry) as GrammarState<G>
  );

  async joinSession(
    config?: RecursivePartial<SynConfig>
  ): Promise<SessionStore<G>> {
    return SessionStore.joinSession(this, { ...config, ...defaultConfig() });
  }
}
