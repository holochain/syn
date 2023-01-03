import { AppAgentWebsocket, AppAgentClient, AppBundleSource} from '@holochain/client';
import { AppOptions, Player, Scenario } from '@holochain/tryorama';
import { synHapp } from '../common.js';

export async function spawnSyn(scenario: Scenario, playersCount: number): Promise<Array<AppAgentClient>> {

  let bundleList: Array<{
    appBundleSource: AppBundleSource;
    options?: AppOptions;
  }> = []
  
  for (let i=0; i< playersCount; i+=1) {
//    bundleList.push({appBundleSource: { path: synHapp }, options: {installedAppId:'syn-test'}})
    bundleList.push({appBundleSource: { path: synHapp }, options: {installedAppId:'syn-test'}})
  }

  const players: Player[] = await scenario.addPlayersWithApps(bundleList);
  await scenario.shareAllAgents();

  let clients : AppAgentClient[] = []
  for (let i=0;i<players.length; i+=1) {
    const player = players[i]
    const client = await AppAgentWebsocket.connect(player.conductor.appWs(), 'syn-test')
    clients.push(client);
  }
  return clients
}
