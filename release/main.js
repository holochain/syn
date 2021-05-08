// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu, shell } = require('electron');
const spawn = require('child_process').spawn;
const fs = require('fs');
const path = require('path');
const kill = require('tree-kill');
const { dialog } = require('electron');
const prompt = require('electron-prompt');

// My Modules
const { log, logger } = require('./logger');
const { wslPath, killAllWsl } = require('./cli');
const {SYN_APP_NAME,generateConductorConfig, spawnKeystore,
  DEFAULT_BOOTSTRAP_URL, CONDUCTOR_CONFIG_FILENAME, CONFIG_PATH, STORAGE_PATH,
  hasActivatedApp, connectToAdmin, installApp, reinstallApp} = require('./config');

// -- Code -- //

// Toggle this for debug / release mode
const g_canDebug = false;

require('electron-context-menu')();
require('fix-path')();
// enables the devtools window automatically
if (g_canDebug) {
  require('electron-debug')({ isEnabled: true });
}

/** CONSTS **/

// default for linux
var HOLOCHAIN_BIN     = './bin/holochain-linux';
var LAIR_KEYSTORE_BIN = './bin/lair-keystore-linux';

if (process.platform === "win32") {
  HOLOCHAIN_BIN     = 'holochain-linux';
  LAIR_KEYSTORE_BIN = 'lair-keystore-linux';
} else if (process.platform === 'darwin') {
  HOLOCHAIN_BIN     = './bin/holochain';
  LAIR_KEYSTORE_BIN = './bin/lair-keystore';
}


// a special log from the conductor,
// specifying that the interfaces are ready to receive incoming connections
const HC_MAGIC_READY_STRING = 'Conductor ready.';

//const g_adminPort = 1235;
//const g_adminPort = 1200 + Math.floor(Math.random() * 100); // Randomized admin port on each launch
var g_adminPort = 0;
var g_appPort = 0;
//var g_appPort = 8900 + Math.floor(Math.random() * 100); // Randomized port on each launch
//log('debug',{g_appPort});
const g_errorUrl = 'file://' + __dirname + '/ui/error.html';
//const g_indexUrl = 'file://' + __dirname + '/ui/index.html?APP=' + g_appPort;
var g_indexUrl = 'file://' + __dirname + '/ui/index.html?APP=';
//log('debug', 'g_indexUrl = ' + g_indexUrl);
// -- Start-up stuff -- //

/** Add Holochain bins to PATH for WSL */
const BIN_DIR = "bin";
const BIN_PATH = path.join(__dirname, BIN_DIR);
log('debug', 'BIN_PATH = ' + BIN_PATH);
if (process.platform === "win32") {
  process.env.PATH += ';' + BIN_PATH;
}

// --  GLOBALS  -- //

// Keep a global reference of the ELECTRON window object, if you don't,
// the window will be closed automatically when the JavaScript object is garbage collected.
let g_mainWindow = undefined;
let g_holochain_proc = undefined;
let g_keystore_proc = undefined;
let g_canQuit = true;
let g_canMdns = false;
let g_bootstrapUrl = '';
let g_uuid = '';
let g_proxyUrl = '';
let g_storagePath = STORAGE_PATH;
let g_configPath = undefined;
let g_adminWs = undefined;

// --  Create missing dirs -- //

if (!fs.existsSync(CONFIG_PATH)) {
  log('info', "Creating missing dir: " + CONFIG_PATH);
  fs.mkdirSync(CONFIG_PATH)
}
if (!fs.existsSync(STORAGE_PATH)) {
  log('info', "Creating missing dir: " + STORAGE_PATH);
  fs.mkdirSync(STORAGE_PATH)
}
// get specific storage folder from argv
if (process.argv.length > 2) {
  g_storagePath = path.join(STORAGE_PATH, process.argv[2]);
  log('debug',{g_storagePath});
  if (!fs.existsSync(g_storagePath)) {
    log('info', "Creating missing dir: " + g_storagePath);
    fs.mkdirSync(g_storagePath)
  }
}
// Determine final conductor config file path
g_configPath = path.join(g_storagePath, CONDUCTOR_CONFIG_FILENAME);
log('debug',{g_configPath});

// -- Set Globals from current conductor config --/

