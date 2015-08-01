/**
  @fileoverview File watcher for Grunt.js
  Copyright (c) 2013 Daniel Steigerwald
*/
module.exports = function(grunt)
{
    var fs = require('fs');
    var path = require('path');
    var tinylr = require('tiny-lr-fork');
    var semver = require('semver');
    var chokidar = require('chokidar');
    
    var RESTART_WATCHERS_DEBOUNCE = 10;
    var WAIT_FOR_UNLOCK_INTERVAL = 10;
    var WAIT_FOR_UNLOCK_TRY_LIMIT = 50;

    var done;
    var esteWatchTaskIsRunning = false;
    var filesChangedWithinWatchTask = [];
    var firstRun = true;
    var options;
    var watchers = [];
    var unlockTimer = null;

    grunt.registerTask('esteWatch', 'Este files watcher.', function()
    {
        options = this.options(
        {
            dirs: [],
            ignoredFiles: [],
            beep: false
        });

        done = this.async();
        esteWatchTaskIsRunning = false;

        if(firstRun)
        {
            firstRun = false;
            restartWatchers();
        }

        //memwatch.gc();
        dispatchWaitingChanges();
    });

    grunt.registerTask('process', function()
    {
        done = this.async();
        esteWatchTaskIsRunning = false;
        dispatchWaitingChanges();
    });

    // TODO: handle hypothetic situation, when task create dir
    var restartWatchers = function()
    {
        //closeWatchers();
        var allDirs = grunt.file.expand(options.dirs);
        watchDirs(allDirs);
    };

    var dispatchWaitingChanges = function()
    {
        var waitingFiles = grunt.util._.uniq(filesChangedWithinWatchTask);
        var ignoredFiles = filesChangedWithinWatchTask.dispatcher;

        filesChangedWithinWatchTask = [];
        waitingFiles.forEach(function(filepath)
        {
            if (filepath == ignoredFiles)
            {
                return;
            }
            onFileChange(filepath);
        });
    };

    var closeWatchers = function()
    {
        watchers.forEach(function(watcher)
        {
            watcher.close();
        });
        watchers = [];
    };

    var watchDirs = function(dirs)
    {
        dirs.forEach(function(dir)
        {
            /*var watcher = chokidar.watch(dir, {ignored: /[\/\\]\./ , ignoreInitial: true, persistent: true})
            watcher.on('all', function(event, filepath, stats)
            {
                var filename = path.basename(filepath)
                onDirChange(event, filepath, dir);
            });*/
            
            var watcher = fs.watch(dir, {'persistent': true}, function(event, filename)
            {
                onDirChange(event, filename, dir);
            });
            
            watchers.push(watcher);
        });
    };

    var onDirChange = function(event, filename, dir)
    {
        var filepath = path.join(dir || '', filename || '');
        filepath = filepath.replace(/\\/g, '/');
        onFileChange(filepath);
    };

    var onFileChange = function(filepath)
    {
        var minimatchOptions =
        {
            dot: true,
            matchBase: true, 
            nocomment: true, 
            nonegate: true
        };

        if(grunt.file.isMatch(minimatchOptions, options.ignoredFiles, filepath))
        {
            return;
        }

        // postpone changes occured during tasks execution
        if(esteWatchTaskIsRunning)
        {
            grunt.verbose.writeln('filesChangedWithinWatchTask.push ' + filepath);
            filesChangedWithinWatchTask.push(filepath);
            return;
        }

        if(grunt.task.current.name == 'esteWatch')
        {
            esteWatchTaskIsRunning = true;
            // We have to track file which dispatched watch task, because on Windows
            // file change dispatches two or more events, which is actually ok, but
            // we have to ignore these changes later.
            // https://github.com/joyent/node/issues/2126
            filesChangedWithinWatchTask.dispatcher = filepath;
        }

        // run tasks for changed file
        var tasks = getFilepathTasks(filepath);
        tasks.push('process');
        grunt.task.run(tasks);
        done();
    };

    var getFilepathTasks = function(filepath)
    {
        var ext = path.extname(filepath).slice(1);
        var config = grunt.config.get(['esteWatch', ext]);
        if (!config)
        {
            config = grunt.config.get(['esteWatch', '*']);
        }
        if (!config)
        {
            return [];
        }

        var tasks = config(filepath) || [];
        if (!Array.isArray(tasks))
        {
            tasks = [tasks];
        }
        
        return tasks;
    };
};