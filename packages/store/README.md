# @holochain-syn/store

Reactive store that holds the state for the `syn` Holochain zome.

This is the main library you have to use to build a `syn` application.

## Defining a Grammar

Syn is a synchronization engine: it is agnostic as to what's the content that's being synchronized.

So, you have to create your own "grammar", which consists of:

- The shape of the state that's being synchronized.
- All the possible delta changes, and how they affect that state.

`syn` uses [Automerge](https://automerge.org/) under the hood to achieve real-time conflict-free collaboration. You can use Automerge's special `Counter` and `Text` types to avoid conflicts with counters and text, otherwise you can just use normal JS objects and lists.

```ts
import { SynGrammar } from '@holochain-syn/store';
import Automerge from 'automerge';

interface CounterState {
  count: Automerge.Counter;
}

type CounterDelta =
  | {
      type: 'increment';
      amount: number;
    }
  | {
      type: 'decrement';
      amount: number;
    };

type CounterGrammar = SynGrammar<CounterDelta, CounterState>;

const counterGrammar: CounterGrammar = {
  initState(state): {
    state.count = new Automerge.Counter();
  },
  applyDelta(
    delta: CounterDelta,
    state: CounterState,
    ephemeralState: any,
    _author: AgentPubKey
  ): CounterState {
    if (delta.type === 'increment') {
      counter.increment(delta.amount);
    } else {
      counter.decrement(delta.amount);
    }
  },
};
```

IMPORTANT! Using Automerge does mean that the code you write on your grammar **must follow the rules that automerge imposes**: mainly, that you use mutable idioms to update the state. 

So instead of this:

```ts
const cardsGrammar = {
  initState(state): {
    state.cards = {};
  },
  applyDelta(
    delta: CounterDelta,
    state: CounterState,
    ephemeralState: any,
    _author: AgentPubKey
  ): CounterState {
    const newCard = { id: 123, title: delta.title, done: false };
    state.cards = {
      ids: [...state.cards.ids, newCard.id],
      entities: { ...state.cards.entities, [newCard.id]: newCard }
    };
  },
};
```

You must write your grammar like this:

```ts
const cardsGrammar = {
  initState(state): {
    state.cards = { ids: [], entities: {} };
  },
  applyDelta(
    delta: CounterDelta,
    state: CounterState,
    ephemeralState: any,
    _author: AgentPubKey
  ): CounterState {
    const newCard = { id: 123, title: delta.title, done: false };
    state.cards.ids.push(newCard.id);
    state.cards.entities[newCard.id] = newCard;
  },
};
```

With this, you'll have defined how `syn` is going to aggregate the changes that the agents make into the final state.

## Using the Store

### High-level design

These are the high level concepts that `syn` implements:

- Each network that includes `syn` can manage multiple `document`s.
- Each `document` is identified by its root commit hash.
- Each `document` has multiple `workspaces` which can evolve independently of each other, and also fork and merge (eg. "main", "proposal"). 
- Each `workspace` has a latest "tip" commit, which represents the latest snapshot of the state of the document in the workspace.
- And each `workspace` has a `session`, which you can join to edit the state of the workspace collaborative with other agents.

And at the level of code, these concepts translate to these classes:

- `SynStore`: to create and fetch the documents in this network.
- `DocumentStore`: to create and fetch the workspaces for the given document, and also its commits.
- `WorkspaceStore`: to fetch the current state and also the previous commits for the given workspace.
- `SessionStore`: to edit the state of the given workspace in a real-time collaborative session.

### Initialization

Now that you have defined your grammar, it's time to instantiate the store with it:

```ts
import { AppWebsocket, AppAgentWebsocket } from '@holochain/client';
import { SynStore, DocumentStore, WorkspaceStore } from '@holochain-syn/store';
import { SynClient } from '@holochain-syn/client';

const appWs = await AppWebsocket.connect(url);
const client = await AppAgentWebsocket.connect(appWs, 'YOUR_APP_ID')

const synStore = new SynStore(new SynClient(client, 'YOUR_ROLE_NAME', 'YOUR_ZOME_NAME'));
```

At this point, you haven't created any documents yet. Let's start by creating one, and a `main` workspace for it:

```ts
// Create the document
const { documentHash, firstCommitHash } = await synStore.createDocument(textEditorGrammar, 
  // This is an optional object to be able to store arbitrary information in the commit
  { applicationDefinedField: 'somevalue'}
);
// Tag the document as "active" to allow other peers to discover it
await synStore.client.tagDocument(documentHash, "active")
const documentStore = new DocumentStore(synStore, textEditorGrammar, documentHash);

// Create the workspace for the document
const workspaceHash = new documentStore.createWorkspace(
  'main',
  firstCommitHash
);
const workspaceStore = new WorkspaceStore(documentStore, workspaceHash);
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
const documentStore = new DocumentStore(
  synStore,
  textEditorGrammar,
  documentsHashes[0]
);
// Fetch all workspaces for that document
const workspaces: ReadonlyMap<EntryHash, EntryRecord<Workspace>> = await toPromise(pipe(documentStore.allWorkspaces, joinAsyncMap));
// Find the main workspace
const mainWorkspace = workspaces.find(w => w.entry.name === 'main');
const workspaceStore = new WorkspaceStore(documentStore, mainWorkspace.entryHash);

// Join the session for the workspace
const sessionStore = await workspaceStore.joinSession();
```

Alternatively, you can also get information about the current state of the workspace without joining the session:

```ts
import { stateFromCommit } from '@holochain-syn/store';

workspaceStore.tip.subscribe(tip => {
  if (tip.status === 'complete') { // "status" can also be "pending" or "error"
    console.log('current tip of the workspace: ', tip);
  }
})

workspaceStore.latestSnapshot.subscribe(latestSnapshot => {
  if (latestSnapshot.status === 'complete') { // "status" can also be "pending" or "error"
    console.log('current state of the workspace: ', latestSnapshot);
  }
})

workspaceStore.sessionParticipants.subscribe(participants => {
  if (participants.status === 'complete') { // "status" can also be "pending" or "error"
    console.log('current participants of the workspace session: ', participants);
  }
})

```

This is useful to display information about the current state of the workspace without having to join the session.

#### Deterministic Documents

In some cases, you need a way to create global documents that are known in advance and that must exist for your application to work. In this cases, you need to be able to create roots in a deterministic way, so that if two agents have created the global root in parallel, the end result is only one root, with possibly multiple workspaces that need to be resolved at the app level.

To create a deterministic root:

```ts
const { documentHash, firstCommitHash }= await synStore.createDeterministicDocument(textEditorGramma,
  // This is an optional object to be able to store arbitrary information in the commit
  { applicationDefinedField: 'somevalue'} 
);
```

### State and state changes

Now you are connected to all the peers in that same workspace, and can subscribe to the current state for the workspace and also request changes to the state:

```ts
sessionStore.state.subscribe(state => console.log('New State!', state));

// The input for the function needs to be an array of the delta type you have defined in your grammar
sessionStore.requestChanges([{
  type: 'increment',
  amount: 10
}]);
```

### Leaving the session

When you are done with those changes, you need to explicitly leave the session:

```ts
await sessionStore.leaveSession();
```

If you don't, all other participants in the session will try to keep synchronizing with you.

### Committing

Changes are committed every 10 seconds by default, and also when the last participant for the workspaces leaves the workspace. You can also commit the changes manually:

```ts
await sessionStore.commitChanges(
    // This is an optional object to be able to store arbitrary information in the commit
  { applicationDefinedField: 'somevalue'} 
);
```
