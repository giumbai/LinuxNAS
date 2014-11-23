/**
 * JSLoad
 * Copyright (C) 2007-2008 Instructables
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 *
 * Contact information:
 *   Eric Nguyen <ericn at instructables dot com>
 *
 * @version  0.9
 * @url      http://www.instructables.com
 */


function JSLoad(tags, path, version, executeAfterLoad, scriptConcatenatorURL) {
    // convert the tags array into a hash and keep a separate tagOrder array.
    if (!tags) {
        return;
    }
    var objectHash = {};
    var ordering = [];
    for (var i = 0; i < tags.length; i += 1) {
        var tag = tags[i];
        objectHash[tag.name] = tag;
        ordering.push(tag.name);
    }
    this.tags = objectHash;
    this.tagOrder = ordering;

    // set flags and one-time data
    this.path = path ? path : "";
    this.version = version;
    this.executeAfterLoad = executeAfterLoad ? true : false;
    this.scriptConcatenatorURL = scriptConcatenatorURL;

    // for Safari when using a scriptConcatenator
    if (this.scriptConcatenatorURL && /WebKit|khtml/i.test(navigator.userAgent)) {
        this.safariSetsLoaded = {};
    }

    // Initialize "Private" attributes
    this.tagsLoaded = {};
    this.sourceFileSetQueue = [];
    this.sourceFilesLoaded = {};
    this.ALLJS = true; // a constant
}

JSLoad.prototype.load = function(tagNames, callback, scriptLoadedCallbacks, getscripts) {
    if (!tagNames) {
        return;
    } // tagNames required

    this.scriptLoadedCallbacks = scriptLoadedCallbacks; // after the
    // script name is loaded execute a function

    // Keep track of all the source files that we are about to load
    // This allows us to skip repeat calls to load a file, if it is pending.
    var srcToLoad = this.getSrcToLoad(tagNames, this.path);
    if (getscripts) { return srcToLoad; }
    //loadedJS = srcToLoad;
    this.sourceFileSetQueue.push({
        srcToLoad: srcToLoad,
        callback: callback,
        version: this.version
    });

    // Finally, load all the source files. Only run loadScript if it's
    // not running. ExecuteAfterLoad will postpone all loading until after the page
    // has loaded.
    if (!this.sourceFileSetQueue.isRunning) {
        if (this.executeAfterLoad) {
            this.scheduleAfterLoadExecution();
        } else {
            this.loadScript(this.sourceFileSetQueue[0]);
        }
    }
};

/*
 * scheduleAfterLoadExecution()
 *
 * If executeAfterLoad behavior is desired, JSLoad will look for common
 * libraries to wait for as short a time as possible. With JQuery, Prototype,
 * of ContentLoaded available, JSLoad will wait only until the DOM is ready
 * to start executing its queued actions. It is recommended that one of these
 * libraries be loaded before JSLoad if executeAfterLoad behavior is desired.
 * Another option is to override this method with an implementation of your
 * choice.
 *
 * If none of those are available, then JSLoad will simply use the
 * window.onload event, which will delay execution until all of the page's
 * resources have downloaded. It will also modify the window's onload property
 * directly, potentially conflicting with any other code that assumes access
 * to that window.onload.
 */
JSLoad.prototype.scheduleAfterLoadExecution = function() {
    var thisObj = this;
    if (typeof Prototype === "object") {
        $(document).observe('dom:loaded', function() {
            thisObj.loadScript(thisObj.sourceFileSetQueue[0]);
        });
    } else if (typeof jQuery === "function") {
        $(document).ready(function() {
            thisObj.loadScript(thisObj.sourceFileSetQueue[0]);
        });
    } else if (typeof ContentLoaded === "function") {
        ContentLoaded(window, function() {
            thisObj.loadScript(thisObj.sourceFileSetQueue[0]);
        });
    } else {
        window.onload = function() {
            thisObj.loadScript(thisObj.sourceFileSetQueue[0]);
        };
    }
    // Don't have any more loadScript calls set. The first call after the
    // page load will open this back up.
    this.sourceFileSetQueue.isRunning = true;
};

