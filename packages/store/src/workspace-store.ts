import {
  AsyncReadable,
  AsyncStatus,
  derived,
  liveLinksStore,
  pipe,
  retryUntilSuccess,
  sliceAndJoin,
  toPromise,
  uniquify,
  Writable,
  writable,
} from '@holochain-open-dev/stores';
import { EntryHash, Link } from '@holochain/client';
import { HashType, HoloHashMap, retype } from '@holochain-open-dev/utils';
import { decode, encode } from '@msgpack/msgpack';
import { Commit } from '@holochain-syn/client';
import Automerge from 'automerge';

import { defaultConfig, RecursivePartial, SynConfig } from './config.js';
import { DocumentStore } from './document-store.js';
import { SessionStore } from './session-store.js';
import { stateFromCommit, stateFromDocument } from './syn-store.js';

export class WorkspaceStore<S, E> {
  constructor(
    public documentStore: DocumentStore<S, E>,
    public workspaceHash: EntryHash
  ) {}

  record = retryUntilSuccess(async () => {
    const workspace = await this.documentStore.synStore.client.getWorkspace(
      this.workspaceHash
    );
    if (!workspace) throw new Error('Workspace not found yet');
    return workspace;
  });

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
      'WorkspaceToParticipant'
    ),
    links => uniquify(links.map(l => retype(l.target, HashType.AGENT)))
  );

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
              'WorkspaceToTip'
            ),
            async commitsLinks => {
              const tipsLinks = new HoloHashMap<EntryHash, Link>();

              const tipsPrevious = new HoloHashMap<EntryHash, boolean>();

              for (const commitLink of commitsLinks) {
                tipsLinks.set(commitLink.target, commitLink);
                const previousCommitsHashes: Array<EntryHash> = decode(
                  commitLink.tag
                ) as Array<EntryHash>;

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

              const tips = await toPromise(
                sliceAndJoin(this.documentStore.commits, tipsHashes)
              );
              // If there are more that one tip, merge them
              let mergeState: Automerge.Doc<S> = Automerge.merge(
                Automerge.load(
                  decode(Array.from(tips.values())[0].entry.state) as any
                ),
                Automerge.load(
                  decode(Array.from(tips.values())[1].entry.state) as any
                )
              );

              for (let i = 2; i < tipsLinks.size; i++) {
                mergeState = Automerge.merge(
                  mergeState,
                  Automerge.load(
                    decode(Array.from(tips.values())[i].entry.state) as any
                  )
                );
              }

              const documentHash = this.documentStore.documentHash;

              const commit: Commit = {
                authors: [this.documentStore.synStore.client.client.myPubKey],
                meta: encode('Merge commit'),
                previous_commit_hashes: tipsHashes,
                state: encode(Automerge.save(mergeState)),
                witnesses: [],
                document_hash: documentHash,
              };

              const newCommit =
                await this.documentStore.synStore.client.createCommit(commit);

              await this.documentStore.synStore.client.updateWorkspaceTip(
                this.workspaceHash,
                newCommit.actionHash,
                tipsHashes
              );

              return newCommit.actionHash;
            }
          ),
    commit => (commit ? this.documentStore.commits.get(commit) : undefined)
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
