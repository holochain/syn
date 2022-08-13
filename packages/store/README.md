# @holochain-syn/store

Reactive store that holds the state for the `syn` Holochain zome.

This is the main library you have to use to build a `syn` application.

## Defining a Grammar

Syn is a synchronization engine: it is agnostic as to what's the content that's being synchronized.

So, you have to create your own "grammar", which consists of:

- The shape of the state that's being synchronized.
- All the possible delta changes, and how they affect that state.

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

With this, you'll have defined how `syn` is going to aggregate the changes that the agents make into the final state.

## Using the Store

### Initialization

Now that you have defined your grammar, it's time to instantiate the store with it:

```ts
import { HolochainClient, CellClient } from '@holochain-open-dev/cell-client';
import { SynStore } from '@holochain-syn/store';
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
const { initialCommitHash } = await synStore.createRoot(textEditorGrammar);
const workspaceHash = await synStore.createWorkspace(
  { name: 'main', meta: undefined },
  initialCommitHash
);
const workspaceStore = await store.joinWorkspace(workspaceHash);
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
await workspaceStore.commitChanges();
```