// tryLoadingConfig()
{
  try {
    const conductorConfigBuffer = fs.readFileSync(g_configPath);
    const conductorConfig = conductorConfigBuffer.toString();
    //console.log({conductorConfig})
    // Get Admin PORT
    let regex = /port: (.*)$/gm;
    let match = regex.exec(conductorConfig);
    //console.log({match});
    g_adminPort = match[1];
    // Get bootstrap server URL
    regex = /bootstrap_service: (.*)$/gm;
    match = regex.exec(conductorConfig);
    //console.log({match})
    g_bootstrapUrl = match[1];
    // Get proxy server URL
    regex = /proxy_url: (.*)$/gm;
    match = regex.exec(conductorConfig);
    g_proxyUrl = match[1];
    log('debug',{ g_proxyUrl });
  } catch(err) {
    if(err.code === 'ENOENT') {
      log('error', 'File not found: ' + g_configPath);
    } else {
      log('error','Loading config file failed: ' + err);
    }
    log('error','continuing...');
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Create the main window global
 */
function createWindow() {
  // Create the browser window.
  let mainWindow = new BrowserWindow({
    width: 1400,
    height: 1000,
    webPreferences: {
      nodeIntegration: true,
      devTools: true
    },
    icon: __dirname + `/assets/favicon.png`,
    webgl: false,
    enableWebSQL: false,
    //autoHideMenuBar: true,
  });

  // and load the index.html of the app.
  //mainWindow.loadURL(g_indexUrl);

  // Open <a href='' target='_blank'> with default system browser
  mainWindow.webContents.on('new-window', function (event, url) {
    event.preventDefault();
    shell.openExternal(url).then(_r => {});
  });

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    log('debug', '*** mainWindow Closed');
    try {
      killHolochain();
    } catch (err) {
      log('error', '*** Error while closing Holochain:');
      log('error', err);
    }
    log('info', '*** Holochain Closed');
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    g_mainWindow = null;
  });

  // Done
  return mainWindow;
}


/**
 *
 */
async function spawnHolochainProc() {
  // Adapt to WSL if needed
  let bin = HOLOCHAIN_BIN;
  let args = ['-c', wslPath(g_configPath)];
  if (process.platform === "win32") {
    bin = process.env.comspec;
    args.unshift("/c", "wsl", HOLOCHAIN_BIN);
  }
  // Spawn "holochain" subprocess
  log('info', 'Spawning ' + bin + ' (dirname: ' + __dirname + ')');
  let holochain_proc = spawn(bin, args, {
    cwd: __dirname,
    env: {
      ...process.env,
      RUST_BACKTRACE: 1,
    },
  });
  // Handle error output
  holochain_proc.stderr.on('data', (data) => log('error', 'holochain> ' + data.toString()));
  // if "holochain" exit, close the app
  holochain_proc.on('exit', (code, signal) => {
    if (signal) {
      log('info', `holochain process terminated due to receipt of signal ${signal}`)
    } else {
      log('info', `holochain process terminated with exit code ${code}`)
    }
    // g_canQuit = true;
    if (g_canQuit) {
      app.quit();
    }
  });
  // Wait for holochain to boot up
  await new Promise((resolve, _reject) => {
    holochain_proc.stdout.on('data', (data) => {
      let output = data.toString();
      log('info', 'holochain: ' + output);
      if(output.indexOf(HC_MAGIC_READY_STRING) > -1) {
        let regex = /###ADMIN_PORT:([0-9]*)###/gm;
        let match = regex.exec(output);
        //console.log({match});
        g_adminPort = match[1];
        resolve();
      }
    });
  });
  // Done
  g_holochain_proc = holochain_proc;
}

/**
 *
 */
function killHolochain() {
  // SIGTERM by default
  if (g_holochain_proc) {
    log('info', 'Killing holochain sub processes...');
    kill(g_holochain_proc.pid, function(err) {
      if (!err) {
        log('info', 'killed all holochain sub processes');
      } else {
        log('error', err)
      }
    });
  }
  if (g_keystore_proc) {
    log('info', 'Killing lair-keystore sub processes...');
    kill(g_keystore_proc.pid, function(err) {
      if (!err) {
      log('info', 'killed all lair-keystore sub processes');
      } else {
        log('error', err)
      }
    });
  }
  // Make sure there is no outstanding holochain procs
  log('info', 'Killing WSL sub processes...');
  killAllWsl(HOLOCHAIN_BIN);
  killAllWsl(LAIR_KEYSTORE_BIN);
}


