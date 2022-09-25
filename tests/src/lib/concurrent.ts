import { Scenario } from '@holochain/tryorama';

import { get } from 'svelte/store';
import { SynStore } from '@holochain-syn/store';
import { SynClient } from '@holochain-syn/client';
import { TextEditorDeltaType } from '../grammar.js';

import { delay, sampleGrammar } from '../common.js';
import { spawnSyn } from './spawn.js';

process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  console.log('unhandledRejection', error);
});

const aliceLine = 'ñlkjlñkj';
const bobLine = 'fgjhfgjhfg';

function alicePosition(text: string) {
  return text.split('\n')[0].length;
}
function bobPosition(text: string) {
  return text.length;
}
export default t => async (scenario: Scenario) => {
  const [aliceClient, bobClient] = await spawnSyn(scenario, 2);

  const aliceSyn = new SynStore(new SynClient(aliceClient));
  const bobSyn = new SynStore(new SynClient(bobClient));

  const { initialCommitHash } = await aliceSyn.createRoot(sampleGrammar);
  const workspaceHash = await aliceSyn.createWorkspace(
    {
      name: 'main',
      meta: undefined,
    },
    initialCommitHash
  );

  const aliceWorkspaceStore = await aliceSyn.joinWorkspace(
    workspaceHash,
    sampleGrammar
  );

  t.ok(aliceWorkspaceStore.workspaceHash).to.be.ok;

  aliceWorkspaceStore.requestChanges([
    {
      type: TextEditorDeltaType.Insert,
      position: 0,
      text: '\n',
    },
  ]);

  await delay(2000);

  const bobWorkspaceStore = await bobSyn.joinWorkspace(
    workspaceHash,
    sampleGrammar
  );

  async function simulateAlice() {
    for (let i = 0; i < aliceLine.length; i++) {
      aliceWorkspaceStore.requestChanges([
        {
          type: TextEditorDeltaType.Insert,
          position: alicePosition(
            get(aliceWorkspaceStore.state).body.text.toString()
          ),
          text: aliceLine[i],
        },
      ]);
      await delay(300);
    }
  }

  async function simulateBo() {
    for (let i = 0; i < bobLine.length; i++) {
      let content = get(bobWorkspaceStore.state).body.text;
      bobWorkspaceStore.requestChanges([
        {
          type: TextEditorDeltaType.Insert,
          position: bobPosition(content.toString()),
          text: bobLine[i],
        },
      ]);
      await delay(300);
    }
  }

  await Promise.all([simulateAlice(), simulateBo()]);
  await delay(4000);

  await Promise.all([simulateAlice(), simulateBo()]);
  await delay(4000);

  await Promise.all([simulateAlice(), simulateBo()]);
  await delay(4000);

  const expectedText = `${aliceLine}${aliceLine}${aliceLine}
${bobLine}${bobLine}${bobLine}`;

  let currentState = get(aliceWorkspaceStore.state);
  t.deepEqual(currentState.body.text.toString(), expectedText);

  currentState = get(bobWorkspaceStore.state);
  t.deepEqual(currentState.body.text.toString(), expectedText);

  await aliceWorkspaceStore.leaveWorkspace();
  await bobWorkspaceStore.leaveWorkspace();
};