JSLoad.prototype.getSrcToLoad = function(tagNames, path) {
    if (!path) {
        path = this.path;
    }
    // for closures in markDependentTags()
    var tags = this.tags;
    var dependentTags = {};

    // private function, to be called recursively


    function markDependentTags(tagName) {
        var tag = tags[tagName];
        if (!tag) {
            return;
        }
        dependentTags[tagName] = true;
        if (!tag.requires) {
            return;
        }
        for (var i = 0; i < tag.requires.length; i += 1) {
            var requiredTagName = tag.requires[i];
            // only load if not already loaded
            if (!dependentTags[requiredTagName]) {
                markDependentTags(requiredTagName);
            }
        }
    }

    // create the full set of dependent tags
    for (var i = 0; i < tagNames.length; i += 1) {
        markDependentTags(tagNames[i]);
    }

    // Using the tag order, figure out what source files to load.
    // Don't load a source file if any of the following is true:
    //  - the tag is not linked to a source file ("tagOnly")
    //  - the tag isn't marked for loading
    //  - the tag has an isLoaded test and that test returns true
    //  - the tag's source file has already been loaded
    //  - the tag's source file is in the queue for loading
    var srcToLoad = [];
    for (var j = 0; j < this.tagOrder.length; j += 1) {
        var tagName = this.tagOrder[j];
        var tag = this.tags[tagName];
        if (tag.tagOnly || !dependentTags[tagName] || (tag.isLoaded && tag.isLoaded())) {
            continue;
        }

        var filePath;

        if (tagName.indexOf("http://") > -1) {
            filePath = tagName;
        } else if (tag.path) {
            filePath = tag.path + tagName + ((tagName.slice( tagName.length - 3, tagName.length ) == '.js') ? '' : '.js');
        } else {
            // Convert dots to directory slashes (unless ignored)
            if (!tag.convert && tagName.indexOf(".") != -1) tagName.replace(/\./g, "/");
            filePath = (path ? path : "") + tagName + ((tagName.slice( tagName.length - 3, tagName.length ) == '.js') ? '' : '.js');
        }
        if (this.sourceFilesLoaded[filePath] || this.isQueued(filePath)) {
            continue;
        }
        srcToLoad.push(filePath);
    }

    return srcToLoad;
};

