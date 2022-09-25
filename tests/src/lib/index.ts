import { pause, runScenario  } from "@holochain/tryorama";
import { oFn } from './syn-store.js';
import concurrent from './concurrent.js';
import test from "tape-promise/tape.js";

test("syn concurrent test", async (t) => {
  await runScenario(concurrent(t))
})
