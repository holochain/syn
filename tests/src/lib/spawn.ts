import { AppAgentClient, AppBundleSource, AppBundle, AppRoleManifest, AppRoleDnaManifest} from '@holochain/client';
import { AppOptions, Player, Scenario } from '@holochain/tryorama';
import { Dictionary } from 'lodash';
import { synDna } from '../common.js';

export async function spawnSyn(scenario: Scenario, playersCount: number): Promise<Array<AppAgentClient>> {

  let bundleList: Array<{
    appBundleSource: AppBundleSource;
    options?: AppOptions;
  }> = []

  const bundle = createHappBundle("syn", {"syn-test":synDna})
  for (let i=0; i< playersCount; i+=1) {
//    bundleList.push({appBundleSource: { path: synHapp }, options: {installedAppId:'syn-test'}})
    bundleList.push({appBundleSource: { bundle }, options: {installedAppId:'syn-test'}})
  }

  const players: Player[] = await scenario.addPlayersWithApps(bundleList);
  await scenario.shareAllAgents();

  let clients : AppAgentClient[] = []
  for (let i=0;i<players.length; i+=1) {
    const player = players[i]
    const client = player.conductor.appAgentWs()
    clients.push(client);
  }
  return clients
}

function createHappBundle ( name, dnas: Dictionary<string> ) {
  const bundle: AppBundle	= {
    manifest: {
        manifest_version: "1",
        name,
        roles: []
    },
    "resources": {},
  };

  for ( let [role_name, dna_path] of Object.entries(dnas) ) {
    let roleManifest: AppRoleDnaManifest = {
        //@ts-ignore
        path: dna_path
     }
    let x: AppRoleManifest = {
      name: role_name,
      dna: roleManifest,
  }
    bundle.manifest.roles.push(x);
  }

  return bundle;
}
