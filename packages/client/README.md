# @holochain-syn/client

A simple wrapper class that implements the interface for the `syn` zome.

## Usage

```js
import { AppWebsocket, AppAgentWebsocket } from '@holochain/client';
import { SynClient } from '@holochain-syn/client';

const appWs = await AppWebsocket.connect(url);
const client = await AppAgentWebsocket.connect(appWs, 'syn-app-id')
const client = new SynClient(client, 'syn-role-name', signal =>
  handleSignal(this.#workspace, signal)
);

const sessionInfo = await client.newSession();
```
