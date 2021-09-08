# syn

> Generalized DNA for building real-time shared-state hApps on holochain

Syn: Etymology. From Ancient Greek συμ- (sum-), variant of συν- (sun-), from σύν (sún, “with, in company with, together with”).

## Design

This project makes it easy to build collaborative apps in the distributed peer-to-peer context of Holochain. Syn uses Holochain's infrastructure for data integrity and peer-to-peer networking to store regular "commits" of the shared content's state, while coordinating batches of delta's that comprise those commits between nodes. The approach is generalized for many different use-cases, where the app-developer need only define:

1. A renderer for content state
2. A patch-grammar for applying deltas to content
3. A function to apply deltas to the content state
4. Any user interaction that should generate those deltas in the given grammar

For more details read the [design documents](DESIGN.md), read the [article](https://blog.holochain.org/decentralized-next-level-collaboration-apps-with-syn/), and check out the example app, SynText, in the [/ui](ui/) directory.

## Installation

1. Install the `nix-shell`.
2. Clone this repo: `git clone https://github.com/holochain/syn && cd ./syn`
3. Enter the nix shell: `nix-shell`.
4. Run `npm install`

## Building the DNA

- Build the DNA (assumes you are still in the nix shell for correct rust/cargo versions from step above):

```bash
npm run build:happ
```

## UI

We have provided a sample UI that implements collaborative text editing in a minimal editor. To run this UI in test mode:

```bash
npm run start
```

And the same in another terminal:

```bash
npm run start
```

Now open two browser tabs pointing to the locations that the output from those commands indicates.

Now you should be able to see both agents and start editing text on either tab and see it appear on the other.

### Testing

```bash
npm run test
```

## License

[![License: CAL 1.0](https://img.shields.io/badge/License-CAL%201.0-blue.svg)](https://github.com/holochain/cryptographic-autonomy-license)

Copyright (C) 2020-2021, Holochain Foundation

This program is free software: you can redistribute it and/or modify it under the terms of the license
provided in the LICENSE file (CAL-1.0). This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
