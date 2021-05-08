const path = require('path');
const { app } = require('electron');
const { log } = require('./logger');
const fs = require('fs');
const { wslPath } = require('./cli');
const { spawn } = require('child_process');
const { AdminWebsocket } = require('@holochain/conductor-api');
//const { AdminWebsocket } = require('../holochain-conductor-api');

const {bytesToBase64} = require('byte-base64');

// -- CONSTS -- //

const CONFIG_PATH = path.join(app.getPath('appData'), 'Syn');
const STORAGE_PATH = path.join(CONFIG_PATH, 'storage');
const CONDUCTOR_CONFIG_FILENAME = 'conductor-config.yaml';
const DEFAULT_PROXY_URL ='kitsune-proxy://CIW6PxKxsPPlcuvUCbMcKwUpaMSmB7kLD8xyyj4mqcw/kitsune-quic/h/165.22.32.11/p/5778/--';
const DEFAULT_BOOTSTRAP_URL = 'https://bootstrap-staging.holo.host';
const SYN_APP_NAME = 'SynText';
const SYN_APP_ID = 'syn'; // MUST MATCH SYN_UI config
const LAIR_MAGIC_READY_STRING = '#lair-keystore-ready#';

module.exports.DEFAULT_BOOTSTRAP_URL = DEFAULT_BOOTSTRAP_URL;
module.exports.CONFIG_PATH = CONFIG_PATH;
module.exports.STORAGE_PATH = STORAGE_PATH;
module.exports.CONDUCTOR_CONFIG_FILENAME = CONDUCTOR_CONFIG_FILENAME;
module.exports.SYN_APP_NAME = SYN_APP_NAME;


/**
 * Spawn 'lair-keystore' process
 */
async function spawnKeystore(keystore_bin) {
  // -- Spawn Keystore -- //
  let bin = keystore_bin;
  //let args = ['keygen', '--path', wslPath(KEYSTORE_FILE_PATH), '--nullpass', '--quiet'];
  let args = [];
  if(process.platform === "win32") {
    bin = process.env.comspec;
    args.unshift("/c", "wsl", keystore_bin);
  }
  log('info', 'Spawning ' + bin + ' (dirname: ' + __dirname + ')');
  const keystore_proc = spawn(bin, args, {
    cwd: __dirname,
    env: {
      ...process.env,
    },
  });
  // -- Handle Outputs
  // Wait for holochain to boot up
  await new Promise((resolve, reject) => {
    keystore_proc.stdout.once('data', (data) => {
      log('info', 'lair-keystore: ' + data.toString());
      if(data.toString().indexOf(LAIR_MAGIC_READY_STRING) > -1) {
        resolve();
      }
    });
    keystore_proc.stderr.on('data', (data) => {
      log('error', 'lair-keystore> ' + data.toString())
    });
    // -- Handle Termination
    keystore_proc.on('exit', (code) => {
       log('info', code);
      reject();
      // TODO: Figure out if must kill app if keystore crashes
      // kill(holochain_handle.pid, function (err) {
      //   if (!err) {
      //     log('info', 'killed all holochain sub processes');
      //   } else {
      //     log('error', err);
      //   }
      // });
      // quit = true;
      // app.quit();
    });
  });
  // Done
  return keystore_proc;
}
module.exports.spawnKeystore = spawnKeystore;


/**
 * Write the conductor config to storage path
 * Using proxy and bootstrap server
 */
function generateConductorConfig(configPath, bootstrapUrl, storagePath, proxyUrl, adminPort, canMdns) {
  log('info', 'generateConductorConfig() with ' + adminPort);
  if (proxyUrl === undefined || proxyUrl === '') {
    proxyUrl = DEFAULT_PROXY_URL;
  }
  let network_type = "quic_bootstrap";
  if (canMdns) {
    network_type = "quic_mdns";
  }
  let environment_path = wslPath(storagePath);
  log('debug',{environment_path});
  if (bootstrapUrl === undefined) {
    bootstrapUrl = DEFAULT_BOOTSTRAP_URL
  }
  const config =
    `environment_path: ${environment_path}
use_dangerous_test_keystore: false
passphrase_service:
  type: cmd
admin_interfaces:
  - driver:
      type: websocket
      port: ${adminPort}
network:
  network_type: ${network_type}
  bootstrap_service: ${bootstrapUrl}
  transport_pool:
    - type: proxy
      sub_transport:
        type: quic
        bind_to: kitsune-quic://0.0.0.0:0
      proxy_config:
        type: remote_proxy_client
        proxy_url: ${proxyUrl}`
  ;
  fs.writeFileSync(configPath, config);
}
module.exports.generateConductorConfig = generateConductorConfig;


