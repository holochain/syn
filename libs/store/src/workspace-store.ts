import { lazyLoadAndPoll, pipe } from '@holochain-open-dev/stores';
import { EntryHash } from '@holochain/client';

import type { SynGrammar } from './grammar.js';
import { defaultConfig, RecursivePartial, SynConfig } from './config.js';
import { RootStore } from './root-store.js';
import { SessionStore } from './session-store.js';

export class WorkspaceStore<G extends SynGrammar<any, any>> {
  constructor(
    public rootStore: RootStore<G>,
    public config: SynConfig,
    public workspaceHash: EntryHash
  ) {}

  editors = lazyLoadAndPoll(
    () =>
      this.rootStore.synStore.client.getWorkspaceEditors(this.workspaceHash),
    4000
  );

  sessionParticipants = lazyLoadAndPoll(
    () =>
      this.rootStore.synStore.client.getWorkspaceSessionParticipants(
        this.workspaceHash
      ),
    4000
  );

  tip = pipe(
    lazyLoadAndPoll(
      () => this.rootStore.synStore.client.getWorkspaceTips(this.workspaceHash),
      4000
    ),
    commits => {
      if (commits.length > 1) throw new Error('There is a conflict!');
      return commits[0];
    }
  );

  async joinSession(
    config?: RecursivePartial<SynConfig>
  ): Promise<SessionStore<G>> {
    return SessionStore.joinSession(this, { ...config, ...defaultConfig() });
  }
}
