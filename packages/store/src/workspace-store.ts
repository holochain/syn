import { liveLinksStore, pipe, uniquify } from '@holochain-open-dev/stores';
import { EntryHash, Link } from '@holochain/client';

import type { GrammarState, SynGrammar } from './grammar.js';
import { defaultConfig, RecursivePartial, SynConfig } from './config.js';
import { DocumentStore } from './document-store.js';
import { SessionStore } from './session-store.js';
import { stateFromCommit } from './syn-store.js';
import { HashType, HoloHashMap, retype } from '@holochain-open-dev/utils';
import { decode } from '@msgpack/msgpack';

export class WorkspaceStore<G extends SynGrammar<any, any>> {
  constructor(
    public documentStore: DocumentStore<G>,
    public workspaceHash: EntryHash
  ) {}

  /**
   * Keeps an up to date array of the all the agents that are currently participating in
   * the session for this workspace
   */
  sessionParticipants = pipe(
    liveLinksStore(
      this.documentStore.synStore.client,
      this.workspaceHash,
      () =>
        this.documentStore.synStore.client.getWorkspaceSessionParticipants(
          this.workspaceHash
        ),
      'WorkspaceToParticipant'
    ),
    links => uniquify(links.map(l => retype(l.target, HashType.AGENT)))
  );

  /**
   * Keeps an up to date copy of the tip for this workspace
   */
  tip = pipe(
    liveLinksStore(
      this.documentStore.synStore.client,
      this.workspaceHash,

      () =>
        this.documentStore.synStore.client.getWorkspaceTips(this.workspaceHash),
      'WorkspaceToTip'
    ),
    commitsLinks => {
      const tips = new HoloHashMap<EntryHash, Link>();

      const tipsPrevious = new HoloHashMap<EntryHash, boolean>();

      for (const commitLink of commitsLinks) {
        tips.set(commitLink.target, commitLink);
        const previousCommitsHashes: Array<EntryHash> = decode(
          commitLink.tag
        ) as Array<EntryHash>;

        for (const previousCommitHash of previousCommitsHashes) {
          tipsPrevious.set(previousCommitHash, true);
        }
      }

      for (const overwrittenTip of tipsPrevious.keys()) {
        tips.delete(overwrittenTip);
      }

      if (tips.size > 1) throw new Error('There is a conflict!');

      return Array.from(tips.values())[0].target;
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
