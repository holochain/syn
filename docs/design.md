
## High-level design

These are the high level concepts that `syn` implements:

- Each network that includes `syn` can manage multiple `document`s.
- Each `document` is identified by its root commit hash.
- Each `document` has multiple `workspaces` which can evolve independently of each other, and also fork and merge (eg. "main", "proposal"). 
- Each `workspace` has a latest "tip" commit, which represents the latest snapshot of the state of the document in that workspace.
- Finally, each `workspace` has a `session`, which you can join to edit the state of the workspace collaboratively with other agents.

And at the level of code, these concepts translate to these classes:

- [`SynStore`](/api/syn-store): to create and fetch the documents in this network.
- `DocumentStore`: to create and fetch the workspaces for the given document, and also its commits.
- `WorkspaceStore`: to fetch the latest snaphshot and also the previous commits for the given workspace.
- `SessionStore`: to edit the state of the given workspace in a real-time collaborative session.