/**
 * Prepare conductor config and spawn holochain subprocess
 * @param canRegenerateConfig - Regenerate the conductor config before relaunching the holochain process.
 */
async function startConductor(canRegenerateConfig) {
  g_canQuit = false;
  killHolochain(); // Make sure there is no outstanding Holochain & keystore procs
  g_keystore_proc = await spawnKeystore(LAIR_KEYSTORE_BIN);
  //await sleep(2000);
  if (canRegenerateConfig) {
    generateConductorConfig(g_configPath, g_bootstrapUrl, g_storagePath, g_proxyUrl, g_adminPort, g_canMdns);
  }
  log('info', 'Launching conductor...');
  await spawnHolochainProc();
  g_canQuit = true;
  // Connect to Conductor and activate app
  try {
    log('debug','Connecting to admin at ' + g_adminPort + ' ...');
    g_adminWs = await connectToAdmin(g_adminPort);
    let activeAppPort = await hasActivatedApp(g_adminWs);
    if(activeAppPort === 0) {
      // Prompt for UUID
      g_uuid = '<my-network-name>';
      await promptUuid(true);
      await installApp(g_adminWs, g_uuid);
      //log('debug','Attaching to app at ' + g_appPort + ' ...');
      g_appPort = await g_adminWs.attachAppInterface({port: 0});
      console.log({g_appPort});
      g_appPort = g_appPort.port;
      log('info','App Interface attached: ' + g_appPort);
    } else {
      g_appPort = activeAppPort;
    }
    g_indexUrl += '' + g_appPort;
    console.log({g_indexUrl});
  } catch (err) {
    log('error', 'Conductor setup failed:');
    log('error',{err});
    //// Better to kill app if holochain not connected
    //app.quit();
  }
}

/**
 * This method will be called when Electron has finished initialization and is ready to create browser windows.
 * Some APIs can only be used after this event occurs.
 */
app.on('ready', async function () {
  log('info', 'Electron App readying...');
  // Create main window
  g_mainWindow = createWindow();
  try {
    // Start Conductor
    // if bootstrapUrl not set, prompt it, otherwise
    if(g_bootstrapUrl === "") {
      g_bootstrapUrl = DEFAULT_BOOTSTRAP_URL;
      await promptNetworkType(true);
      log('debug', 'network type prompt done: ' + g_canMdns);
      if (!g_canMdns) {
        await promptBootstrapUrl(true);
      }
      await startConductor(true);
    } else {
      await startConductor(true);
    }
    // trigger refresh once we know interfaces have booted up
    log('debug',"Loading index.html: " + g_indexUrl);
    await g_mainWindow.loadURL(g_indexUrl);
  } catch (err) {
    log('error','Holochain init failed:');
    log('error',{err});
    await g_mainWindow.loadURL(g_errorUrl);
  }

});


/**
 * This event will be emitted inside the primary instance of your application when a second instance has been executed
 * and calls app.requestSingleInstanceLock().
 */
app.on('second-instance', (_event) => {
  log('warn','\n\n second-instance detected !!! \n\n')
});

/**
 * When main window has been closed and the application will quit, destroy conductor subprocess
 */
app.on('will-quit', (event) => {
  log('debug','*** App will-quit');
  if (!g_canQuit) {
    event.preventDefault();
    //killHolochain();
  }
});

/**
 * Quit when all windows are closed.
 */
app.on('window-all-closed', function () {
  log('debug','*** App window-all-closed');
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    //g_canQuit = true;
    app.quit();
  }
});

/**
 *
 */
app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (g_mainWindow === null) {
    g_mainWindow = createWindow();
  }
});


// -- Prompts and Menu -- //

/**
 * @returns false if user cancelled
 */
async function promptNetworkType(canExitOnCancel) {
  let r = await prompt({
    title: 'Select network type',
    height: 180,
    width: 300,
    alwaysOnTop: true,
    label: 'Choose network type:',
    value: g_proxyUrl,
    type: 'select',
    selectOptions: {
      'true': 'mDNS (LAN)',
      'false': 'Bootstrap server (WAN)',
    }
  });
  if(r === null) {
    log('debug','user cancelled. Can exit: ' + canExitOnCancel);
    if (canExitOnCancel) {
      app.quit();
    }
  } else {
    log('debug','promptNetworkType result: ', r);
    g_canMdns = r === 'true';
  }
  return r !== null
}