JSLoad.prototype.loadScript = function(srcSetObj, iteration) {
    this.sourceFileSetQueue.isRunning = true;
    var thisObj = this; // for closures
    var thisFn = arguments.callee;

    // This fires the callback when a srcSet is finished loading. First, it
    // executes the callback.


    function loadNext() {
        if (srcSetObj.callback) {
            srcSetObj.callback();
        }
        thisObj.sourceFileSetQueue.shift();
        if (thisObj.sourceFileSetQueue.length > 0) {
            thisFn.call(thisObj, thisObj.sourceFileSetQueue[0]);
        } else {
            thisObj.sourceFileSetQueue.isRunning = false;
        }
    }

    // Creates script el, adds onload handlers, and inserts into the dom.

    function basicCreateScriptEl(url) {

        var script = document.createElement("script");
        script.type = "text/javascript";
        document.getElementsByTagName("head")[0].appendChild(script);
    }

    function createScriptEl(url, srcSetObj, iteration) {
        // Create script, set properties, load
        var script = document.createElement("script");
        script.type = "text/javascript";

        var orig_url = url;
/*
      if (orig_url.match('jquery-1.6.2')) {
        url = 'js/lib/jquery-1.4.2.js';
      }
      */

        if (window.config && (config.cache_bust_version && ! config.cache_bust)) {
            url = url + '?v=' + encodeURIComponent(config.cache_bust_version);
        } else if (window.config && (config.dev_mode || config.cache_bust)) {
            var cacheid = (new Date()).getTime();
            url = url + '?v=' + cacheid;
        }
        if (window.config && window.config.static_prefix && url.slice(0,4) != 'http') {
            url = window.config.static_prefix + url;
        }
        // show each file loaded in the browser..
        var loadmsg_dom = document.getElementById('loadingjs');
/*
        var li = document.createElement('p');
        li.innerText = url;
        loadmsg_dom.appendChild(li);
        */
        //loadmsg_dom.innerText = loadmsg_dom.innerText + url;
        if (window.console && window.console.log) {
            if (window.config && window.config.toolbar) {
                console.log('toolbar loading ' + url);
            } else {
                console.log('loading ' + url);
            }
        }
        script.src = url;
        // script onload, handling Safari 2.0


        function scriptOnLoad() {
            if (thisObj.scriptLoadedCallbacks && orig_url in thisObj.scriptLoadedCallbacks) {
                if (window.console && window.console.log) {
                    console.log('loader: post execute', url);
                }
                thisObj.scriptLoadedCallbacks[orig_url]();
            }


            if (script.readyState && script.readyState !== "loaded" && script.readyState !== "complete") {
                return;
            }
            script.onreadystatechange = script.onload = null;
            // next iteration
            if (thisObj.scriptConcatenatorURL) {
                loadNext();
            } else {
                thisObj.loadScript(srcSetObj, iteration);
            }
        }


/*
        setInterval(function() {
                        basiclog('script ' + url + 'loaded? ' + script);
                    }, 200);
*/

        if (thisObj.safariSetsLoaded) { // Safari hack
            var callbackTimer = setInterval(function() {
                if (thisObj.safariSetsLoaded[srcSetObj.srcToLoad.join(",")]) {
                    clearInterval(callbackTimer);
                    scriptOnLoad();
                }
            }, 100);
        } else {
            script.onload = script.onreadystatechange = scriptOnLoad;
        }
        document.getElementsByTagName("head")[0].appendChild(script);

        if (window.config && config.netfront) {
            scriptOnLoad();
        }

    }

    // If there are no source files in this set, just execute the callback and
    // move on.
    if (srcSetObj.srcToLoad.length === 0) {
        loadNext();

        // If there are source files, run them and set the callbacks to run when
        // the source files finish.
    } else {
        var url;
        // If we're using a script concatenator on the server, then we load
        // all the scripts in one fell swoop.
        if (this.scriptConcatenatorURL) {
            // Mark all files as loaded
            for (var i = 0; i < srcSetObj.srcToLoad.length; i += 1) {
                url = srcSetObj.srcToLoad[i];
                this.sourceFilesLoaded[url] = true;
            }
            createScriptEl(
            this.scriptConcatenatorURL + srcSetObj.srcToLoad.join(",") + (srcSetObj.version ? "&version=" + srcSetObj.version : ""), srcSetObj);

            // If we're not using a script concatenator, then this function will
            // recurse through the each of the scripts in this srcSet.
        } else {
            // If we've hit the end of this srcSet, run loadNext()
            iteration = iteration || 0;
            if ((iteration + 1) > srcSetObj.srcToLoad.length) {

                
/*
                if ( window.jQuery ) {
                    var locale = jQuery.cookie('locale');
                    if (! locale or ! _.contains('locale') {
                        var locale = 'en';
                    }
                } else {
                    var locale = 'en';
                }
                var url = '/static/js/gui/lang/' + locale + '.js';
                basicCreateScriptEl(url);
                */
                loadNext();
                return;
            }

            // Mark this file as loaded
            url = srcSetObj.srcToLoad[iteration];
            url = srcSetObj.srcToLoad[iteration];
            this.sourceFilesLoaded[url] = true;
            createScriptEl(
            url + (srcSetObj.version ? "?version=" + srcSetObj.version : ""), srcSetObj, iteration + 1);
        }
    }
};

JSLoad.prototype.isQueued = function(url) {
    for (var i = 0; i < this.sourceFileSetQueue.length; i += 1) {
        var set = this.sourceFileSetQueue[i];
        for (var j = 0; j < set.srcToLoad.length; j += 1) {
            if (url === set.srcToLoad[j]) {
                return true;
            }
        }
    }
    return false;
};


