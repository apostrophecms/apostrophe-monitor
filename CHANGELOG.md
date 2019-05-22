# Changelog

## 2.0.5

* `editorconfig`, ignore more public js for fewer unnecessary restarts. Thanks to Frederik Ekelund.

## 2.0.4

* Packaging and documentation changes only.

## 2.0.3

* This module no longer crashes after 2-3 restarts thanks to changes in `moog-require`. This is not a change in this module, but it is fundamental to making it work properly, so make sure you `npm update` your app.
* Optional profiling with the `--profile-monitor` option, which you can enable via a second `script` in `package.json` that passes it. The profiling output simply displays how long it takes to restart the app on each pass.

## 2.0.2

* Bug fix: most changes to files other than `app.js` did not fully trigger a restart of Apostrophe. This has been corrected.
* Windows: progress has been made, worked around several issues on this platform. However MongoDB `topology was destroyed` errors still occur on the third attempt. Still looking for an explanation or a workaround.

## 2.0.1

Don't try to print an error and exit if `chokidar` says `monitor.js` itself has been modified; just ignore that situation. On Windows it seems to get reported at startup, and no one is expecting `monitor.js` to monitor itself for changes, something that would only come up during development of `apostrophe-monitor` itself anyway.

## 2.0.0

Initial release.
