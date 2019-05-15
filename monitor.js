const chokidar = require('chokidar');
const clear = require('clear-require');
const fs = require('fs');
const anymatch = require('anymatch');
const quote = require('regexp-quote');

let restartable = false;
let timeout = null;

let appDir, entry, from, db;
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

appDir = unixSlashes(appDir);
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
  on = config.on;
}

ignore = ignore.map(rule => unixSlashes(rule));

let seen = {};

chokidar.watch([ appDir ], {
  ignored: function(path) {
    // We're seeing paths appear both ways, Unix and non-, on Windows
    // for each call and one always is not ignored. Normalize to Unix
    path = unixSlashes(path);
    // Same module otherwise used by chokidar
    return anymatch(ignore, path);
  }
}).on('all', change);

let apos = null;

function start() {
  const start = Date.now();
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
    const end = Date.now();
    if (apos.argv['profile-monitor']) {
      console.log('Startup time: ' + (end - start) + 'ms');
    }
    console.error('Waiting for changes...');
    restartable = true;
  };
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
  // otherwise we keep getting the same apos object back
  clear(from);
  if (!restartable) {
    if (!timeout) {
      timeout = setTimeout(function() {
        timeout = null;
        // bind it to monitor-config.js on chokidar event
        on(event, filename, apos);
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

function unixSlashes(s) {
  return s.replace(new RegExp(quote(require('path').sep), 'g'), '/');
}

function youNeed() {
  console.error('\nYou need:\n');
  console.error('module.exports = require(\'apostrophe\') {');
  console.error('  root: module');
  console.error('  // the rest of your configuration follows as usual');
  console.error('};');
}
