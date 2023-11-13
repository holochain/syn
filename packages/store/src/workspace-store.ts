import {
  liveLinksAgentPubKeysTargetsStore,
  liveLinksTargetsStore,
  pipe,
} from '@holochain-open-dev/stores';
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
  sessionParticipants = liveLinksAgentPubKeysTargetsStore(
    this.documentStore.synStore.client,
    this.workspaceHash,
    () =>
      this.documentStore.synStore.client.getWorkspaceSessionParticipants(
        this.workspaceHash
      ),
    'WorkspaceToParticipant'
  );

  /**
   * Keeps an up to date copy of the tip for this workspace
   */
  tip = pipe(
    liveLinksTargetsStore(
      this.documentStore.synStore.client,
      this.workspaceHash,

      () =>
        this.documentStore.synStore.client.getWorkspaceTips(this.workspaceHash),
      'WorkspaceToTip'
    ),
    commits => {
      if (commits.length > 1) throw new Error('There is a conflict!');
      return commits[0];
    },
    commit => this.documentStore.commits.get(commit)
  );

  /**
   * Keeps an up to date copy of the state of the tip for this workspace
   */
  latestSnapshot = pipe(
    this.tip,
    commit => stateFromCommit(commit.entry) as GrammarState<G>
  ); // TODO: listen to signal!

  async joinSession(
    config?: RecursivePartial<SynConfig>
  ): Promise<SessionStore<G>> {
    return SessionStore.joinSession(this, { ...config, ...defaultConfig() });
  }
}
