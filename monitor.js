const chokidar = require('chokidar');
const clear = require('clear-require');
const fs = require('fs');
let restartable = false;
let timeout = null;

let appDir, entry, from;
try {
  appDir = process.cwd();
  entry = require(appDir + '/package.json').main;
  from = appDir + '/' + entry;
  appDir = require('path').dirname(from);
} catch (e) {
  if (entry) {
    console.error(e);
    if (!entry.match(/\.\w+$/)) {
      // Intentionally add this late, for 
      entry += '.js';
    }
    console.error('Unable to find app.js at ' + entry + '.');
  } else {
    console.error('You need to run this from an Apostrophe site\'s main folder.');
    console.error('Hint: npm install it, locally to that project, and run\n');
    console.error('"npx monitor". (Yes, the "x" is correct.)');
  }
}

console.log('Watching ' + appDir);

let ignore = [
  appDir + '/node_modules/**',
  appDir + '/public/modules/**',
  appDir + '/public/uploads/**',
  appDir + '/public/css/master-*',
  appDir + '/locales/**',
  appDir + '/data/temp/**'
];
let config;
if (fs.existsSync(appDir + '/monitor-config.js')) {
  config = require(appDir + '/monitor-config.js');
  ignore = ignore.concat(config.addIgnore || []);
}

let seen = {};

chokidar.watch([ appDir ], {
  ignored: ignore
}).on('all', change);

let apos = null;

function start() {
  const now = Date.now();
  if (apos) {
    console.error('Restarting in response to changes...');
  }
  apos = require(from);
  if (!apos) {
    console.error('Your app.js does not export the apos object.');
    console.error('You need: module.exports = require(\'apostrophe\'){ ... }');
    process.exit(1);
  }
  apos.options.afterListen = function(err) {
    if (err) {
      console.error(err);
    }
    console.error('Waiting for changes...');
    restartable = true;
  }
}

function change(event, filename) {
  if (!filename) {
    return;
  }
  if (filename === module.filename) {
    // We CAN restart app.js, but we can't restart monitor.js
    console.error('Cannot self-restart "monitor.js" itself. Start again manually.');
    process.exit(1);
  }
  clear(filename);
  if (!restartable) {
    if (!timeout) {
      timeout = setTimeout(function() {
        timeout = null;
        return change(filename);
      }, 100);
    }
    return;
  }
  if (timeout) {
    clearTimeout(timeout);
    timeout = null;
  }
  restart();
}

function restart() {
  restartable = false;
  return apos.destroy(function(err) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    start();
  });
}

start();

