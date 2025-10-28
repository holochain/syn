import {
  AsyncReadable,
  AsyncStatus,
  derived,
  deriveStore,
  immutableEntryStore,
  liveLinksStore,
  pipe,
  sliceAndJoin,
  toPromise,
  uniquify,
  Writable,
  writable,
} from '@holochain-open-dev/stores';
import { ActionHash, EntryHash, Link } from '@holochain/client';
import {
  EntryRecord,
  HashType,
  HoloHashMap,
  retype,
} from '@holochain-open-dev/utils';
import { decode, encode } from '@msgpack/msgpack';
import { Commit } from '@holochain-syn/client';
import * as Automerge from '@automerge/automerge'

import { defaultConfig, LINKS_POLL_INTERVAL_MS, RecursivePartial, SynConfig } from './config.js';
import { DocumentStore } from './document-store.js';
import { SessionStore } from './session-store.js';
import { stateFromCommit, stateFromDocument } from './syn-store.js';

export class WorkspaceStore<S, E> {
  constructor(
    public documentStore: DocumentStore<S, E>,
    public workspaceHash: EntryHash
  ) { }

  record = immutableEntryStore(async () => this.documentStore.synStore.client.getWorkspace(
    this.workspaceHash
  ), 1000, 10);

  name = pipe(this.record, workspace => workspace.entry.name);

  private _session: Writable<SessionStore<S, E> | undefined> =
    writable(undefined);
  session = derived(this._session, i => i);

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
      'WorkspaceToParticipant',
      LINKS_POLL_INTERVAL_MS,
      () =>
        this.documentStore.synStore.client.getWorkspaceSessionParticipants(
          this.workspaceHash, true
        ),
    ),
    links => uniquify(links.map(l => retype(l.target, HashType.AGENT)))
  );

  async merge(commitsHashes: Array<ActionHash>): Promise<EntryRecord<Commit>> {
    const commits = await toPromise(
      sliceAndJoin(this.documentStore.commits, commitsHashes)
    );
    // If there are more that one tip, merge them
    let mergeState: Automerge.Doc<S> = Automerge.merge(
      Automerge.load(
        decode(Array.from(commits.values())[0].entry.state) as any
      ),
      Automerge.load(decode(Array.from(commits.values())[1].entry.state) as any)
    );

    for (let i = 2; i < commitsHashes.length; i++) {
      mergeState = Automerge.merge(
        mergeState,
        Automerge.load(
          decode(Array.from(commits.values())[i].entry.state) as any
        )
      );
    }

    const documentHash = this.documentStore.documentHash;

    const commit: Commit = {
      authors: [this.documentStore.synStore.client.client.myPubKey],
      meta: encode('Merge commit'),
      previous_commit_hashes: commitsHashes,
      state: encode(Automerge.save(mergeState)),
      witnesses: [],
      document_hash: documentHash,
    };

    const newCommit = await this.documentStore.synStore.client.createCommit(
      commit
    );

    await this.documentStore.synStore.client.updateWorkspaceTip(
      this.workspaceHash,
      newCommit.actionHash,
      commitsHashes
    );
    return newCommit;
  }

  /**
   * Keeps an up to date copy of the tip for this workspace
   */
  tip = pipe(
    derived(
      this.session,
      s =>
      ({ status: 'complete', value: s } as AsyncStatus<
        SessionStore<S, E> | undefined
      >)
    ),
    session =>
      session
        ? session.currentTip
        : pipe(
          liveLinksStore(
            this.documentStore.synStore.client,
            this.workspaceHash,
            () =>
              this.documentStore.synStore.client.getWorkspaceTips(
                this.workspaceHash
              ),
            'WorkspaceToTip',
            LINKS_POLL_INTERVAL_MS,
            () =>
              this.documentStore.synStore.client.getWorkspaceTips(
                this.workspaceHash, true
              ),
          ),
          async commitsLinks => {
            const tipsLinks = new HoloHashMap<ActionHash, Link>();

            const tipsPrevious = new HoloHashMap<ActionHash, boolean>();

            for (const commitLink of commitsLinks) {
              tipsLinks.set(commitLink.target, commitLink);
              const previousCommitsHashes: Array<ActionHash> = decode(
                commitLink.tag
              ) as Array<ActionHash>;

              for (const previousCommitHash of previousCommitsHashes) {
                tipsPrevious.set(previousCommitHash, true);
              }
            }

            for (const overwrittenTip of tipsPrevious.keys()) {
              tipsLinks.delete(overwrittenTip);
            }
            const tipsHashes = Array.from(tipsLinks.keys());
            if (tipsHashes.length === 0) return undefined;

            if (tipsHashes.length === 1) return tipsHashes[0];

            const newCommit = await this.merge(tipsHashes);
            return newCommit.actionHash;
          },
          commit =>
            commit ? this.documentStore.commits.get(commit) : undefined
        )
  );

  /**
   * Keeps an up to date copy of the state of the tip for this workspace
   */
  latestSnapshot: AsyncReadable<S> = pipe(this.tip, commit =>
    commit
      ? (stateFromCommit(commit.entry) as S)
      : pipe(
        this.documentStore.record,
        document => stateFromDocument(document.entry) as S
      )
  );

  /**
   * Keeps an up to date copy of the state of the session if there is an active one,
   * or the latest snapshot if there isn't a session
   */
  latestState: AsyncReadable<S> = deriveStore(this.session, session => {
    if (session)
      return derived(
        session.state,
        s =>
        ({
          status: 'complete',
          value: s,
        } as AsyncStatus<S>)
      );

    return this.latestSnapshot;
  });

  /**
   * Joins the real-time collaborative session for this workspace
   * This will connect to all the active peers and start to synchronize with them
   */
  async joinSession(
    config?: RecursivePartial<SynConfig>
  ): Promise<SessionStore<S, E>> {
    const session = await SessionStore.joinSession(
      this,
      () => this._session.set(undefined),
      {
        ...config,
        ...defaultConfig(),
      }
    );

    this._session.set(session);

    return session;
  }
}
