import { RecordBag, EntryRecord } from '@holochain-open-dev/utils';
export class SynClient {
    constructor(client, roleName, zomeName = 'syn') {
        this.client = client;
        this.roleName = roleName;
        this.zomeName = zomeName;
    }
    /** Roots */
    async createRoot(commit) {
        const record = await this.callZome('create_root', commit);
        return new EntryRecord(record);
    }
    async getAllRoots() {
        const roots = await this.callZome('get_all_roots', null);
        return new RecordBag(roots);
    }
    /** Commits */
    async createCommit(input) {
        const record = await this.callZome('create_commit', input);
        return new EntryRecord(record);
    }
    async getCommit(commitHash) {
        const record = await this.callZome('get_commit', commitHash);
        if (!record)
            return undefined;
        return new EntryRecord(record);
    }
    async getCommitsForRoot(root_hash) {
        const commits = await this.callZome('get_commits_for_root', root_hash);
        return new RecordBag(commits);
    }
    /** Workspaces */
    async createWorkspace(input) {
        const record = await this.callZome('create_workspace', input);
        return new EntryRecord(record);
    }
    async getWorkspacesForRoot(root_hash) {
        const workspaces = await this.callZome('get_workspaces_for_root', root_hash);
        return new RecordBag(workspaces);
    }
    getWorkspaceParticipants(workspace_hash) {
        return this.callZome('get_workspace_participants', workspace_hash);
    }
    getWorkspaceCommits(workspaceHash) {
        return this.callZome('get_workspace_commits', workspaceHash);
    }
    getWorkspaceTips(workspaceHash) {
        return this.callZome('get_workspace_tips', workspaceHash);
    }
    updateWorkspaceTip(input) {
        return this.callZome('update_workspace_tip', input);
    }
    async joinWorkspace(workspace_hash) {
        return this.callZome('join_workspace', workspace_hash);
    }
    async leaveWorkspace(workspace_hash) {
        return this.callZome('leave_workspace', workspace_hash);
    }
    sendMessage(recipients, message) {
        return this.callZome('send_message', {
            recipients,
            message,
        });
    }
    /** Helpers */
    async callZome(fnName, payload) {
        const req = {
            role_name: this.roleName,
            zome_name: this.zomeName,
            fn_name: fnName,
            payload,
        };
        return this.client.callZome(req);
    }
}
//# sourceMappingURL=client.js.map