import { Orchestrator } from '@holochain/tryorama';
import { oFn } from './syn-store.js';
import concurrent from './concurrent.js';

async function run() {
  let orchestrator = new Orchestrator();

  concurrent(orchestrator);
  await orchestrator.run();
  /*

  orchestrator = new Orchestrator();
  missedDeltas(orchestrator);
  await orchestrator.run();
  
  */
  orchestrator = new Orchestrator();

  oFn(orchestrator);
  await orchestrator.run();
}

run();
