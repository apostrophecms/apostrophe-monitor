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
  // Does this smell like an apos object, or more like the default
  // empty exports object of an app.js that doesn't export anything?
  if ((!apos) || (!apos.synth)) {
    console.error('Your app.js does not export the apos object.');
    youNeed();
    process.exit(1);
  }
  if (!apos.options.root) {
    console.error('You did not pass root to the apos object.');
    youNeed();
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
    // monitor.js can't monitor itself, nor will it change in normal use anyway
    return;
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

function youNeed() {
  console.error('\nYou need:\n');
  console.error('module.exports = require(\'apostrophe\') {');
  console.error('  root: module');
  console.error('  // the rest of your configuration follows as usual');
  console.error('};');
}