// async function isAppInstalled(appPort) {
//   const adminWs = await AdminWebsocket.connect(`ws://localhost:${adminPort}`);
//   console.log('Connected to admin at ' + adminPort);
//   const dnas = await adminWs.listDnas();
//   console.log('Found ' + dnas.length + ' dnas');
// }

function htos(u8array) {
  return bytesToBase64(u8array)
}


/**
 *
 * @returns {Promise<AdminWebsocket>}
 */
async function connectToAdmin(adminPort) {
  let adminWs = await AdminWebsocket.connect(`ws://localhost:${ adminPort }`);
  //log('debug',{adminWs});
  log('debug','Connected to admin at ' + adminPort);
  return adminWs;
}
module.exports.connectToAdmin = connectToAdmin;


/**
 *
 * @param adminWsg
 * @returns {Promise<boolean|boolean>}
 */
async function hasActivatedApp(adminWs) {
  const dnas = await adminWs.listDnas();
  log('debug','Found ' + dnas.length + ' dna(s)');
  for (dna of dnas) {
    log('debug',' -  ' + htos(dna));
  }
  // // Cell IDs
  // const cellIds = await adminWs.listCellIds();
  // console.log('Found ' + cellIds.length + ' Cell(s)');
  // for (cellId of cellIds) {
  //   console.log(' -  ' + htos(cellId[0]) + ' - ' + htos(cellId[1]));
  // }
  //
  // Active Apps
  const activeAppIds = await adminWs.listActiveApps();
  log('info','Found ' + activeAppIds.length + ' Active App(s)');
  for (activeId of activeAppIds) {
    log('info',' -  ' + activeId);
  }
  let hasActiveApp = activeAppIds.length == 1 && activeAppIds[0] == SYN_APP_ID;
  // Get App interfaces
  let activeAppPort = 0;
  if (hasActiveApp) {
    const interfaces = await adminWs.listAppInterfaces();
    if (interfaces.length > 0) {
      activeAppPort = interfaces[0];
    }
    log('info','Found ' + interfaces.length + ' App Interfaces(s)');
    for (appInterface of interfaces) {
      log('info',' -  ' + appInterface);
    }
  }
  return activeAppPort;
}
module.exports.hasActivatedApp = hasActivatedApp;


/**
 * Uninstall current App and reinstall with new uuid
 */
async function reinstallApp(adminWs, uuid) {
  await adminWs.deactivateApp({ installed_app_id: SYN_APP_ID });
  await installApp(adminWs, uuid);
}
module.exports.reinstallApp = reinstallApp;


/**
 *  Connect to Admin interface, install App and attach a port
 * @param adminWs
 * @param uuid
 * @returns {Promise<void>}
 */
async function installApp(adminWs, uuid) {
  // Generate keys
  let myPubKey = await adminWs.generateAgentPubKey();
  // Register Dna
  let hash = undefined;
  try {
    hash = await adminWs.registerDna({
      uuid,
      properties: undefined,
      path: './dna/syn.dna',
    });
  } catch (err) {
    log('error','[admin] registerDna() failed:');
    log('error',{err});
    return;
  }
  log('debug','registerDna response: ' + htos(hash));
  // Install Dna
  try {
    await adminWs.installApp({
      agent_key: myPubKey, installed_app_id: SYN_APP_ID, dnas: [{
        hash, nick: 'syn.dna',
      },],
    });
  } catch (err) {
    log('error','[admin] installApp() failed:');
    log('error',{err});
    return;
  }
  log('info','App installed');
  await adminWs.activateApp({ installed_app_id: SYN_APP_ID });
  log('info','App activated');
}
module.exports.installApp = installApp;