/**
 * @returns false if user cancelled
 */
async function promptBootstrapUrl(canExitOnCancel) {
  let r = await prompt({
    title: `${SYN_APP_NAME}: Bootstrap Server URL`,
    height: 180,
    width: 600,
    alwaysOnTop: true,
    label: 'URL:',
    value: g_bootstrapUrl,
    inputAttrs: {
      type: 'url'
    },
    type: 'input'
  });
  if(r === null) {
    log('debug','user cancelled. Can exit: ' + canExitOnCancel);
    if (canExitOnCancel) {
      app.quit();
    }
  } else {
    log('debug','result', r);
    g_bootstrapUrl = r;
  }
  return r !== null
}

/**
 * @returns false if user cancelled
 */
async function promptUuid(canExitOnCancel) {
  let r = await prompt({
    title: `${SYN_APP_NAME}: Network Unique identifier`,
    height: 180,
    width: 500,
    alwaysOnTop: true,
    label: 'UUID:',
    value: g_uuid,
    inputAttrs: {
      type: 'string'
    },
    type: 'input'
  });
  if(r === null) {
    log('debug','user cancelled. Can exit: ' + canExitOnCancel);
    if (canExitOnCancel) {
      app.quit();
    }
  } else {
    log('debug','result', r);
    g_uuid = r;
  }
  return r !== null
}

/**
 * @returns false if user cancelled
 */
async function promptProxyUrl(canExitOnCancel) {
  let r = await prompt({
    title: 'Proxy Server URL',
    height: 180,
    width: 800,
    alwaysOnTop: true,
    label: 'URL:',
    value: g_proxyUrl,
    inputAttrs: {
      type: 'url'
    },
    type: 'input'
  });
  if(r === null) {
    log('debug','user cancelled. Can exit: ' + canExitOnCancel);
    if (canExitOnCancel) {
      app.quit();
    }
  } else {
    log('debug','result', r);
    g_proxyUrl = r;
  }
  return r !== null
}

/**
 * In this file you can include the rest of your app's specific main process code.
 * You can also put them in separate files and require them here.
 */

const menutemplate = [
  {
    label: 'File', submenu: [{
      label: 'Quit',
      accelerator: 'Command+Q',
      click: function () {
        app.quit()
      },
    },],
  },
  {
    label: 'Edit',
    submenu: [
      {
        label: 'Change Network type',
        click: async function () {
          await promptNetworkType(false);
          await startConductor(true);
        },
      },
      {
        label: 'Change Bootstrap Server', click: async function () {
          let changed = await promptBootstrapUrl(false);
          if (changed) {
            await startConductor(true);
          }
        }
      },
      {
        label: 'Change Proxy Server', click: async function () {
          let changed = await promptProxyUrl(false);
          if (changed) {
            await startConductor(true);
          }
        }
      },
      {
        label: 'Change Network UUID',
        click: async function () {
          await promptUuid(false);
          await reinstallApp(g_adminWs, g_uuid);
        },
      },
      {
        label: 'Restart Conductor', click: async function () {
          await startConductor(false);
        }
      },
    ],
  },
  {
    label: 'Debug',
    submenu: [
      // {
      //   label: 'Dump logs', click: function() {
      //     console.log({process})
      //   }
      // },
      {
        label: 'Open Config Folder',
        click: function () {
          shell.openItem(CONFIG_PATH)
        },
        //icon: 'assets/icon.png'
      },
      {
        label: 'Open Log File',
        click: function () {
          shell.openItem(logger.transports.file.file)
        },
      },
      {
        label: 'devTools',
        click: function () {
          g_mainWindow.webContents.openDevTools()
        },
      },
      {
        label: 'Show PATHS',
        click: function () {
          dialog.showMessageBoxSync(g_mainWindow, {
            type: 'info',
            title: 'Constants',
            message: 'BIN_PATH: ' + BIN_PATH + '\n' + 'process.env.path: ' + JSON.stringify(process.env.PATH),
          });
        },
      },
    ],
  },
];

Menu.setApplicationMenu(Menu.buildFromTemplate(menutemplate));
