# Quickstart

## Initialization

You can initialize a new document like this:

```ts
import { AppWebsocket, AppAgentWebsocket } from '@holochain/client';
import { SynStore, DocumentStore, WorkspaceStore } from '@holochain-syn/store';
import { SynClient } from '@holochain-syn/client';

const appWs = await AppWebsocket.connect(url);
const client = await AppAgentWebsocket.connect(appWs, 'YOUR_APP_ID')

const synStore = new SynStore(new SynClient(client, 'YOUR_ROLE_NAME', 'YOUR_ZOME_NAME'));

// Create a new document
const documentStore = await synStore.createDocument(
  // Initial state of the document
  { applicationDefinedField: 'somevalue' },
  // This is an optional object to be able to store arbitrary information in the commit
  { meta: 'value'}
);
// Tag the document as "active" to allow other peers to discover it
await synStore.client.tagDocument(documentHash, "active")

// Create the workspace for the document
const workspaceStore = new documentStore.createWorkspace(
  'main',
  // Commit hash that will act as the initial tip for the workspace
  // Passing undefined means the workspace will be initialized with the document's initial state
  undefined
);
```

At this point, no synchronization is happening yet. This is because you haven't joined the session for the newly created workspace. Let's join the session:

```ts
const sessionStore: SessionStore = await sessionStore.joinSession();
```

If you want another peer to discover that document and join the same session, you can do this:

```ts
import { AnyDhtHash } from '@holochain/client'
import { Commit } from '@holochain-syn/client';
import { EntryRecord, EntryHashMap } from '@holochain-open-dev/utils';
import { DocumentStore, WorkspaceStore } from '@holochain-syn/store';
import { toPromise, joinAsyncMap, pipe } from '@holochain-open-dev/stores';

// Fetch all the active documents
const documentsHashes: Array<AnyDhtHash> = await synStore.client.getDocumentsWithTag("active");

// Build the documentStore for the document with the first document
const documentStore = synStore.documents.get(documentsHashes[0]);

// Fetch all workspaces for that document
const workspaces: ReadonlyMap<EntryHash, WorkspaceStore> = await toPromise(documentStore.allWorkspaces);

// Find the workspace
const workspaceStore = Array.from(workspaces.entries())[0];

// Join the session for the workspace
const sessionStore = await workspaceStore.joinSession();
```

## State and state changes

Now you are connected to all the peers in that same workspace, and can subscribe to the current state for the workspace and also request changes to the state:

```ts
sessionStore.state.subscribe(state => console.log('New State!', state));

// The input for the function needs to be a function that mutates the given javascript object state 
sessionStore.change(state => {
  state.applicationDefinedField = 'Updated content!';
});
```

Alternatively, you can also get information about the current state of the workspace without joining the session:

```ts
workspaceStore.tip.subscribe(tip => {
  if (tip.status === 'complete') { // "status" can also be "pending" or "error"
    console.log('current tip of the workspace: ', tip);
  }
});

workspaceStore.latestSnapshot.subscribe(latestSnapshot => {
  if (latestSnapshot.status === 'complete') { // "status" can also be "pending" or "error"
    console.log('current state of the workspace: ', latestSnapshot);
  }
});

workspaceStore.sessionParticipants.subscribe(participants => {
  if (participants.status === 'complete') { // "status" can also be "pending" or "error"
    console.log('current participants of the workspace session: ', participants);
  }
});
```

This is useful to display information about the current state of the workspace without having to join the session.

## Leaving the session

When you are done with those changes, you need to explicitly leave the session:

```ts
await sessionStore.leaveSession();
```

If you don't, all other participants in the session will try to keep synchronizing with you.

## Committing

Changes are committed every 10 seconds by default, and also when the last participant for the workspaces leaves the workspace. You can also commit the changes manually:

```ts
await sessionStore.commitChanges(
    // This is an optional object to be able to store arbitrary information in the commit
  { applicationDefinedField: 'somevalue'} 
);
```
