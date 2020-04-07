A monitor to automatically restart Apostrophe when you make changes to your code. For use during site development. Like `nodemon`, but with much faster restarts because it understands Apostrophe.

## Installation

```
npm install apostrophe-monitor
```

```
// Next, in your app.js file:
// * You must EXPORT the apos object.
// * You must PASS MODULE as the ROOT option.

module.exports = require('apostrophe')({
  root: module
});
```

Next, add a command to the `scripts` section of your `package.json` so you can run the monitor:

```
  "scripts": {
    "monitor": "monitor"
  },
```

Now you can launch your site with monitoring!

```
npm run monitor
```

Your site starts up. Now change a file like `app.js` or `lib/modules/apostrophe-pages/index.js` or even `lib/modules/apostrophe-pages/views/pages/home.html`.

When you save the change in your editor, your site automatically restarts.

> This is the command you'll run forevermore when you're ready to start your site in development. **Leave it running**, it will **automatically** restart as you save changes to your code.

## Configuration options

```
// In monitor-config.js in the root of your project
module.exports = {
  addIgnore: [ '/data/some-dynamic-content-here/**' ]
}
```

`addIgnore` should be an array of [anymatch](https://npmjs.org/package/anymatch)-compatible patterns starting with a `/`.

`apostrophe-monitor` always ignores:

```
  '/node_modules/**',
  '/public/modules/**',
  '/public/uploads/**',
  '/public/css/master-*',
  '/locales/**',
  '/data/temp/**'
```

## If it doesn't work

You probably:

* (a) forgot to export your `apos` object with `module.exports` in `app.js`, or
* (b) forgot to pass `module` as the `root` option to Apostrophe, or
* (c) didn't set `main` correctly in your `package.json` (for instance, `main` says `index.js` but your site is in `app.js`).

## If your app restarts too much

You need to use `addIgnore`, see above. Send a PR if you find a common Apostrophe content folder (as opposed to code folder) that we forgot to ignore.

## Why is it faster than `nodemon`?

This module is faster than `nodemon` because it doesn't restart the whole process and, crucially, it doesn't clear the entire `require` cache of Node.js. Just the files you change. Most of Apostrophe's startup time goes into reading so many `.js` files at startup.

## Why is it only for Apostrophe?

With Apostrophe, we know how to create a new `apos` object and destroy an old one. But for other applications... who knows? That's why `nodemon` simply restarts the process.

## Freeing your own resources when Apostrophe restarts

If you have your own listening sockets, database connections and file handles open in your custom Apostrophe modules, you should listen to the `apostrophe:destroy` promise event and clean up:

```
// in lib/modules/some-module-name/index.js
module.exports = {
  construct: function(self, options) {
  	self.conn = connectToSomeDatabaseYouLike();
  	self.on('apostrophe:destroy', 'closeConnection', function() {
  	  return self.conn.close();
	});
  }
}
```

Your handler may return a promise and it will resolve before this module creates the next `apos` object.
