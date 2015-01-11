/*
Adapter script for bt apps.
wants "client" to be defined
 */

(function(_) {
    BTApp = function(webclient, window_location) { 
        this.webclient = webclient;
        this.window_location = window_location;
        this._resource_cache = {};
        this._listeners = {};
        var _this = this;
        _this.proxy_jQuery = null; // later this will be replaced by
        // the appp/proxy version... be patient!
        var methods = {

            sendtopeer: function(channel, recipient, message) {
                raptor.post( { action: 'send-message' }, { address: recipient, message: message } );
            },

            _register_event: function(name, callback) {
                if (! _this._listeners[name]) {
                    _this._listeners[name] = [];
                }
                _this._listeners[name].push(callback);
            },
            _trigger_event: function(name,data) {
                data.appid = this._app.update_url_hash;
                if (_this._listeners[name]) {
                    for (var i = 0;i<_this._listeners[name].length;i++) {
                        var cb = _this._listeners[name][i];
                        if (typeof cb != 'function') { debugger; }
                        cb( data );

                    }
                }
            },
            determine_app_from_location: function(location) {
                var parts = location.pathname.split('/');
		var _this = this;
                if (parts[1] == 'gui') { parts.splice(1,1); /* webui */ }
                if (parts[1] == 'static' && parts[2] == 'apps') {
                    var app_alias = parts[3];
                    var app = null;
                    _.each( this.webclient.app.featured_apps, function( def ) {
                        if (def['alias'] == app_alias) {
                            app = _this.webclient.app.get(def['app_update_url']);
                        }
                    } );

                    if (app) {
                        return app;
                    } else {
                        // app not found!
                        debugger;
                    }
                } else {
                    var matches = location.pathname.match('/([A-F0-9]{40}).btapp/');
                    if (matches && matches.length == 2) {
                        var hash = matches[1];
                        var app = _this.webclient.app.getwith( { update_url_hash: hash } );
                        if (app) { return app; }
                    }
                    if (window.console && console.error)
                      console.error('app not determined by location');
                      debugger;
                }
            },

            _get_xhr_prefix: function() {
                return '/appsxhr';
            },
            _stash_sanity_check: function() {
                if (! _this.proxy_jQuery) {
                    console.error('proxied jQuery has not been initialized yet');
                    debugger;
                }
                if (! _this.proxy_jQuery.jStorage.get(this._stash_ns) || typeof _this.proxy_jQuery.jStorage.get(this._stash_ns) != 'object') {
                    _this.proxy_jQuery.jStorage.set(this._stash_ns,{});
                }
            },

            add: { 
                torrent: function(url, defaults, cb) {
                    if (! url) { debugger; }
                    this.webclient.torrent.add_from_app(url, _this._app, cb);
                },
                rss_feed: function(url) {
                    return this.webclient.feed.add(url);
                },
                rss_filter: function(name) {
                    debugger;
                }
            },
            properties: {
                set: function(k,v) {
                    console.log('btapp set property',k,v);
                    // i.e. set background
                }
            },
            stash: { 
                all: function() {
                    _this._stash_sanity_check();
                    return _this.proxy_jQuery.jStorage.get(_this._stash_ns);
                },
                keys: function() {
                    _this._stash_sanity_check();
                    var stash = _this.proxy_jQuery.jStorage.get(_this._stash_ns);
                    stash['installed_apps'] = [];
                    return _.keys(stash);
                },
                get: function(k,d) {
                    if (k == 'installed_apps') {
                        return JSON.stringify( _.map( this.webclient.app._apps, function(app) { return app.update_url; } ) );
                    }
                    _this._stash_sanity_check();

                    var val = _this.proxy_jQuery.jStorage.get(_this._stash_ns)[k];
                    return (val === undefined) ? d : val;
                },
                set: function(k,v) {
                    _this._stash_sanity_check();
                    var stash = _this.proxy_jQuery.jStorage.get(_this._stash_ns);
                    // stash can be undefined?? (stash sanity check should
                    // have taken care of this...)
                    stash[k] = v;
                    _this.proxy_jQuery.jStorage.set(_this._stash_ns, stash);
                },
                unset: function(k) {
                    _this._stash_sanity_check();
                    var stash = _this.proxy_jQuery.jStorage.get(_this._stash_ns);
                    // stash can be undefined?? (stash sanity check should
                    // have taken care of this...)
                    stash[k] = null;
                    _this.proxy_jQuery.jStorage.set(_this._stash_ns, stash);
                },
                _clear: function() {
                    _this.proxy_jQuery.jStorage.set(_this._stash_ns, {});
                    _this.proxy_jQuery.jStorage.flush();
                    
                }
            },
            resource: function(path) {
		// todo: do resource differently for featured apps and client apps
                if (window.frames.length > 1 && window.frames[1].name == 'app_iframe' && window.frames[1]._bt_resources) {
                    return window.frames[1]._bt_resources[path];
                } else if (window._bt_resources && window._bt_resources[path]) {
                    return window._bt_resources[path];
                } else {
                    return this.resource_old(path);
                }
            },
            resource_old: function(path) {
                var cached = this._resource_cache[path];
                if (cached !== undefined) { return cached; }
                // MEMOIZE this!
                if (window.console && console.warn) {
                    console.warn('Resource',path,'called from', this._app.name);
                }

                if (path[0] == '/') {
                    // resources shouldnt be using absolute paths!
                    debugger;
                }

                var opts = { url: this._app.get_content_path(true) + path, 
                             async: false, 
                             beforeSend: function(xhr) { 
                                 xhr.setRequestHeader('x-bt-resource', 'true' );
                             }
                           };
                var resptext = _this.proxy_jQuery.ajax(opts).responseText;
                this._resource_cache[path] = resptext;
                return resptext;
            },
            events: { all: function() { return {}; },
                      keys: function() { return []; }, 
                      get: function(k) {  },
                      set: function(k,v) { if (window.console.error) { 
                          //window.console.error('btapp set event cb',k,v,arguments);
                          _this._register_event(k,v);
                      } }
                    },
            torrent: { all: function() { return this.webclient.torrent.all(); },
                       keys: function() { return this.webclient.torrent.keys(); },
                       get: function(key) { 
                           if (key.match(/http(|s)|magnet\:/)) {
                               var torrent = this.webclient.torrent.getwith('download_url', key);
                               if (torrent) {
                                   return torrent; 
                               }
                           }
                           var t = this.webclient.torrent.get(key);
                           if (! t) { throw Error('no torrent with that hash found'); }
                           return t;
                       }
                     },
            language: { all: function() { return ['en']; } },
            settings: { all: function() { return this.webclient.setting.all(); },
                        keys: function() { return this.webclient.setting.keys(); },
                        get: function(k) { return this.webclient.setting.get(k).value; },
                        set: function(k,v) { this.webclient.setting.set(k,v); }
                      },
            log: function(args) {
                if (window.console.log) { window.console.log(args); }
            }
        };

        function fn_bind(func, obj) {
            var slice = Array.prototype.slice;
            var args = slice.call(arguments, 2);
            return function() {
                return func.apply(obj || {}, args.concat(slice.call(arguments)));
            };
        }


        for (var key in methods) {
            var val = methods[key];

            // hackery to bind this to all the btapp methods

            if (typeof val == 'object') {
                _this[key] = {};
                for (var methodname in val) {
                    var method = val[methodname];
                    _this[key][methodname] = fn_bind(method, _this);
                }
            } else {
                _this[key] = fn_bind(val, _this);
            }
        }
        this._app = this.determine_app_from_location(window_location);
        if (! this._app) { debugger; }
        this._stash_ns = 'appstash-' + this._app.update_url;

    }
})(window.exports ? exports._ : null);


(function () {

    // this file can be injected as a part of a non-sdk built app. (in
    // which case it is the first script that appears) but this is
    // only supported if the parent frame already defines 'client'
    

    if (! window.JSLoad) {
        window.develop = false; // unfortunately old versions of the
        // sdk replace btapp with "stub" if window.develop is true
        // (and then the xhr swap does not happen... ugh)
        var has_parent_frame = (window.parent != window);
        if (has_parent_frame && (window.parent.utweb || window.parent.client)) {
	    if (window.parent.utweb) { 
		var client = window.parent.utweb.current_client();
	    } else {
		var client = window.parent.clients.get_current_client();
	    }
            window.btapp = new BTApp(client, window.location);
            window.falcon = { get_xhr_prefix: window.btapp._get_xhr_prefix };
        } else {
            // unsupported mode ? 

            // might come here from a dependency load in which case
            // btapp will be defined right after I am loaded... (apploader.js)
            
        }
    }

})();


