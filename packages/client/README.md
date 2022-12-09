# @holochain-syn/client

A simple wrapper class that implements the interface for the `syn` zome.

## Usage

```js
import { HolochainClient, CellClient } from '@holochain-open-dev/cell-client';
import { SynClient } from '@holochain-syn/client';

const hcClient = await HolochainClient.connect(url, 'syn');
const cellData = hcClient.cellDataByRoleName('syn');
const cellClient = hcClient.forCell(cellData);

const client = new SynClient(cellClient, signal =>
  handleSignal(this.#workspace, signal)
);

const sessionInfo = await client.newSession();
```
