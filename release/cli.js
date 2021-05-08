const { spawnSync } = require('child_process');
//const path = require('path');
const { log } = require('./logger');

/**
 * On windows, call `wsl wslpath` on filePath to convert it to a wsl compatible filepath usable within wsl
 * @param filePath
 * @returns {string|*}
 */
function wslPath(filePath) {
  if (process.platform !== "win32") {
    return filePath;
  }
  let fp = filePath.replace(/\\/g, "\\\\");
  let wslparams = ["/c", "wsl", "wslpath", "-a", fp];
  let { stdout, stderr, error } = spawnSync(
    process.env.comspec,
    wslparams,
    {cwd: __dirname}
  );
  if (stderr) {
    log('error', stderr.toString());
  }
  if (error) {
    log('error', error.toString());
  }
  stdout = stdout? stdout.toString() : "";
  log('debug',"CLI wslPath; got results: " + stdout);
  fp = stdout.substring(0, stdout.length - 1); // remove 'return' char
  return fp
}
module.exports.wslPath = wslPath;

/**
 * Make sure there is no outstanding holochain process in wsl by calling `killall` command
 */
function killAllWsl(psname) {
  if (process.platform !== "win32") {
    return;
  }
  log('info', 'killAllWsl:' + psname);
  let { stdout, stderr, error } = spawnSync(
    process.env.comspec,
    ["/c", "wsl", "killall", psname],
    {cwd: __dirname},
  );
  if (stdout) {
    log('info', stdout.toString());
  }
  if (stderr) {
    log('error', stderr.toString());
  }
  if (error) {
    log('error', error.toString());
  }
  //log('info', 'killAllWsl:' + psname + ' - DONE');
}
module.exports.killAllWsl = killAllWsl;


// /**
//  *
//  */
// function executablePath() {
//   let executable;
//   if (process.platform === "win32") {
//     return process.env.comspec;
//   }
//   if (process.platform === "darwin") {
//     executable = "./hc-darwin"
//   } else if (process.platform === "linux") {
//     executable = "./hc-linux"
//   } else {
//     log('error', "unsupported platform: " + process.platform);
//     return
//   }
//   return path.join(__dirname, executable)
// }
// module.exports.executablePath = executablePath;
