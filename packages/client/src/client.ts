import {
  AgentPubKey,
  EntryHash,
  Record,
  AppClient,
  AnyDhtHash,
  Link,
  ActionHash,
} from '@holochain/client';
import { EntryRecord, ZomeClient } from '@holochain-open-dev/utils';
import { cleanNodeDecoding } from '@holochain-open-dev/utils/dist/clean-node-decoding.js';

import {
  Document,
  Commit,
  SendMessageInput,
  SessionMessage,
  SynSignal,
  Workspace,
} from './types.js';

export class SynClient extends ZomeClient<SynSignal> {
  constructor(
    public client: AppClient,
    public roleName: string,
    public zomeName = 'syn'
  ) {
    super(client, roleName, zomeName);
  }

  /** Documents */

  public async createDocument(
    document: Document
  ): Promise<EntryRecord<Document>> {
    const record: Record = await this.callZome('create_document', document);
    return new EntryRecord(record);
  }

  public async getDocumentsWithTag(tag: string): Promise<Array<Link>> {
    return this.callZome('get_documents_with_tag', tag);
  }

  public async getDocument(
    documentHash: AnyDhtHash
  ): Promise<EntryRecord<Document> | undefined> {
    const record: Record | undefined = await this.callZome(
      'get_document',
      documentHash
    );
    if (!record) return undefined;

    return new EntryRecord(record);
  }

  public async getAuthorsForDocument(
    documentHash: AnyDhtHash
  ): Promise<Array<Link>> {
    return this.callZome('get_authors_for_document', documentHash);
  }

  public async tagDocument(
    documentHash: AnyDhtHash,
    tag: string
  ): Promise<void> {
    return this.callZome('tag_document', {
      document_hash: documentHash,
      tag,
    });
  }

  public async removeDocumentTag(
    documentHash: AnyDhtHash,
    tag: string
  ): Promise<void> {
    return this.callZome('remove_document_tag', {
      document_hash: documentHash,
      tag,
    });
  }

  public async tagPathEntryHash(tag: string): Promise<EntryHash> {
    return this.callZome('tag_path_entry_hash', tag);
  }

  /** Commits */
  public async createCommit(commit: Commit): Promise<EntryRecord<Commit>> {
    return new Promise((resolve, reject) => {
      const unsubs = this.onSignal(signal => {
        // TODO: better check?
        if (
          signal.type === 'EntryCreated' &&
          signal.app_entry.type === 'Commit' &&
          cleanNodeDecoding(commit.document_hash).toString() ===
            cleanNodeDecoding(signal.app_entry.document_hash).toString()
        ) {
          unsubs();

          this.getCommit(signal.action.hashed.hash)
            .then(r => {
              resolve(r!);
            })
            .catch(e => reject(e))
            .finally(() => unsubs());
        }
      });
      this.callZome('create_commit', commit).catch(e => reject(e));
      setTimeout(() => reject('TIMEOUT'), 30000);
    });
  }

  public async getCommit(
    commitHash: ActionHash
  ): Promise<EntryRecord<Commit> | undefined> {
    const record: Record | undefined = await this.callZome(
      'get_commit',
      commitHash
    );
    if (!record) return undefined;

    return new EntryRecord(record);
  }

  public async getCommitsForDocument(
    documentHash: AnyDhtHash
  ): Promise<Array<Link>> {
    const commits: Array<Link> = await this.callZome(
      'get_commits_for_document',
      documentHash
    );

    if (commits.length > 600) {
      console.warn(
        `THERE ARE ${commits.length} FOR THIS DOCUMENT. THIS SHOULDN'T HAPPEN! REPORT TO THE SYN DEVS ABOUT THIS (guillemcordoba)`
      );
    }

    return commits;
  }

  /** Workspaces */
  public async createWorkspace(
    workspace: Workspace,
    initial_commit_hash: ActionHash | undefined
  ): Promise<EntryRecord<Workspace>> {
    const record: Record = await this.callZome('create_workspace', {
      workspace,
      initial_commit_hash,
    });
    return new EntryRecord(record);
  }

  public async getWorkspace(
    workspace_hash: EntryHash
  ): Promise<EntryRecord<Workspace> | undefined> {
    const workspace: Record | undefined = await this.callZome(
      'get_workspace',
      workspace_hash
    );
    return workspace ? new EntryRecord(workspace) : undefined;
  }

  public async getWorkspacesForDocument(
    documentHash: AnyDhtHash
  ): Promise<Array<Link>> {
    return this.callZome('get_workspaces_for_document', documentHash);
  }

  public async getWorkspaceTips(
    workspaceHash: EntryHash
  ): Promise<Array<Link>> {
    return this.callZome('get_workspace_tips', workspaceHash);
  }

  public updateWorkspaceTip(
    workspace_hash: EntryHash,
    new_tip_hash: ActionHash,
    previous_commit_hashes: Array<ActionHash>
  ): Promise<void> {
    return this.callZome('update_workspace_tip', {
      workspace_hash,
      new_tip_hash,
      previous_commit_hashes,
    });
  }

  public getWorkspaceSessionParticipants(
    workspace_hash: EntryHash
  ): Promise<Array<Link>> {
    return this.callZome('get_workspace_session_participants', workspace_hash);
  }

  public async joinWorkspaceSession(
    workspace_hash: EntryHash
  ): Promise<AgentPubKey[]> {
    return this.callZome('join_workspace_session', workspace_hash);
  }

  public async leaveWorkspaceSession(workspace_hash: EntryHash): Promise<void> {
    return this.callZome('leave_workspace_session', workspace_hash);
  }

  public sendMessage(
    recipients: Array<AgentPubKey>,
    message: SessionMessage
  ): Promise<void> {
    return this.callZome('send_message', {
      recipients,
      message,
    } as SendMessageInput);
  }
}
