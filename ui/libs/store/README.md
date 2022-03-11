# @holochain-syn/store

Reactive store that holds the state for the `syn` Holochain zome.

This is the main library you have to use to build a `syn` application.

## Defining a Grammar

Syn is a synchronization engine: it is agnostic as to what's the content that's being synchronized.

So, you have to create your own "grammar", which consists of:

- The shape of the state that's being synchronized.
- All the possible delta changes, and how they affect that state.

```ts
import { SynGrammar } from '@syn/store';

interface CounterState {
  count: number;
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

type CounterGrammar = SynGrammar<CounterState, CounterDelta>;

const counterGrammar: CounterGrammar = {
  initialState: {
    count: 0,
  },
  applyDelta(
    state: CounterState,
    delta: CounterDelta,
    _author: AgentPubKeyB64
  ): CounterState {
    if (delta.type === 'increment') {
      return {
        counter: state.counter + delta.amount,
      };
    } else {
      return {
        counter: state.counter - delta.amount,
      };
    }
  },
};
```

With this, you'll have defined how `syn` is going to aggregate the changes that the agents make into the final state.

## Using the Store

Now that you have defined your grammar, it's time to instantiate the store with it:

```ts
import { HolochainClient, CellClient } from '@holochain-open-dev/cell-client';
import { SynStore } from '@holochain-syn/store';

const hcClient = await HolochainClient.connect(url, 'syn');
const cellData = hcClient.cellDataByRoleId('syn');
const cellClient = hcClient.forCell(cellData);

const store = new SynStore(cellClient, counterGrammar);
```

At this point, no synchronization is happening yet. This is because you need to either create or join a session.

- Creating a session:

```ts
const sessionInfo = await store.newSession();
```

- Joining a session

```ts
await store.joinSession(sessionHash);
```

- Getting all the current sessions:

```ts
const currentSessions = await store.getAllSessions();
```