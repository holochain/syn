import { CellClient, HolochainClient } from '@holochain-open-dev/cell-client';
import { AppWebsocket, DnaSource } from '@holochain/client';
import { Player, Scenario } from '@holochain/tryorama';
import { synDna } from '../common.js';

let allPlayers: Player[] = [];

export async function spawnSyn(scenario: Scenario, playersCount: number): Promise<Array<CellClient>> {

  const dnas: DnaSource[] = [{ path: synDna }];
  let dnasList: Array<DnaSource[]> = []
  
  for (let i=0; i< playersCount; i+=1) {
    dnasList.push(dnas)
  }

  const players: Player[] = await scenario.addPlayersWithHapps(dnasList);
  await scenario.shareAllAgents();

  let clients : CellClient[] = []
  players.forEach( async(player) =>{
    /*
  player.setSignalHandler(signal => {
    console.log('Received Signal for player:', signal.data.payload);
  });*/

    const url = (player as any)._conductor.appClient.client.socket.url;

    const appWebsocket = await AppWebsocket.connect(url);
    const hcClient = new HolochainClient(appWebsocket);

    clients.push(new CellClient(hcClient, player.cells[0]));
  })
  return clients
}
