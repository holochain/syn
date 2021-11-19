import { HolochainClient } from '@holochain-open-dev/cell-client';
import { ConfigSeed, InstallAgentsHapps, Player } from '@holochain/tryorama';
import { AppWebsocket } from '@holochain/conductor-api';
import { synDna } from '../common';

let allPlayers: Player[] = [];

const installation: InstallAgentsHapps = [
  // one agent
  [[synDna]], // contains 1 dna
];

export async function spawnSyn(s, config: ConfigSeed) {
  const [player]: Player[] = await s.players([config]);

  player.setSignalHandler(signal => {
    console.log('Received Signal for player:', signal.data.payload);
  });

  const [[syn]] = await player.installAgentsHapps(installation);
  const url = (player as any)._conductor.appClient.client.socket.url;

  const appWs = await AppWebsocket.connect(url);

  allPlayers.push(player);
  if (allPlayers.length > 1) {
    await s.shareAllNodes(allPlayers);
  }

  return new HolochainClient(appWs, {
    cell_id: syn.cells[0].cellId,
    role_id: syn.cells[0].cellRole,
  });
}
