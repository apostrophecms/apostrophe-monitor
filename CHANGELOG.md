# Changelog

## 2.0.1

Don't try to print an error and exit if `chokidar` says `monitor.js` itself has been modified; just ignore that situation. On Windows it seems to get reported at startup, and no one is expecting `monitor.js` to monitor itself for changes, something that would only come up during development of `apostrophe-monitor` itself anyway.

## 2.0.0

Initial release.
