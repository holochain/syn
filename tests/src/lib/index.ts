import { Orchestrator } from '@holochain/tryorama';
import { oFn } from './syn-store';
import concurrent from './concurrent';
import missedDeltas from './missed-deltas';

async function run() {
  let orchestrator = new Orchestrator();
/*   oFn(orchestrator);
  await orchestrator.run();

  orchestrator = new Orchestrator();
 */
  concurrent(orchestrator);
  await orchestrator.run();

  orchestrator = new Orchestrator();

  missedDeltas(orchestrator);
  await orchestrator.run();
}

run();
