import { runScenario  } from "@holochain/tryorama";
import store from './syn-store.js';
import concurrent from './concurrent.js';
import test from "tape-promise/tape.js";

test("syn store test", async (t) => {
  await runScenario(store(t))
})

test("syn concurrent test", async (t) => {
  await runScenario(concurrent(t))
})

