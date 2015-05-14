# grunt-este-watch 

This a fork of the original grunt-este-watch repository, and is created for the Kerberos.io repository. Source code have been minified: removed support for livereload, only rely on file changes, don't check if file is locked anymore, update styling.

## Getting Started
This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-este-watch --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-este-watch');
```

## Watch task
_Run this task with the `grunt esteWatch` command._

### Settings

#### options.dirs

Note you have to specify only directory ('dir'), or directory recursively ('dir/**/') with all its subdirectories.

Type: `Array.<string>`
Default:
```js
[
  'bower_components/closure-library/**/',
  'bower_components/este-library/**/',
  '!bower_components/este-library/node_modules/**/',
  'client/**/{js,css}/**/'
]
```

List of watched directories

### Examples

Watch and compile CoffeeScript.
```coffee
esteWatch:
  options:
    # just a dirs, no file paths
    dirs: ['dirOne/**/', 'dirTwo/**/']

  'coffee': (filepath) ->
      files = [
        expand: true
        src: filepath
        ext: '.js'
      ];
      grunt.config ['coffee', 'app', 'files'], files
      ['coffee:app']

  # to define all
  '*': (filepath) ->
    return ['urequire:uberscoreUMD']
```

From [github.com/steida/este](http://github.com/steida/este) Gruntfile.coffee.

```js
grunt.initConfig({
  esteWatch: {
    options: {
      dirs: ['bower_components/closure-library/**/',
      'bower_components/este-library/**/',
      '!bower_components/este-library/node_modules/**/',
      'client/**/{js,css}/**/']
    },
    coffee: function(filepath) {
      var files = [{
        expand: true,
        src: filepath,
        ext: '.js'
      }];
      grunt.config(['coffee', 'app', 'files'], files);
      grunt.config(['coffee2closure', 'app', 'files'], files);
      return ['coffee:app', 'coffee2closure:app'];
    },
    soy: function(filepath) {
      grunt.config(['esteTemplates', 'app'], filepath);
      return ['esteTemplates:app'];
    },
    js: function(filepath) {
      grunt.config(['esteUnitTests', 'app', 'src'], filepath);
      var tasks = ['esteDeps:all', 'esteUnitTests:app'];
      if (grunt.option('stage')) {
        tasks.push('esteBuilder:app');
      }
      return tasks;
    },
    styl: function(filepath) {
      grunt.config(['stylus', 'all', 'files'], [{
        expand: true,
        src: filepath,
        ext: '.css'
      }]);
      return ['stylus:all', 'stylus:app'];
    },
    css: function(filepath) {
      if (grunt.option('stage')) {
        return 'cssmin:app';
      }
    }
  }
});
```
### FAQs

#### What's wrong with official grunt-contrib-watch?
It's slow and buggy, because it uses combination fs.fileWatch and fs.watch, for
historical reason. From Node 0.9.2+, fs.watch is ok.

[github.com/steida/este](http://github.com/steida/este) needs maximum performance and
stability, so that's why I had to create yet another Node.js file watcher.
This watcher is continuously tested on Mac, Linux, Win platforms.

#### grunt-contrib-watch Issues
  - Strange "Abort trap: 6" exceptions.
  - File added in new directory isn't detected.
  - LiveReload console.log mess during livereloading.
  - Polling to much files. Etc.
  
#### Note about editors atomic save
Node.js fs.watch sometimes does not work with editors atomic save. For example, Node.js v0.10.17 works while
v0.10.18 doesn't. Fix for SublimeText is easy, just disable it via ```"atomic_save": false```.

## License
Copyright (c) 2013 Daniel Steigerwald

Licensed under the MIT license.
