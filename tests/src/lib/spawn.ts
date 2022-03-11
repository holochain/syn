import { CellClient, HolochainClient } from '@holochain-open-dev/cell-client';
import { ConfigSeed, InstallAgentsHapps, Player } from '@holochain/tryorama';
import { synDna } from '../common';

let allPlayers: Player[] = [];

const installation: InstallAgentsHapps = [
  // one agent
  [[synDna]], // contains 1 dna
];

export async function spawnSyn(s, config: ConfigSeed): Promise<CellClient> {
  const [player]: Player[] = await s.players([config]);

  player.setSignalHandler(signal => {
    console.log('Received Signal for player:', signal.data.payload);
  });

  const [[syn]] = await player.installAgentsHapps(installation);
  const url = (player as any)._conductor.appClient.client.socket.url;

  allPlayers.push(player);
  if (allPlayers.length > 1) {
    await s.shareAllNodes(allPlayers);
  }

  const hcClient = await HolochainClient.connect(url, syn.hAppId);
  const cellData = hcClient.cellData(syn.cells[0].cellId)!;

  return hcClient.forCell(cellData);
}
