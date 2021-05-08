const electronLogger = require('electron-log');

// SET UP LOGGING

function log(level, message) {
  electronLogger[level](message);
}
module.exports.log = log;
module.exports.logger = electronLogger;
