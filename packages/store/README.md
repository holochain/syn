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

### Initialization

Now that you have defined your grammar, it's time to instantiate the store with it:

```ts
import { HolochainClient, CellClient } from '@holochain-open-dev/cell-client';
import { SynStore, RootStore, WorkspaceStore } from '@holochain-syn/store';
import { SynClient } from '@holochain-syn/client';

const appWebsocket = await AppWebsocket.connect(url);
const client = new HolochainClient(appWebsocket);

const appInfo = await appWebsocket.appInfo({
  installed_app_id: 'YOUR_APP_ID',
});

const installedCells = appInfo.cell_data;
const notebooksCell = installedCells.find(
  c => c.role_id === 'YOUR_ROLE_ID'
) as InstalledCell;

const cellClient = new CellClient(client, notebooksCell);

const synStore = new SynStore(new SynClient(cellClient));
```

At this point, no synchronization is happening yet. This is because first you need to create a root for a document, create a workspace for that root and finally join that workspace.

```ts
const rootStore = await synStore.createRoot(textEditorGrammar, 
  // This is an optional object to be able to store arbitrary information in the commit
  { applicationDefinedField: 'somevalue'} 
);
const workspaceHash = await rootStore.createWorkspace(
  'main',
  rootStore.root.entryHash
);
const workspaceStore: WorkspaceStore = await rootStore.joinWorkspace(workspaceHash);
```

If you want another peer to discover that documenta and join the same workspace, you can do this:

```ts
import { get } from 'svelte/store';
import { Commit } from '@holochain-syn/client';
import { RootStore, WorkspaceStore } from '@holochain-syn/store';
import { RecordBag, EntryHashMap } from '@holochain-open-dev/utils';

// Fetch all roots
const roots: RecordBag<Commit> = get(await store.fetchAllRoots());

const rootStore = new RootStore(
  store.client,
  textEditorGrammar,
  roots.entryRecords[0]
);
const workspaces: EntryHashMap<Workspace> = get(await rootStore.fetchWorkspaces());
const workspaceStore: WorkspaceStore = await rootStore.joinWorkspace(workspaces.keys()[0]);
```

#### Deterministic Roots

In some cases, you need a way to create global roots that are known in advance and that must exist for your application to work. In this cases, you need to be able to create roots in a deterministic way, so that if two agents have created the global root in parallel, the end result is only one root, with possibly multiple workspaces that need to be resolved at the app level.

To create a deterministic root:

```ts
const rootStore = await synStore.createDeterministicRoot(textEditorGramma,
  // This is an optional object to be able to store arbitrary information in the commit
  { applicationDefinedField: 'somevalue'} 
);
```

### State and state changes

Now you are connected to all the peers in that same workspace, and can subscribe to the current state for the workspace and also request changes to the state:

```ts
workspaceStore.state.subscribe(state => console.log('New State!', state));

// The input for the function needs to be an array of the delta type you have defined in your grammar
workspaceStore.requestChanges([{
  type: 'increment',
  amount: 10
}]);
```

### Leaving the workspace

When you are done with those changes, you need to explicitly leave the workspace:

```ts
await workspaceStore.leaveWorkspace();
```

### Committing

Changes are committed every 10 seconds by default, and also when the last participant for the workspaces leaves the workspace. You can also commit the changes manually:

```ts
await workspaceStore.commitChanges(
    // This is an optional object to be able to store arbitrary information in the commit
  { applicationDefinedField: 'somevalue'} 
);
```