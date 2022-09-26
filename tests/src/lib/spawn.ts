import { CellClient, HolochainClient } from '@holochain-open-dev/cell-client';
import { DnaSource } from '@holochain/client';
import { Player, Scenario } from '@holochain/tryorama';
import { synDna } from '../common.js';

export async function spawnSyn(scenario: Scenario, playersCount: number): Promise<Array<CellClient>> {

  const dnas: DnaSource[] = [{ path: synDna }];
  let dnasList: Array<DnaSource[]> = []
  
  for (let i=0; i< playersCount; i+=1) {
    dnasList.push(dnas)
  }

  const players: Player[] = await scenario.addPlayersWithHapps(dnasList);
  await scenario.shareAllAgents();

  let clients : CellClient[] = []
  for (let i=0;i<players.length; i+=1) {
    const player = players[i]
    /*
  player.setSignalHandler(signal => {
    console.log('Received Signal for player:', signal.data.payload);
  });*/

    const hcClient = new HolochainClient(player.conductor.appWs());
    clients.push(new CellClient(hcClient, player.cells[0]));
  }
  return clients
}
