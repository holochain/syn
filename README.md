# syn
> Generalized DNA for building real-time shared-state hApps on holochain

Syn: Etymology. From Ancient Greek συμ- (sum-), variant of συν- (sun-), from σύν (sún, “with, in company with, together with”).

## Design

This project makes it easy to build collaborative apps in the distributed peer-to-peer context of Holochain.  Syn uses Holochain's infrastructure for data integrity and peer-to-peer networking to store regular "commits" of the shared content's state, while coordinating batches of delta's that comprise those commits between nodes.  The approach is generalized for many different use-cases, where the app-developer need only define:
1. A renderer for content state
2. A patch-grammar for applying deltas to content
3. A function to apply deltas to the content state
4. Any user interaction that should generate those deltas in the given grammar

For more details read the [design documents here](DESIGN.md) and check out the example app SynText svelte in the [/ui](ui/Readme.md) directory.

## Prerequisites

- Build the Holochain tools
  - Clone the repo: `git clone https://github.com/holochain/holochain && cd ./holochain`
  - Ensure correct version of rust tool-chain via nix: `nix-shell`
  - Install conductor binary & dna-util binary:
``` bash
cargo install --path crates/holochain
cargo install --path crates/dna_util
```
  - Make sure the `path/to/holochain/.cargo/bin` is in your `PATH`

## Building the DNA

- Build the DNA (assumes you are still in the nix shell for correct rust/cargo versions from step above):
  - Clone this repo: `git clone https://github.com/holochain/syn && cd ./syn`
  - Assemble the DNA:

  ```bash
  make build
  ```

## UI

We have provided a sample UI that implements collaborative text editing.  To run this UI in test mode you can install [holochain-run-dna](https://github.com/holochain-open-dev/holochain-run-dna) and spin up the conductor with two instances of the hApp:

``` bash
holochain-run-dna -c run-dna-config.yaml -m
```
Then you can run the UI with:

``` bash
cd ui
npm install
npm run dev
```
Now open two tabs in your browser pointing at `http://localhost:5000`.  In the second tab, change the appPort to 8887 and the appId to `syn1` before you click `Connect` and should be able to see both agents and start editing text on either tab and see it appear on the other.

### Testing

  ```bash
  make test
  ```

#### Unit testing

  The `make test-unit` command runs all the unit tests for zomes in cargo.

  #### dna tryorama testing

  The `make test-dna` command packages/installs a fresh DNA and @holochain/tryorama tests it.

  ### Flushing 💩

  The `make clean` command gets rid of all compiled output.

## License
[![License: CAL 1.0](https://img.shields.io/badge/License-CAL%201.0-blue.svg)](https://github.com/holochain/cryptographic-autonomy-license)

  Copyright (C) 2017-2020, Holochain Foundation

This program is free software: you can redistribute it and/or modify it under the terms of the license
provided in the LICENSE file (CAL-1.0).  This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
