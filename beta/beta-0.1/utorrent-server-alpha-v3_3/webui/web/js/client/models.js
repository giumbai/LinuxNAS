/* 

   Some nice models for the uTorrent client API
   -- Kyle


   We have the following models:


   Client -> TorrentManager -> [Torrent, Torrent, Torrent, ...]
   |
   |----> ClientSettingManager -> [ClientSetting, ClientSetting, ...]
   |
   |----> FeedManager -> [Feed, Feed, Feed, ...]
   |                                    |
   |                                    |----> [FeedItem, FeedItem, ...]
   |
   |----> FeedRuleManager -> [FeedRule, FeedRule, ...]
   |
   |----> LaberManager -> [Label, Label, ...]
   |
   |----> AppManager -> [App, App, ...]
   |
   |----> EventManager -> [Event, Event, Event, ...]


   Torrent -> FileManager -> [File, File, File, ...]
   |
   |-----> PeerManager -> [Peer, Peer, Peer, ...]
   |
   |-----> TorrentSettingManager -> [TorrentSetting, TorrentSetting, ...]


   Note that I use the terminology RSS "Rule" rather than RSS "Filter",
   it just makes more sense to me.

*/

// this file assumes "raptor" exists (a RaptorRequestManager instance)

// things this file makes available
var Client;
var APISpecification;
var RaptorRequestManager;

(function(_, $) {
    if (window._ && window._.include) { window._.contains = window._.include; } // old underscore does not have contains

    // utilities
    function b32encode(s) {
        var _b32tab = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        parts = [];
        quanta = Math.floor(s.length / 5);
        leftover = s % 5;
        if (leftover) {
            for (var i = 0; i < (5 - leftover); i++)
                s += '\0';
            quanta += 1;
        }
        for (var i = 0; i < quanta; i++) {
            c1 = (s.charCodeAt(i * 5) << 8) + s.charCodeAt(i * 5 + 1);
            c2 = (s.charCodeAt(i * 5 + 2) << 8) + s.charCodeAt(i * 5 + 3);
            c3 = (s.charCodeAt(i * 5 + 4));

            c2 += (c1 & 1) << 16; // 17 bits wide
            c3 += (c2 & 3) << 8; // 10 bits wide
            parts += _b32tab.charAt(c1 >> 11); // bits 1 - 5
            parts += _b32tab.charAt((c1 >> 6) & 0x1f); // bits 6 - 10
            parts += _b32tab.charAt((c1 >> 1) & 0x1f); // bits 11 - 15
            parts += _b32tab.charAt(c2 >> 12); // bits 16 - 20 (1 - 5)
            parts += _b32tab.charAt((c2 >> 7) & 0x1f); // bits 21 - 25 (6 - 10)
            parts += _b32tab.charAt((c2 >> 2) & 0x1f); // bits 26 - 30 (11 - 15)
            parts += _b32tab.charAt(c3 >> 5); // bits 31 - 35 (1 - 5)
            parts += _b32tab.charAt(c3 & 0x1f); // bits 36 - 40 (1 - 5)
        }
        if (leftover == 1) parts = parts.slice(0, -6) + '======';
        else if (leftover == 2) parts = parts.slice(0, -4) + '====';
        else if (leftover == 3) parts = parts.slice(0, -3) + '===';
        else if (leftover == 4) parts = parts.slice(0, -1) + '=';

        return parts;
    }

    function hexDecode(infohash) {
        var buffer = '';
        for (var i = 0; i < infohash.length; i += 2)
            buffer += String.fromCharCode(parseInt(infohash.charAt(i) + infohash.charAt(i + 1), 16));
        return buffer;
    }

    function _b32infohash(infohash) {
        return b32encode(hexDecode(infohash));
    }

    b32infohash = _b32infohash; // other files want to use this

    function make_magnet_link(infohash) {
        // deprecated... dont use b32 infohashes any more
        var prefix = 'magnet:?xt=urn:btih:';
        var link = prefix + infohash.toUpperCase(); //_b32infohash(infohash);
        return link;
    }



    Formatters = {};

    APISpecification = new function() {
        // uTorrent sends this data (see tracker.cpp)
        // TODO: update 'unit' field (bytes - bytes/s - seconds ... etc)
        // if no type is specified, then a string

        this.app = [
            { name: 'name' },
            { name: 'update_url' },
            { name: 'version' }
        ];

        this.torrent = [
            { name: 'hash' },
            { name: 'status', type: 'int' , bits: ['started', 'checking', 'start after check', 'checked', 'error', 'paused', 'queued', 'loaded'] },
            { name: 'name' },
            { name: 'size', type: 'int' },
            { name: 'progress', type: 'int' },
            { name: 'downloaded', type: 'int' },
            { name: 'uploaded', type: 'int' },
            { name: 'ratio', type: 'int' },
            { name: 'up_speed', type: 'int' },
            { name: 'down_speed', type: 'int' },
            { name: 'eta', type: 'int' },
            { name: 'label' },
            { name: 'peers_connected', type: 'int' },
            { name: 'peers_swarm', type: 'int', alias: 'peers_in_swarm' },
            { name: 'seed_connected', type: 'int', alias: 'seeds_connected' },
            { name: 'seed_swarm', type: 'int', alias: 'seeds_in_swarm' },
            { name: 'availability', type: 'int' },
            { name: 'queue_position', type: 'int', alias: 'queue_order' },
            { name: 'remaining', type: 'int' },
            { name: 'download_url' },
            { name: 'rss_feed_url' },
            { name: 'message' }, // status message
            { name: 'stream_id' },
            { name: 'added_on', type: 'int' },
            { name: 'completed_on', type: 'int' },
            { name: 'app_update_url' },
            { name: 'directory' },
            { name: 'webseed_enabled' }
        ];

        this.peer = [
            { name: 'country' },
            { name: 'ip' },
            { name: 'hostname' },
            { name: 'protocol', type: 'int'},
            { name: 'port', type: 'int'},
            { name: 'client' },
            { name: 'flags' },
            { name: 'complete', type: 'int' },
            { name: 'down_speed', type: 'int' },
            { name: 'up_speed', type: 'int' },
            { name: 'pending', type: 'int' },
            { name: 'requests', type: 'int' },
            { name: 'waited', type: 'int' },
            { name: 'uploaded', type: 'int' },
            { name: 'downloaded', type: 'int' },
            { name: 'hasherr', type: 'int'},
            { name: 'peer_download_rate', type: 'int' },
            { name: 'maxup', type: 'int' },
            { name: 'maxdown', type: 'int' },
            { name: 'queued', type: 'int' },
            { name: 'inactive', type: 'int' },
            { name: 'relevance', type: 'int' }
        ];

        this.file = [
            { name: 'name' },
            { name: 'size' , type: 'int', unit: 'bytes' },
            { name: 'downloaded', type: 'int', unit: 'bytes' },
            { name: 'priority', type: 'int' },
            { name: 'first_piece', type: 'int' },
            { name: 'num_pieces', type: 'int' },
            { name: 'streamable', type: 'bool' },
            { name: 'encoded_rate', type: 'int' },
            { name: 'duration', type: 'int' },
            { name: 'width', type: 'int' },
            { name: 'height', type: 'int' },
            { name: 'stream_eta', type: 'int' },
            { name: 'streamability', type: 'int' }
        ];

        this.client_setting = [
            { name: 'name' },
            { name: 'type', type: 'int', value_map: {0: 'int', 1: 'bool', 2: 'str'} },
            { name: 'value' },
            { name: 'access', type: 'object', value_map: { 'Y': 'read/write', 'R': 'readonly', 'W': 'writeonly' } }
        ];

        this.torrent_setting = [
            { name: 'hash' },
            { name: 'trackers' },
            { name: 'ulrate', type: 'int' },
            { name: 'dlrate', type: 'int' },
            { name: 'superseed', type: 'bool' },
            { name: 'dht', type: 'bool' },
            { name: 'pex', type: 'bool' },
            { name: 'seed_override', type: 'bool' },
            { name: 'seed_ratio', type: 'int', unit: 'per1000' },
            { name: 'seed_time', type: 'int', unit: 'seconds' },
            { name: 'seed_num', type: 'int' },
            { name: 'ulslots', type: 'int' } // seems to have been
          // added back in ??? shrug
            //            { name: 'ulslots', type: 'int' } // was removed for
            //            new choker in 2.2 ror something
        ];


        this.feed = [
            { name: 'ident', type: 'int' }, // a "foreign key" from feed_rule
            { name: 'enabled', type: 'bool' },
            { name: 'usefeedtitle', type: 'bool' },
            { name: 'user_selected', type: 'bool' },
            { name: 'programmed', type: 'bool' },
            { name: 'download_state', type: 'int' },
            { name: 'url', type: 'bool' },
            { name: 'next_update', type: 'int' },
            { name: 'items', type: 'object' } // list of feed items
        ];

        this.feed_item = [
            { name: 'name' },
            { name: 'name_full' },
            { name: 'url' },
            { name: 'quality', type: 'int' },
            { name: 'codec', type: 'int' },
            { name: 'timestamp', type: 'int' },
            { name: 'season', type: 'int' },
            { name: 'episode', type: 'int' },
            { name: 'episode_to', type: 'int' },
            { name: 'feed_id', type: 'int' },
            { name: 'repack', type: 'bool' },
            { name: 'in_history', type: 'bool' }, // whether this item
            // has been downloaded
            { name: 'torrent', type: 'native-object' } // dynamically
            // added to the response, links to the native torrent object
        ];

        this.feed_rule = [
            { name: 'ident', type: 'int' }, // -1 indicates applies to all feeds
            { name: 'flags', type: 'int' },
            { name: 'name' },
            { name: 'filter' },
            { name: 'not_filter' },
            { name: 'directory' },
            { name: 'feed', type: 'int' },
            { name: 'quality', type: 'int' },
            { name: 'label' },
            { name: 'postpone_mode', type: 'int' },
            { name: 'last_match', type: 'int' },
            { name: 'smart_ep_filter', type: 'int' },
            { name: 'repack_ep_filter', type: 'int' },
            { name: 'episode_filter_str' },
            { name: 'episode_filter', type: 'bool' },
            { name: 'resolving_candidate', type: 'bool' }
        ];

        this.label = [
            { name: 'name' },
            { name: 'contains', type: 'int' } // number of torrents in label
        ];

        this.feed_encoding = [
            "?"
            , "MPEG"
            , "MPEG-2"
            , "MPEG-4"
            , "Real"
            , "WMV"
            , "Xvid"
            , "DivX"
            , "X264"
            , "H264"
            , "WMV-HD"
            , "VC1"
        ];
        this.feed_quality = [
            "?"
            , "HDTV"
            , "TVRip"
            , "DVDRip"
            , "SVCD"
            , "DSRip"
            , "DVBRip"
            , "PDTV"
            , "HR.HDTV"
            , "HR.PDTV"
            , "DVDR"
            , "DVDScr"
            , "720p"
            , "1080i"
            , "1080p"
            , "WebRip"
            , "SatRip"
        ];


        // generate lookups
        _.each(['torrent', 'peer', 'file', 'client_setting', 'torrent_setting','app',
                'feed', 'feed_item', 'feed_rule', 'label'], function(thing) {
                    this[thing + '_lookup'] = {};
                    _.each(this[thing], function(column, index) {
                        this[thing + '_lookup'][column.name] = index;
                    }, this);
                }, this);

    };

    // beware! the following is magical!
    var make_async_method = function( async_call, response_parser, method, forced_update ) {
        // turns a method into an asynchronous version of itself, i.e.
        // make_async_method( async_call, response_parser, function(key1,key2,key3, ...) )
        // returns function(key1, key2, key3, ..., callback)
        var asynced_method = function() {
            var self = this;
            var inputs = arguments;
            var user_callback = inputs[ method.length ];

            if (self.fetched && ! forced_update) {
                if (user_callback) {
                    return user_callback( method.apply(self, inputs) );
                } else {
                    return method.apply(self, inputs);
                }
            } else {

                if (user_callback) { 
                    var callback = function(json) {
                        response_parser.apply(self, [json]);
                        user_callback( method.apply(self, inputs) );
                    };
                } else {
                    var callback = function(json) { 
                        response_parser.apply(self, [json]);
                        method.apply(self, inputs);
                    };
                }
                async_call.apply(self, [callback]);
                return {};


            }
        };
        return asynced_method;
    };


    DataFreshnessManager = function(client) {
        /* 
           I keep track of requests for torrent file/peer data and
           and figure out what new data from the client to
           grab. i.e. if an app is requesting all the peers from every
           torrent all the time (uMap), then I will want to update all
           peers.

           I will always spend a fixed amount of time doing updates,
           where the default is to do a basic list update.

           
           
           I make an estimate of the cost to do the update and factor
           that into the frequency at which I'll make these requests.

           client.torrent.all()
           client.torrent.get(hash).file.all()
           client.torrent.get(hash).peer.all()

           Data that's never viewed (via all() or get()) will not be
           updated.
         */
    };
    DataFreshnessManager.prototype = {
        start: function() {
            
        },
        stop: function() {
        }
    };


    RaptorRequestManager = function(client, api) {
        // any update made goes through me. I make sure everybody
        // stays updated.
        this.__name__ = 'RaptorRequestManager';
        this.api = api;
        this.api.client = client;
        this.client = client;
        this.last_successful_request_time = null;
        this.request_queue = [];
        this.current_request = null;
        this.request_count_success = 0;
        this.request_count_failure = 0;
        this.listResponses = [];
    };

    RaptorRequestManager.prototype = {

        proxy_base_url: function(raptor_host, nonssl) {
            if (config.local_discovery) {
                return 'http://'+config.local_discovery+'/proxy';
            } else {
                if (raptor_host) {
                  if (nonssl) {
                    var parts = raptor_host.split(':');
                    var port = parts[2];
                    var new_port = parseInt(port,10) + config.port_delta;
                    raptor_host = 'http://' + parts[1].slice(2, parts[1].length) + ':' + new_port;
                  }
                  return raptor_host + (config.proxy_prefix || "/client/proxy");
                } else {
                    return (config.proxy_prefix || "/client/proxy");
                }
            }
        },

        request_returned: function(response) {
            if (! response.json) {
                // failed list request :-(
            }
            if (response.status == 'timeout') {
                // never try to read the xhr object on a timeout
                var content_length = 0;
            } else if (response.xhr && response.xhr.status == 200) {
                var content_length = parseInt(response.xhr.getResponseHeader('content-length'), 10);
            } else {
                var content_length = 0;
            }

            if (response.status == 'timeout') {
                // never try to read the xhr object on a timeout
                var xhr_status = 0;
            } else if (response.xhr) {
                var xhr_status = response.xhr.status;
            } else {
                var xhr_status = 0;
            }

            //this.current_request = null; // Dont do this... queued
            //requests race condition
            if (this.request_queue.length > 0) {
                var next_request = this.request_queue[0];
                this.request_queue = this.request_queue.slice(1, this.request_queue.length);
                console.log('pushing request off queue');
                next_request();
            }
        },

        proxy: function(url_params, success_callback, failure_callback) {
            //url_params.token = self.api.token;
            // use fjQuery (falcon jQuery because apps take over the
            // falcon object and do the xhr rewrite stuff...
            var xhr = fjQuery.ajax( {url: this.proxy_base_url() + "?" + jQuery.param(url_params),
                                    success: function(data, status, xhr) { 
                                        if (xhr.status == 0) {
                                            var err_data = { status: status, xhr: xhr };
                                            if (failure_callback) {
                                                failure_callback(err_data);
                                            } else {
                                                console.log('proxy getfile failed. (xhr status 0) jquery ajax calls this success???');
                                                throw Error(err_data);
                                            }
                                        }
                                        console.log('successfully downloaded file');
                                        success_callback(data, status, xhr);
                                    },
                                    error: function(xhr, status) {
                                        var err_data = { xhr: xhr, status: status };
                                        if (failure_callback) {
                                            failure_callback( err_data );
                                        } else {
                                            console.log('proxy getfile failed :-(');
                                            throw Error(err_data);

                                        }
                                    }
                                   } );

        },

		post_raw: function(url_params, body_params, json_callback, fail_cb, opts) {
            if (config.webui) {
                this.api.webui_get( url_params, body_params || {}, json_callback, fail_cb, opts);
            } else {
                this.api.post(url_params, body_params || {}, json_callback, fail_cb, opts);
            }
		},

        post: function(url_params, body_params, user_success_callback, user_failure_callback, options) {
            var self = this;

            function success_callback(json, status, xhr) {
                //console.log( JSON.stringify(json) );
                self.request_count_success += 1;

                self.request_returned( { json: json,
                                         status: status,
                                         xhr: xhr }
                                     );
                self.last_successful_request_time = new Date();

              var update_keys = _.keys(json);

                if (json.build) {
                    self.version = json.build;
                }

                if (json.torrents) {
                    self.client.torrent.eat( json );
                }


                if (json.torrentm || json.torrentc) {
                    self.client.torrent.eat( json );
                }

                if (json.label) {
                    self.client.label.eat( json );
                    self.client.label.correct_counts_for_primary( self.client.torrent._torrents );                    
                }

                if (json.apps !== undefined && (config.client_apps || (config.cookies && config.cookies.client_apps)) && ! config.webui && ! config.classic_iphone_interface) {
                    self.client.app.eat( json );
                }

                if (json.sessions) {
                    self.client.session.eat( json );
                }

                // do this after torrents are updated
                for (key in json) {
                    if (key.match('rssfeed')) {
                        self.client.feed.eat( json );
                        break;
                    }
                }

                for (key in json) {
                    if (key.match('rssfilter')) {
                        self.client.feedrule.eat( json );
                        break;
                    }
                }

                if (json.apps) {
                    self.client.app.eat( json );
                }

                if (json.files) {
                    for (var i = 0; i < json.files.length/2; i++) {
                        var hash = json.files[i*2];
                        var torrent = self.client.torrent.get(hash);
                        torrent.file.eat( json );
                    }
                }

                if (json.peers) {
                    for (var i = 0; i < json.peers.length/2; i++) {
                        var hash = json.peers[i*2];
                        var torrent = self.client.torrent.get(hash);
                        torrent.peer.eat( json );
                    }
                }

                if (json.props) {
                    // torrent properties (stupidly cant
                    // multifetch...)
                    var torrent = self.client.torrent.get(json.props[0].hash);
                    torrent.setting.eat( json );
                }


                if (user_success_callback) {
                    user_success_callback(json, xhr);
                }
                if (config.build != 'embedded' && window.utWebUI && (window.utweb && ! window.utweb._logging_out)) { utWebUI.loadList(json); } // disable fancy rss filter stuff for embedded mode

              // call client on update listeners
              self.client.call_update_listeners(update_keys);
            }

            function failure_callback( err_data ) {
                self.request_count_failure += 1;
                self.request_returned( err_data );

                var xhr = err_data.xhr;

                if  (user_failure_callback) {
                    // if this is from client.startUpdating then it will call update_fail_listeners
                    return user_failure_callback( err_data );
                }

              self.client.call_update_fail_listeners(xhr, err_data.status, err_data);
            }

            function make_request() { 
                if (config.webui) {
                  self.api.webui_get( url_params, body_params || {}, success_callback, failure_callback, options);
                } else {
                  // always send GUID and bt_talon_tkt in headers to allow multi session
                  self.api.post(url_params, body_params || {}, success_callback, failure_callback, options);
                }
            }


            // we probably should queue or at least control the number
            // of concurrent requests. currently if you send around 15
            // at once, the client will respond with garbled bytes
            // (invalid JSON)
            if (self.request_queue.length > 0) {
                console.log('queueing request');
                self.request_queue.push( make_request );
            } else {
                make_request();
            }
            
        }

    }

    var Peer = function(manager, data) {
        var peer = this;
        peer.__name__ = 'Peer';
        peer.manager = manager;
        peer._data = data;

        _.map( APISpecification.peer, function(spec, index) {
            peer[spec.name] = data[index];
        });

        peer.properties = {
            all: function() { return peer; },
            keys: function() { return _.keys(peer); },
            set: function(k,v) { },
            get: function(k) { return peer[k] !== undefined ? peer[k] : null; }
        };

    // XXX: we need to get the api to send us a real peer uid. for web seeding, this is not unique.
    // so for now just blow away all the peers
        peer.uid = peer.ip + ':' + peer.port;

    };

    Peer.prototype = {
        get_progress_text: function() {
            return '';
        },
        get_progress_color: function() {
            if (this.complete == 1000) {
                return 'blue';
            } else {
                return 'green';
            }
        }
    };



    var PeerManager = function(torrent) {
        var manager = this;
        manager.__name__ = 'PeerManager';
        manager.torrent = torrent;
        manager.fetched = false;
        manager._peers = {};
    };

    PeerManager.prototype = new function() {

        var on_peers_response = function(json) {
        var _this = this;
        this._peers = {}; // reset the list of peers
        var peer_uid_ctr = 0;
            for (var i = 0; i < json.peers.length/2; i++) {
                if (json.peers[i*2] == this.torrent.hash) {
                    var peerdata = json.peers[i*2+1];
                    this.fetched = true;
                    this.fetch_time = new Date();
                    this._peers = {};

                    _.each(peerdata, function(data) {
                        var peer = new Peer(_this, data)
                   peer.uid = peer.uid + peer_uid_ctr;
                   peer_uid_ctr++;
                        _this._peers[peer.uid] = peer;
                    });
                    this._data = _.values(this._peers);
                    return this._peers;
                }
            }
        };


        var async_call = function(callback) { _this.client.raptor.post( { action: 'getpeers' }, { hash: this.torrent.hash }, callback ); };

        this.all = make_async_method( async_call, on_peers_response,
                                      function() { return this._peers; } );
        this.update = make_async_method( async_call, on_peers_response,
                                         function() { return this._peers; }, true );
        this.keys = make_async_method( async_call, on_peers_response,
                                       function() { return _.keys(this._peers); } );
        this.get = make_async_method( async_call, on_peers_response,
                                      function(key) { return this._peers[key]; } );

        this.data = function() { return this._data; };

        this.eat = function(json) { return on_peers_response.apply(this, [json]); };

    };


    var File = function(manager, data) {
        var file = this;
        file.__name__ = 'File';
        file.manager = manager;
        file.torrent = manager.torrent;
        file._data = data;
        _.map( APISpecification.file, function(spec, index) {
            file[spec.name] = data[index];
        });
        file.properties = {
            all: function() { return file; },
            keys: function() { return _.keys(file); },
            set: function(k,v) { },
            get: function(k) { return file[k] !== undefined ? file[k] : null; }
        };

        file.uid = file.name;
        file.progress = Math.floor(file.downloaded / file.size * 1000);
        file.extension = this.get_extension();
    };
    File.prototype = {
        // set priority... skip low med hi
        __render: function() {
            return '<span style="font-size:120%">' + this.name + '</span>';
        },
      isImage: function() {
        if (_.contains(['png','jpg','gif','jpeg','bmp','ico'], this.extension)) {
          return this;
        }
      },
        vestel_play: function() {
            var file = this;
            console.log('vestel play on',file);
            var obj = document.createElement('object');
            console.log('vid object obj',obj);
            obj.setAttribute('type','video/mp4');
            var opts = {nonssl:true};
            if (config.webui) {
                opts.include_host = true;
            }
            var url = file.get_link('inline','DOWNLOAD',opts);
            obj.setAttribute('data',url);
            obj.setAttribute('id','player_object');
            obj.setAttribute('width',1280);
            obj.setAttribute('height',720);
            obj.setAttribute('style','z-index:99');
            jQuery('#app_container').hide();
            //jQuery('#player_container').show();
            console.log('player container',jQuery('#player_container')[0]);
            jQuery('#player_container')[0].appendChild(obj);
            console.log('setup object with url',url);
            var _this = this;
            setTimeout( function() {
                            console.log('telling it to play now');
                            //document.body.setAttribute('style','display:none');
                            
                            _this.play_obj = document.getElementById('player_object');
                            _this.play_obj.play(1);
                        }, 1000);
            // setup cancel button...
            jQuery(document).keydown( function(evt) {
                                           if (evt.keyCode == 413) {
                                               var player = document.getElementById('player_object');
                                               if (player) {
                                                   jQuery('#app_container').show();
                                                   jQuery('#player_container').hide();
                                                   //document.body.setAttribute('style','display:block');
                                                   player.stop();
                                                   this.playing = false;
                                                   player.parentNode.removeChild(player);
                                               }
                                           } else if (evt.keyCode == 19) {
                                               //pause
                                               var player = document.getElementById('player_object');
                                               if (player) {
                                                   console.log('player speed', player.speed);
                                                   player.speed = 0;
/*
                                                   if (player.speed == 1) {
                                                       player.speed = 0;
                                                   } else {
                                                       player.speed = 1;
                                                   }
*/

                                               }
                                           }
                                       });

        },
      sling: function(hostport) {
          console.log('sling called');
          if (true || config.netfront) {
              return this.vestel_play();
          }
          // for IFA demo
        hostport = hostport?hostport:'127.0.0.1:8999';
        var opts = {nonssl:true};
        if (config.webui) {
          opts.include_host = true;
        }
        var url = 'http://'+hostport+'/play?url=' + encodeURIComponent(this.get_link('inline','DOWNLOAD',opts));
        remotelog('slinging with url '+ url);

        jQuery.ajax( { url: url,
                       dataType: 'jsonp',
                       success: function(data, status, xhr) {
                         remotelog('success sling result ' + xhr.status + ' ' + xhr.statusText);
                       },
                       error: function(status, xhr) {
                         remotelog('error sling result ' + xhr.status + ' ' + xhr.statusText);
                       }
                     });

      },
        open: function() {
/*
        if (! (config.experimental || config.webui || config.local_discovery || config.debug)) { 
          alert("Sorry, this feature is not available. Sad panda.");
        return;
        }
*/
            if (config.utweb && window.utweb && this.playable()) {
                //utweb.media_open(this.manager.torrent.hash, this.id);
                window.open( this.get_link() );
            } else {
                window.open( this.get_link() );
                /* // experimental html5 video...
                if (this.playable()) {
                    window.open( '/gui/video.html#url=' + escape(this.get_link()) );
                } else {
                    window.open( this.get_link() );
                }
                */
            }
        },

        determine_profile: function() {
            if (this._avdata) {
                // loop over all the different properties and
                // determine which ones fit which profiles

/*
SD profile: 
avi,
mpeg4
320x240 - 720x576, max 2000 kbps
mp3 128-320 kbps
ac-3 192-640 kbps

HD profile
mkv
h264/avc
320x240 - 1920x1080, max 20,000 kbps
aac 192-1152
mp3 128-320
ac-3 192-640
                    */
                var parts = this._avdata.audioCodecName.split('_');
                var audiocodec = parts[parts.length-1];
                var parts = this._avdata.videoCodecName.split('_');
                var videocodec = parts[parts.length-1];

                var video_kbps = this._avdata.videoBitrate/1024;
                var audio_kbps = this._avdata.audioBitrate/1024;

                var w = this._avdata.frameWidth;
                var h = this._avdata.frameHeight;

                var result = {};

                if (audiocodec == 'AAC') {
                    if (audio_kbps <= 1152) {
                        result.audio = 'HD';
                    }
                } else if (audiocodec == 'MP3') {
                    if (audio_kbps <= 320) {
                        result.audio = 'SD';
                    }
                } else if (audiocodec == 'AC3') {
                    if (audio_kbps <= 640) {
                        result.audio = 'SD';
                    }
                }
                if (videocodec == 'H264') {
                    if (video_kbps <= 20000) {
                        if (w <= 1920 && h <= 1080) {
                            result.video = 'HD';
                        }
                    }
                } else if (videocodec == 'MPEG4') {
                    if (video_kbps <= 2000) {
                        if (w <= 720 && h <= 576) {
                            result.video = 'SD';
                        }
                    }
                }
                return result;
            }
        },
        get_av_codecs: function() {
            var parts = this._avdata.audioCodecName.split('_');
            var audiocodec = parts[parts.length-1];
            var parts = this._avdata.videoCodecName.split('_');
            var videocodec = parts[parts.length-1];
            return { audio: audiocodec, video: videocodec };
        },
        get_transcode_options: function( options ) {
            var params = { fileExtension: 'mpeg avi mp4 wav mpg mov mp3 ts asf wma wmv mkv mka ogg vob webm aiff'.split(' '),
                           videoCodec: 'default mpeg1 mpeg2 mpeg4_p2 h264 copy'.split(' '),
                           audioCodec: 'default ac3 mp3 copy'.split(' '),
                           frameSize: 'default vga svga hd480 hd720 hd1080'.split(' ') };
            var opts = {};
            var codecs = this.get_av_codecs();


          var conv = 1024; // wants Kbps, not bits

            if (options.preset == 'HD') {
                if (codecs.video == 'H264') {
                    videoCodec = 'copy';
                } else {
                    videoCodec = 'h264';
                }
                if (codecs.audio == 'MP3' || codecs.audio == 'AC3') {
                    audioCodec = 'copy';
                } else {
                    audioCodec = 'mp3';
                }

                if (this._avdata.videoBitrate == 0) this._avdata.videoBitrate = 20000 * 1024;
                _.extend(opts, {
                    fileExtension: params.fileExtension.indexOf('mkv'),
                    videoCodec: params.videoCodec.indexOf(videoCodec),
                    audioCodec: params.audioCodec.indexOf(audioCodec),
                    preserveQuality: 1,
                    videoBitrate: Math.floor(parseInt(this._avdata.videoBitrate)/conv),
                    audioBitrate: Math.floor(parseInt(this._avdata.audioBitrate)/conv),
                    frameSize: params.frameSize.indexOf('default'), // don't resize
                    //frameSize: params.frameSize.indexOf('hd480'),
                    fileName: this.get_local_path(),
                    targetFile: this.get_local_path() + '.__conv_HD' }
                        );
            }
            if (options.preset == 'SD') {
                if (this._avdata.videoBitrate == 0) this._avdata.videoBitrate = 2000 * 1024;

                if (codecs.video == 'MPEG4') {
                    videoCodec = 'copy';
                } else {
                    videoCodec = 'mpeg4_p2';
                }

                if (codecs.audio == 'MP3' || codecs.audio == 'AC3') {
                    audioCodec = 'copy';
                } else {
                    audioCodec = 'mp3';
                }


                _.extend(opts, {
                    fileExtension: params.fileExtension.indexOf('avi'),
                    videoCodec: params.videoCodec.indexOf(videoCodec),
                    audioCodec: params.audioCodec.indexOf(audioCodec),
                    preserveQuality: 0,
                    videoBitrate: Math.floor(parseInt(this._avdata.videoBitrate)/conv),
                    audioBitrate: Math.floor(parseInt(this._avdata.audioBitrate)/conv),
                    frameSize: params.frameSize.indexOf('svga'), // TODO: don't upsample frame size if not necessary - only reduce size
                    fileName: this.get_local_path(),
                    targetFile: this.get_local_path() + '.__conv_SD' }
                        );
            }

            return opts;
        },

        getavdata: function(user_cb) {
            var _this = this;
            // queries for avdata
            var url = 'http://127.0.0.1:8080/formatquery?type=avdata&file=' + escape(this.get_local_path());
            console.log('query av data',url);
            function error(data) {
                user_cb( { error: data } );
            }
            function success(data) {
                // interpret the response etc
                if (data.html) {
                    try {
                        var json = JSON.parse(data.html);
                        console.log('got av data',json);
                        if (window.ffmpeg_meta) {
                            json.audioCodecName = ffmpeg_meta.codecs[json.audioCodec];
                            json.videoCodecName = ffmpeg_meta.codecs[json.videoCodec];
                        }
                        _this._avdata = json;
                        user_cb(json);
                    } catch(e) {
                        error(data);
                    }
                } else {
                    error(data);
                }
            }
            _this.manager.torrent.manager.client.raptor.post( { action: 'get-url' }, { url: url }, success, error );
        },

        get_local_path: function() {
            return this.manager.torrent.directory + '\\' + this.name;
        },

        playable: function() {
            return _.contains('mp3 m4v flv wmv avi ogg mp4 mkv mov mp4 mpg mpeg flac 3gp'.split(' '), this.extension.toLowerCase()) || this.encoded_rate;
        },

        html5_playable: function() {
            return _.contains('mp4 mp3 wav webm ogg 3gp'.split(' '), this.extension.toLowerCase());
        },

        demo_playable: function() {
            return _.contains('avi mp4 mkv mp4 3gp'.split(' '), this.extension.toLowerCase()) || this.encoded_rate > 0;
        },

        get_link: function(disposition, service, opts) {
          var include_host = (opts&&opts.include_host);
          var nonssl = (opts&&opts.nonssl);
          //if (config.cookies.web_seed_link) { return this.get_web_seed_link(); }
          //if (config.cookies.download_nonssl_catn || nonssl) { return this.get_nonssl_link(disposition); } // todo: fix this up

            var url_params = { sid: this.manager.torrent.stream_id,
                               file: this.id,
                               service: service || 'DOWNLOAD',
                               qos: 0,
//                               t: (new Date()).getTime(),
//                               token: raptor.api.token,
                               disposition: disposition || 'inline'
                             };
//            if (config.webui) { url_params.GUID = jQuery.cookie('GUID'); }
            var client = this.manager.torrent.manager.client;
            if (! client.raptor.api.pairing && config.utweb && ! config.local_discovery) {
                // new rator version supports sticking filename in the url
                var filename_path = '/' + this.get_filename();
            } else {
                var filename_path = '';
            }

            filename_path = escape(filename_path);
            if (client.raptor.api.pairing) {
                var url = client.raptor.api.pairing.local_url + '/proxy' + filename_path + '?' + jQuery.param( url_params );
            } else {
                var url = client.raptor.proxy_base_url(client.raptor_host,nonssl) + filename_path + '?' + jQuery.param( url_params );
            }
            if (client.raptor_host) { url = url + '&' + client.client_qs(); }
            //console.log('get link',url);
            if (include_host) { url = 'http://' + document.location.hostname + ':' + document.location.port + url; }
            return url;
        },

        get_webui_stream_link: function() {
            // wont work through stunnel... display error in that case
            if (window.location.protocol == 'https:') {
                throw Error('VLC cant handle https streams :-( sorry!');
            }

            return 'http://' + document.location.hostname + ':' + 
                document.location.port + this.get_link('inline','STREAMING');
        },

        get_nonssl_link: function(disposition) {
            var url_params = { sid: this.manager.torrent.stream_id,
                               file: this.id,
                               service: 'DOWNLOAD',
                               qos: 0,
                               t: (new Date()).getTime(),
                               disposition: disposition || 'inline'
                             };
            var url = 'http://' + 
                document.location.hostname + ':' +
                (parseInt(document.location.port,10) + config.port_delta) +
                this.manager.torrent.manager.client.raptor.proxy_base_url() + '?' + jQuery.param( url_params );
            return url;
        },

        get_forward_nonssl_link: function() {
            // the vlc plugin doesnt know about our cookies so we have to have
            // talon do a set cookie with a redirect...
            var url_params = { sid: this.manager.torrent.stream_id,
                               file: this.id,
                               service: 'STREAMING',

// QOS = content_length / duration
// = size / duration
//                               qos: (this.size / this.duration),
                               qos: 0,
//                               disposition: 'inline',
                               GUID: jQuery.cookie('GUID'),
                               username: jQuery.cookie('bt_user')
                             };

            var url = 'http://' +
                document.location.hostname + ':' + 
                (parseInt(document.location.port,10) + config.port_delta) + 
                '/talon/streamfile?' + jQuery.param( url_params );
            return url;
        },

      get_web_seed_link: function() {
          if (config.utweb) {

              return 'http://' +
                  document.location.hostname + ':' +
                  (parseInt(document.location.port,10) + 1000) +
                  '/talon/seed/' + this.manager.torrent.manager.client.data.cid + '/content/' + this.manager.torrent.stream_id + '/' + escape(this.name);
          } else {
              // web ui
              if (this.manager.torrent.file.length == 1) {
                  return '/seed/0/content/' + this.manager.torrent.stream_id + '/' + escape(this.name.replacebacks());
              } else {
                  return '/seed/0/content/' + this.manager.torrent.stream_id + '/' + escape(this.manager.torrent.name) + '/' + escape(this.name.replacebacks());
              }
          }
      },

        get_talon_stream: function(disposition, service) {
        // direct stream from talon
            var url_params = { sid: this.manager.torrent.stream_id,
                               file: this.id,
                               qos: 0,
                               disposition: disposition || 'inline',
                               service: service || 'DOWNLOAD',
                               GUID: jQuery.cookie('GUID'),
                               username: jQuery.cookie('bt_user') };
            
          var url = 'http://' + 
            document.location.hostname + ':' +
            (parseInt(document.location.port,10) - 1000) +
            '/talon/proxystreamfile?' + jQuery.param( url_params );
            return url;
        },

        get_progress_text: function() {
            return this.progress/10 + locale('FI_COL_PCNT');
            // if (this.progress == 1000) {
            //     return locale('OV_FL_FINISHED');
            // } else {
            //     return this.progress/10 + locale('FI_COL_PCNT');
            // }
        },
        get_progress_color: function() {
            return 'green';
            // if (this.progress == 1000) {
            //     return 'white';
            // } else {
            //     return 'green';
            // }
        },

        get_filename: function() {
            var parts = this.name.split('\\');
            return parts[parts.length-1];
        },
        get_extension: function() {
            var parts = this.name.split('.');
            if (parts.length == 1) {
                return '';
            } else {
                return parts[parts.length - 1].toLowerCase();
            }
        },
        isCompleted: function() {
            return this.downloaded == this.size;
        },

        setPriority: function(prio) {
            var torrent = this.manager.torrent;
            torrent.manager.client.raptor.post( { action: 'setprio', p: prio, f: this.id }, { hash: torrent.hash } );
        }
    };

    var FileManager = function(torrent) {
        var manager = this;
        manager.__name__ = 'FileManager';
        manager.torrent = torrent;
        manager.files = {};
        manager.fetched = false;
        manager.length = 0;
    };


    FileManager.prototype = new function() {

        var on_files_response = function(json) {
            var _this = this;
            this.length = json.files.length/2;
            for (var i = 0; i < json.files.length/2; i++) {
                if (json.files[i*2] == this.torrent.hash) {
                    var filedata = json.files[i*2+1];
                    this.fetched = true;
                    this.fetch_time = new Date();
                    _.each(filedata, function(data,index) {
                        var file = new File(_this, data)
                        file.id = index;
                        _this.files[file.uid] = file;
                    });
                    this._data = _.values(this.files);
                    _.defer( function() { _this.torrent.manager._trigger_event('fileStatus', { message: 'Files Updated', manager: _this }); } )
                    return this.files;
                }
            }
            
          

        };
      var async_call = function(callback) { this.torrent.manager.client.raptor.post( { action: 'getfiles' }, { hash: this.torrent.hash }, callback ); };

        this.all = make_async_method( async_call, on_files_response,
                                      function() { return this.files; } );
        this.update = make_async_method( async_call, on_files_response,
                                         function() { return this.files; }, true );
        this.keys = make_async_method( async_call, on_files_response,
                                       function() { return _.keys(this.files); } );
        this.get = make_async_method( async_call, on_files_response,
                                      function(key) { return this.files[key]; } );

        this.eat = function(json) { return on_files_response.apply(this, [json]); };

        this.data = function() { return this._data; };

    };


    var TorrentSetting = function(manager, name, value) {
        var setting = this;
        setting.__name__ = 'TorrentSetting';
        setting.manager = manager;
        setting.name = name;
        var index = APISpecification.torrent_setting_lookup[name];
        if (APISpecification.torrent_setting[index]) {
            setting.type = 'string';
        } else {
            var spec = APISpecification.torrent_setting[index];
            if (spec) {
                setting.type = spec.type || 'string';
            } else {
                setting.type = 'string';
        }
        }

        if (setting.type == 'bool') {
            setting.value = !! value; // coerce 0/1 into true/false
        } else {
            setting.value = value;
        }
        
    };


    TorrentSetting.prototype = {

        set: function(value, user_callback) {
            var self = this;
            if (user_callback) { // "self.value = value" will
                // likely be problematic as bools are sometimes "0"
                // and sometimes "false"...
                var callback = function(json) { self.value = value; user_callback.apply(self, [json]); };
            } else {
                var callback = function(json) { self.value = value; };
            }
            this.manager.client.raptor.post( { action: 'setprops', s: this.name, v: value }, 
                         { hash: this.manager.torrent.hash }, 
                         callback );
        }
    };


    var TorrentSettingManager = function(torrent, data) {
        var manager = this;
        manager.__name__ = 'TorrentSettingManager';
        manager.torrent = torrent;
        manager.settings = {};
        manager.fetched = false;
    };
    window.TorrentSettingManager = TorrentSettingManager;

    TorrentSettingManager.prototype = new function() {

        var on_response = function(json) {
            this.fetched = true;
            this.fetch_time = new Date();
            _.map(json.props[0], function(value,name) {
                var ts = new TorrentSetting(this, name, value);
                this.settings[name] = ts;
            }, this);

            return this;
        };

        var async_call = function(callback) { this.client.raptor.post( { action: 'getprops'}, {hash: this.torrent.hash }, callback ); };
        this.eat = function(json) { on_response.apply(this, [json]); };
        this.keys = function() { return _.map(APISpecification.torrent_setting, function(spec) { return spec.name; }); };
        this.all = make_async_method(async_call, on_response, function() { return this.settings; } );
        this.get = make_async_method(async_call, on_response, function(key) { return this.settings[key]; } );

    };


    var TorrentManager = function(client) {
        var manager = this;
        this.__name__ = 'TorrentManager';
        manager.client = client;
        this.status_categories = ['Downloading', 'Completed', 'Active', 'Inactive','Seeding','Not Alone', 'All'];
        manager.cacheid = null;
        manager.fetched = false;
        manager.hashindex = {};
        manager._removed = [];
        manager._changed = [];
        manager._torrents = {};
	manager._rawtorrents = {};
        manager._event_listeners = {};
    };
    window.TorrentManager = TorrentManager;
    TorrentManager.prototype = new function() {

        this.data = function() {
            return _.map( this._torrents, function(t) { return t; } );
        };

        var on_full_response = function(json) {
            var self = this;

            if (this.fetched) {
                _.each(_.keys(self._torrents), function(hash) {
                    delete self._torrents[hash];
                });
            }
            this.cacheid = json.torrentc;

            _.map(json.torrents, function(data, index) {
                var hash = data[ APISpecification.torrent_lookup['hash'] ];
                self._rawtorrents[hash] = data;
                self._torrents[hash] = new Torrent(self, data);
            });

            this.update_category_counts();

            return this;
        };

        var on_update_response = function(json) {
            var self = this;

            this.cacheid = json.torrentc;

            this._changed = _.map(json.torrentp, function(data) { return new Torrent(self, data); }); // modified & added
            this._removed = _.map(json.torrentm, function(hash) { return self.get(hash); });
            

            _.each(this._removed, function(torrent) {
                var data = { hash: torrent.hash, 
                             state: -1, 
                             url: torrent.download_url,
                             message: 'Torrent File Removed',
                             status: 200
                           };
                _.defer( function() {
                    self._trigger_event( 'torrentStatus', data );
                } );
                delete self._torrents[torrent.hash];
                delete self._rawtorrents[torrent.hash];
            });

            _.each(this._changed, function(changed) {
                var hash = changed.hash;
                var torrent = self._torrents[hash];
                if (torrent) {
                    // modify the object in place ?? why... so third
                    // parties are guaranteed the same reference
                    // regardless of updates...?
                    // also to make sure peermanager, filemanager
                    // states are persisted
                    
                    if (torrent.progress != 1000 && changed.progress == 1000) {
                        var data = { hash: torrent.hash,
                                     state: 1,
                                     url: torrent.download_url,
                                     message: 'Torrent File Completed',
                                     status: 200
                                   };

                        _.defer( function() {
                                     self._trigger_event( 'torrentStatus', data );
                                 } );
                        
                    }
                    torrent.data( changed.data() );
                    torrent.status_array = torrent.get_status(); // would
                } else {
                    if (self._new_torrent_listeners.length) {
                        for (var i = 0; i < self._new_torrent_listeners.length; i++) {
                            var cb = self._new_torrent_listeners[i];
                          _.defer( function() {
                            // have to defer because torrent does not
                            // show up in torrent.keys() yet!
                            cb(changed);
                          });

                        }
                    }
                    var data = { hash: changed.hash,
                                 state: 1,
                                 url: changed.download_url, // magnet links dont have this property...
                                 message: 'Torrent File Added',
                                 status: 200
                               };

                    if (changed.size == 0) {
                        // magnet link!
                        data.url = make_magnet_link(changed.hash);
                    }

                    _.defer( function() {
                        self._trigger_event( 'torrentStatus', data );
                    } );
                    self._torrents[hash] = changed;
		    self._rawtorrents[hash] = changed.data();
                }

            });

            this._changed = _.map( this._changed, function(t) { return self.get(t.hash); } );

            this.update_category_counts(); // should only do
            // updates... so we dont have to recalculate this every time.
            
            return this;
        };

        var async_call = function(callback) {
            if (this.cacheid && this.cacheid != null && typeof(this.cacheid) != "undefined") {
                this.client.raptor.post({ list: 1, cid: this.cacheid }, {}, callback);
            } else {
                this.client.raptor.post({ list: 1 }, {}, callback);
            }
        };

        var on_response = function(json) {
            this.fetched = true;
            this.fetch_time = new Date();
            if (json.torrentp || json.torrentm) {
                return on_update_response.apply(this, [json]);
            } else {
                return on_full_response.apply(this, [json]);
            }
        };

        this.calculate_totals = function() {
            // calculate total UL/DL rates

            var total_up_speed = _.reduce( this._torrents, 
                                           function(sofar, torrent) { 
                                               return sofar + torrent.up_speed;
                                           },
                                           0 );
            var total_down_speed = _.reduce( this._torrents, 
                                             function(sofar, torrent) { 
                                                 return sofar + torrent.down_speed;
                                             },
                                             0 );
            return {total_up_speed: total_up_speed, 
                    total_down_speed: total_down_speed};

            
        };


        this.countInCategory = function(status) {
            var count = 0;
            _.each( this.all(), function(torrent) {
                if (torrent.matchesCategory(status)) {
                    count += 1;
                }
            });
            return count;
        };

        this._new_torrent_listeners = [];
        this.add_new_torrent_listener = function(fn) {
            this._new_torrent_listeners.push(fn);
        };

        this.update_category_counts = function() {
            var self = this;
            this.category_counts = {};
            _.each(this.status_categories, function(category) {
                self.category_counts[category] = self.countInCategory({ status: category });
            });
        };

      this.add_event_listener = function(name, cb) {
        if (! this._event_listeners[name]) {
          this._event_listeners[name] = [];
        }
        this._event_listeners[name].push(cb);
      };

        this._trigger_event = function(name, data) {
            var btapp = null;
            if (window.btapp) {
                btapp = window.btapp;
            } else if (window.frames.length == 2) {
                btapp = window.frames[1].btapp;
            }
            if (btapp) {
                _.defer( function() { btapp._trigger_event(name, data); } );
            }
          var cbs = this._event_listeners[name];
          if (cbs) {
            _.each(cbs, function(cb) {
              _.defer( function() { cb(data) } );
            });
          }
            // console.error('no handler for trigger event',this,name,data);
        };

        this.add = function(url, callback) {
            this.client.raptor.post({ action: 'add-url' }, {s: url}, callback);
        };

        this.add_from_app = function(url, app, callback) {
            this.client.raptor.post({ action: 'add-url' }, {s: url, app_update_url: app.update_url}, callback);
        };

        this.addfile = function(data, callback) {
            console.log('addfile called');
            this.client.raptor.post({ action: 'add-file', p: 1, uu: 1}, {torrent_file: data}, callback);
            console.log('addfile call success');
        };
        
        this.eat = function(json) { return on_response.apply(this, [json]); };

        this.keys = make_async_method( async_call, on_response, function () { return _.keys(this._torrents); } );
        this.all = make_async_method( async_call, on_response, function () { return this._torrents; } );
        this.update = make_async_method( async_call, on_response, function() { return this._torrents; }, true );
        this.get = make_async_method( async_call, on_response, function(key) { return this._torrents[key.toUpperCase()]; } );

        this.command_many = function( hashes, url_params, body_params, callback ) {
            if (body_params === undefined) { body_params = {}; }
            //body_params.hash = hashes;
            body_params.hash = hashes;
            this.client.raptor.post( url_params, body_params, callback );
        };

        this.getwith = function( kwargs ) {
            // returns the torrent with properties matching all the
            // kwargs
            for (hash in this._torrents) {
                var match = true;
                for (key in kwargs) {
                    if (this._torrents[hash][key] != kwargs[key]) {
                        match = false;
                        continue;
                    }
                }

                if (match) { return this._torrents[hash]; }
            }
        };

        // for debugging, finding a single torrent easily...
        this.search = function(keyword) {
            if (this.fetched) {
                for (hash in this._torrents) {

                    if ( this._torrents[hash].name.toLowerCase().match( keyword.toLowerCase() ) ) {
                        return this._torrents[hash];
                    }
                }
            }
        };

        this.getallwith = function( kwargs ) {
            var toreturn = [];
            for (uid in this._torrents) {
                var torrent = this._torrents[uid];
                for (key in kwargs) {
                    if (torrent[key] != kwargs[key]) {
                        continue;
                    }
                }
                toreturn.push( torrent );
            }
            return toreturn;
        };


    };



    var FeedManager = function(client) {
        var manager = this;
        manager.__name__ = 'FeedManager';
        manager.client = client;
        manager.feeds = null;
        manager.fetched = false;
    };
    window.FeedManager = FeedManager;

    FeedManager.prototype = new function() {
        var on_full_response = function(json) {
            this.cacheid = json.torrentc;
            this.feeds = {};
            _.map(json.rssfeeds, function(data) {
                var feed = new Feed(this, data);
                this.feeds[feed.ident] = feed;
            }, this);
            return this;
        };

        var on_update_response = function(json) {
            var self = this;
            this.cacheid = json.torrentc;
            var changed = json.rssfeedp;
            var removed = json.rssfeedm;

            _.map(removed, function(item) {
                delete self.feeds[item];
            });
            _.map(changed, function(item) {
                var feed = new Feed(self, item);
                self.feeds[feed.ident] = feed;
            });


        };

        var on_response = function(json) {
            this.fetched = true;
            this.fetch_time = new Date();
            if (json.rssfeedm || json.rssfeedp) {
                return on_update_response.apply(this, [json]);
            } else {
                return on_full_response.apply(this, [json]);
            }
        };

        var async_call = function(callback) { this.client.raptor.post( {list:1}, {}, callback ); };


        this.eat = function(json) { return on_response.apply(this, [json]); };

        this.keys = make_async_method( async_call, on_response,
                                       function () { return _.keys(this.feeds); } );
        this.update = make_async_method( async_call, on_response,
                                      function () { return this.feeds; }, true );
        this.all = make_async_method( async_call, on_response,
                                      function () { return this.feeds; } );
        this.get = make_async_method( async_call, on_response,
                                      function (key) { return this.feeds[key]; } );
        
        this.getwith = function( kwargs ) {

            for (feedid in this.feeds) {
                var match = true;
                for (key in kwargs) {
                    var value = (key == 'url') ? this.feeds[feedid][key].split('|')[1] : this.feeds[feedid][key]; // it's terribel that the api returns fields that are "|" separated, but what can you do...
                    if (value != kwargs[key]) {
                        match = false;
                        continue;
                    }
                }

                if (match) { return this.feeds[feedid]; }
            }
            
        };

        this.add = function(url, callback) { this.client.raptor.post( { action: 'rss-update' }, { url: url }, callback ); };

        this.getByIdent = make_async_method(async_call, on_full_response,
                                            function(ident) {
                                                for (var feed in this.feeds) {
                                                    if (this.feeds[feed].ident == ident) {
                                                        return this.feeds[feed];
                                                    }
                                                }
                                            });

    };

    var Feed = function(manager, data) {
        var feed = this;
        feed.__name__ = 'Feed';
        feed.manager = manager;
        feed._items = {};
        feed._data = data;
        _.map( APISpecification.feed, function(spec, index) {
            if (spec.name == 'items') {

                _.each(data[index], function(itemdata) {
                    var item = new FeedItem(feed, itemdata);
                    if (item.torrent) {
                        itemdata.push(item.torrent);
                    }
                    feed._items[item.uid] = item;
                });

            } else {
                feed[spec.name] = data[index];
            }
        }, this);


        // also insert dummy feed items with the torrents that have
        // this as a feed url
        // client.torrent.getallwith( { 'rss_feed_url': this.url } );

    };
    Feed.prototype = {
        get_name: function() {
            return this.url.split('|')[0];
        },
        get_url: function() {
            return this.url.split('|')[1];
        },

        update: function(name, url) {
            this.manager.client.raptor.post( { action:'rss-update', feedid: this.ident }, { alias: name, url: url } );
        },

        tryadd: function( feeditem, onsuccess, onfailure ) {
            var self = this;
            // registers that a feeditem add was attempted... will
            // if after 10 seconds the item wasn't added, then notify
            // the user?

            var poll_interval = 200;
            var timeout = 10 * 1000; // 10 seconds
            var add_time = (new Date());

            function check() {
                if (new Date() - add_time > timeout) {
                    console.log((timeout/1000).round(0), 'seconds after attempted add feed',feeditem,'as torrent');
                    if (feeditem.url_contains_hash()) {
                        feeditem.add_magnet();
                    }
                    if (onfailure) { onfailure(); }
                } else {
                    var torrent = feeditem.get_torrent();
                    if (torrent) {
                        console.log('successfully turned rss feed item into torrent');
                        if (onsuccess) { onsuccess(); }
                    } else {
                        setTimeout( check, poll_interval );
                    }
                }
            }

            setTimeout( check, poll_interval );

        },

        isSubscribed: function() {
            var rules = this.manager.client.feedrule.all();
            for (var ident in rules) {
                var rule = rules[ident];
                if (rule.filter == '*' && rule.feed == this.ident) { 
                    if (rule.flags == 1) {  // enabled???
                        return true; 
                    }
                }
            }
            return false;
        },
        remove: function() {
            // remove the rss feed
            console.log('feed remove please');
            this.manager.client.raptor.post( { action:'rss-remove', feedid: this.ident } );
        },
        enable: function() {
            // enable the feed
            console.log('enable feed...');
            this.manager.client.raptor.post( { action:'rss-update', feedid: this.ident, enabled: true } );
        },
        disable: function() {
            // disable the feed
            console.log('disable feed...');
            this.manager.client.raptor.post( { action:'rss-update', feedid: this.ident, enabled: false } );
        },
        data: function(torrents_in_history_too) { 
            if (torrents_in_history_too) {
                var _this = this;
                var torrents = _.filter( this.manager.client.torrent.all(), function(t) { return t.rss_feed_url == _this.get_url(); } );
                var feedurls = {}; _.each( this._items, function(i) { feedurls[i.url]=true; } );
                torrents = _.filter( torrents, function(t) { return feedurls[t.download_url] == undefined; } );
                return torrents.concat( _.values(this._items) ); // causing duplicates... 
            } else {
                return _.values(this._items); 
            }
        }
    };

    var FeedItem = function(feed, data) {
        var feeditem = this;
        feeditem.__name__ = 'FeedItem';
        feeditem.feed = feed;

        _.map( APISpecification.feed_item, function(spec, index) {
            feeditem[spec.name] = data[index];
        });
        feeditem.uid = feeditem.url;
        var torrent = this.get_torrent();
        if (torrent) { this.torrent = torrent; }
    };

    FeedItem.prototype = {

        __html__: function() { 
            var html = 'Feed item: "' + this.name_full + '" with url <a target="_new" href="'+this.url+'">'+this.url+'</a>'; 

            if (this.url_contains_hash()) {
                html += "<p>The URL contains what appears to be an infohash. We'll try to add using a magnet link (using the distributed hash table to find the torrent file)</p>";
                html += '<a href="'+this.magnet_url()+'">magnet link</a>';
            }
            return html;

        },

        url_contains_hash: function() {
            // if the url looks like it contains a hash, then try to
            // add as a magnet link...

            // 40 or 44?
            var match = this.url.match( '[0-9a-fA-F]{40}' );
            if (match) {
                return match[0];
            }


        },

        magnet_url: function() {
            var hash = this.url_contains_hash();
            if (hash) {
                var opentracker = 'http://denis.stalker.h3q.com:6969/announce';
                var url = make_magnet_link(hash) + '&dn=' + escape(this.name_full) + '&tr' + escape(opentracker);
                return url;
            }
        },

        add_magnet: function() {
            var url = this.magnet_url();
            if (url) {
                console.log('adding feed',this,'via magnet link');
                this.feed.manager.client.raptor.post({ action: 'add-url', feedid: this.feed.ident }, {s: url}); // want to pass in feed url too...
            }
        },

        add: function(callback, failure) {
            //this.feed.tryadd( this, callback, failure );

            // the client ripped out functionality that would make
            // this actually work.

            var url = { action: 'add-url', feedid: this.feed.ident };
            var body = { s: this.url };
            console.log('feeditem add',url,body);
            this.feed.manager.client.raptor.post(url, body);

            var _this = this;
            if (this.url_contains_hash()) {
                setTimeout( function() {
                    _this.add_magnet();
                }, 200);
            }
        },

        mutator_add_rss_url: function() {
            // some common mutators from rss link to the actual
            // torrent file -> append /download.torrent
            return this.url + (this.url[this.url.length-1]=='/' ? '' : '/') + 'download.torrent';
        },

        get_torrent: function() {
            // this should be cached per each torrent response cacheid, at the least
            var torrent = this.feed.manager.client.torrent.getwith( { download_url : this.url,
                                                                      rss_feed_url: this.feed.get_url() } );
            if (torrent) { 
                return torrent;
            } else {
                var match = this.url.match( '[0-9a-fA-F]{40}' );
                if (match) {
                    var hash = match[0];
                    torrent = this.feed.manager.client.torrent.get(hash.toUpperCase());
                    if (torrent) { return torrent; }
                }
            }

        }
    };


    var FeedRule = function(manager, data) {
            var feedrule = this;
            feedrule.manager = manager;
            _.map( APISpecification.feed_rule, function(spec, index) {
                feedrule[spec.name] = data[index];
            });
    };

    FeedRule.prototype = {
        getfeed: function() {
            return this.manager.client.feed.getByIdent(this.feed);
        }
    };



    var FeedRuleManager = function(client) {
        var manager = this;
        manager.__name__ = 'FeedRuleManager';
        manager.client = client;
        manager.rules = null;
        manager.fetched = false;
    };
    window.FeedRuleManager = FeedRuleManager;

    FeedRuleManager.prototype = new function() {

        var on_full_response = function(json) {
            //this.cacheid = json.torrentc;
            var self = this;
            this.rules = {};
          if (json.rssfilters){
            _.each(json.rssfilters, function(data) {
                var rule = new FeedRule(self, data);;
                self.rules[rule.ident] = rule;
            });
          }
            return this;
        };

        var on_update_response = function(json) {
            var self = this;
            this.cacheid = json.torrentc;
            var changed = json.rssfilterp;
            var removed = json.rssfilterm;

          if(removed) {
            _.each(removed, function(item) {
                delete self.rules[item];
            });
          }
          if(changed) {
            _.each(changed, function(item) {
                var rule = new FeedRule(self, item);
                self.rules[rule.ident] = rule;
            });
          }

        };

        var on_response = function(json) {
            this.fetched = true;
            this.fetch_time = new Date();
            if (json.rssfilterm || json.rssfilterp) {
                return on_update_response.apply(this, [json]);
            } else {
                return on_full_response.apply(this, [json]);
            }
        };




        var async_call = function(callback) { this.client.raptor.post( {list:1}, {}, callback ); };

        this.keys = make_async_method( async_call, on_response,
                                       function () { return _.keys(this.rules); } );
        this.all = make_async_method( async_call, on_response,
                                      function () { return this.rules; } );
        this.get = make_async_method( async_call, on_response,
                                      function (key) { return this.rules[key]; } );

        this.eat = function(json) { return on_response.apply(this, [json]); };
    };

        



    var Torrent = function(manager, data) {

        var torrent = this;
        torrent.__name__ = 'Torrent';
        torrent.manager = manager;
        _.map( APISpecification.torrent, function(spec, index) {
            torrent[spec.name] = data[index];
            if (spec.alias) {
                torrent[spec.alias] = data[index];
            }
        });
        torrent.uid = torrent.hash.toUpperCase();

        torrent.data( data );
        torrent.properties = {
            all: function() { return torrent; },
            keys: function() { return _.keys(torrent); },
            set: function(k,v) { },
            get: function(k, def) { return torrent[k] !== undefined ? torrent[k] : (def?def:null); }
        };
        torrent.file = new FileManager(torrent);
        torrent.setting = new TorrentSettingManager(torrent);
        torrent.peer = new PeerManager(torrent);
        torrent.status_array = this.get_status();
    };

    Torrent.prototype = new function() {

        var bit_info = APISpecification.torrent[ APISpecification.torrent_lookup['status'] ].bits;

        var methods = {

            __html__: function() {
                return this.name + 'oooooieee!';
            },

            should_be_hidden: function() {
                return this.label === 'uChat';
            },

            magnet_link: function() {
                var prefix = 'magnet:?xt=urn:btih:';
                return prefix + this.hash;
            },

          coverart: function() {
            // locates something that looks like coverart... (just the
            // first image for now)
            var K = this.file.keys()
            if (this.file.get('coverart.jpg')) {
              return this.file.get('coverart.jpg');
            }
            for (var i=0; i < K.length; i++) {
              var file = this.file.get(K[i]);
              if (file.isImage()) { return file; }
            }
          },

            get_web_seed_link: function() {
                return 'http://' +
                    document.location.hostname + ':' +
                    (parseInt(document.location.port,10) - 1000) +
                    '/talon/seed/' + this.manager.client.data.cid + '/content/' + this.stream_id;
            },
            get_web_seed_torrent_link: function() {
                return 'http://' +
                    document.location.hostname + ':' +
                    (parseInt(document.location.port,10) - 1000) +
                    '/talon/seed/' + this.manager.client.data.cid + '/torrent/' + this.stream_id;
            },

            get_setting: function(key) {
                if (this.setting.fetched) {
                    return this.setting.settings[key];
                }
            },
            started: function() {
                return _.contains(this.status_array, 'started');
            },
            context_menu_items: function() {
                var _this = this;
                var items = [{'label':locale('ML_FORCE_START'), 'callback': function() {_this.start('force');}},
                             {'label':locale('ML_START'), 'callback': function() {_this.start();}},
                             {'label':locale('ML_PAUSE'), 'callback': function() {_this.pause();}},
                             {'label':locale('ML_STOP'), 'callback': function() {_this.stop();}},
                             {'label':locale('ML_DELETE_TORRENT'), 'callback': function() {_this.removetorrent();}},
                             {'label':locale('ML_DELETE_DATATORRENT'), 'callback': function() {_this.removedatatorrent();}},
                             null,
                             {'label':locale('ML_QUEUEUP'), 'callback':function(){_this.queueup();}},
                             {'label':locale('ML_QUEUEDOWN'), 'callback':function(){_this.queuedown();}},
                             null,
                             {'label':locale('ML_FORCE_RECHECK'), 'callback':function(){_this.recheck();}},
                             {'label':locale('OV_NEW_LABEL'), 'callback':function() {DialogManager.show("AddLabel");}},
                             null]
                if (_.contains(this.status_array, 'error')) {
                    items.push( { label: locale('ML_FORCE_RECHECK'), callback: function() { _this.callapi('recheck'); } } );
                }
                return items;
            },

            get_progress_text: function() {
                // if (this.message) { return this.message; } // xxx:
                // this messes up localization
				var data = this.progress;
				var complete = (this.progress == 1000);

                if (_.contains(this.status_array, 'paused')) {
                    return locale('OV_FL_PAUSED');
                }

				if (_.contains(this.status_array, 'checking')) {
					return locale('OV_FL_CHECKED').replace(/%:\.1d%/, (data / 10).toFixedNR(1));
				}

                if (complete) { 
                    if (_.contains(this.status_array, 'queued')) {
                        if (_.contains(this.status_array, 'started')) {
                            return (this.forcestart ? '[F] ' : '') + locale('OV_FL_SEEDING');
                        } else {
                            return locale('OV_FL_QUEUED_SEED');
                        }
                    } else if (_.contains(this.status_array, 'started')) {
                            return (this.forcestart ? '[F] ' : '') + locale('OV_FL_SEEDING');
                    } else if (_.contains(this.status_array, 'error')) {
                        return locale('OV_FL_ERROR').replace(': %s', '');
                    } else {
                        return locale('OV_FL_FINISHED');
                    }
                } else {
                    if (_.contains(this.status_array, 'queued') && !_.contains(this.status_array, 'started')) {
                        return locale('OV_FL_QUEUED');
                    } else if (!_.contains(this.status_array, 'queued') && 
                               !_.contains(this.status_array, 'started')) {
                        return locale('OV_FL_STOPPED') + ' ' + data/10 + locale('FI_COL_PCNT');
					} else if ( this.forcestart ){
                        return '[F] ' + locale("OV_CAT_DL") + ' ' + data/10 + locale('FI_COL_PCNT');
                    } else {
                        return locale("OV_CAT_DL") + ' ' + data/10 + locale('FI_COL_PCNT');
                    }
                }

            },

            get_progress_color: function() {
                var complete = (this.progress == 1000);
                var color = 'grey';
                if (_.contains(this.status_array, 'paused')) {
                    color = 'grey';
                } else if (_.contains(this.status_array, 'error')) {
                    color = 'red';
                } else if (_.contains(this.status_array, 'started')) {
                    if (complete) {
                        color = 'ltgreen';
                    } else {
                        color = 'blue';
                    }
                } else {
                    if (complete) {
                        color = 'green';
                    } else if (_.contains(this.status_array, 'queued')) {
	                    color = 'blue';
                    }
                }
                return color;
            },

            matchesCategory: function(filter) {
                if (filter === undefined) {
                    return true;
                } else if (filter.__name__ == 'Label') {
                    var label = filter;
                    if (label.name == 'No Label') {
                        return this.label == '';
                    } else {
                        return this.label == filter.name;
                    }
                } else if (filter.status) {
                    if (this.should_be_hidden()) { return false; }
                    switch (filter.status) {
                    case 'All':
                        return true;
                        break;                 
                    case 'Not Alone':
                        return this.peers_connected > 0 || this.seed_connected > 0;
                    case 'Downloading':
                        return this.isDownloading();
                        break;
                    case 'Completed':
                        return this.isCompleted();
                        break;
                    case 'Active':
                        return this.isActive();
                        break;
                    case 'Seeding':
                        return this.isSeeding();
                        break;
                    case 'Inactive':
                        return ! this.isActive();
                        break;
                    }
                } else {
                    return false;
                }
            },

            isDownloading: function() {
                // cache get_status() call... extra column
/*
                if( _.contains( this.get_status(),
                                'started' ) ) {
                    return true;
                }
                */

                //return this.down_speed > 0;
                return this.progress < 1000 && _.contains(this.status_array,'started');

            },
            isCompleted: function() {
                return (this.progress == 1000);
            },
            isActive: function() {
                //return (this.down_speed > 0 || this.up_speed > 0 || this.peers_connected > 0 || this.seed_connected > 0 );
                return this.peers_connected > 0 || this.seed_connected > 0;
            },
            isSeeding: function() {
                return (this.isCompleted() && _.contains(this.status_array, 'started') && ! _.contains(this.status_array, 'paused'));
            },
            hasLabel: function(label) {
                return this.label == label;
            },

            data: function(data) { 
                var self = this;
                if (data === undefined) {
                    return this._data;
                } else {
                    this._data = data;
                    _.map( APISpecification.torrent, function(spec, index) {
                        self[spec.name] = data[index];
                        if (spec.alias) {
                            self[spec.alias] = data[index];
                        }
                    });
                }
            },

            get_status: function() {
                var self = this;

                var statuses = [];
                _.map( bit_info, function(value, index) {
                    if ( Math.pow(2, index) & self.status ) {
                        statuses.push( value );
                    }
                });
                if ( !_.contains(statuses,'queued') && _.contains(statuses,'started')){
                    this.forcestart = true;
                }
                else{ this.forcestart = false; }
                self._statuses = statuses;
                return statuses;
            },

            callapi: function( action, parameter, callback ) {
                // support multi (additional hashes...)

                var params = { action: action };
                if (parameter) {
                    if (action == 'add-url') {
                        _.extend(params, {s: parameter});
                    } else { // set priority
                        _.extend(params, {p: parameter});
                    }
                }
                this.manager.client.raptor.post( params, { hash: this.hash } );
            },

          single_file_playable: function() {
            var playable = _.filter( _.values( this.file.all() ), function(f) { return f.playable(); } );
            if (playable.length > 0) {
              return playable[0];
            }
          },

            start: function(forced) { if (forced) { this.callapi('forcestart'); } else { this.callapi('start'); } },
            stop: function() { this.callapi('stop'); },
            pause: function() { this.callapi('pause'); },
            unpause: function() { this.callapi('unpause'); },
            forcestart: function() { this.callapi('forcestart'); },
            recheck: function() { this.callapi('recheck'); },
            removetorrent: function() { this.callapi('removetorrent'); },
            removedatatorrent: function() { this.callapi('removedatatorrent'); },

            setprio: function(prio) { this.callapi('setprio', prio); },

            set_property: function(key,value) { this.manager.client.raptor.post( { action: 'setprops' }, { hash: this.hash, s:key, v:value } ); },

            set_priority: function(prio) { this.setprio(prio); },
            queuebottom: function() { this.callapi('queuebottom'); },
            queuedown: function() { this.callapi('queuedown'); },
            queuetop: function() { this.callapi('queuetop'); },
            queueup: function() { this.callapi('queueup'); },

            update: function(cb) { this.manager.update(cb); },

            get_label: function() {
                return this.manager.client.label.get(this.label);
            },

            get_feed: function() {
                return this.manager.client.feed.getwith( {'url': this.rss_feed_url} );
            },
            get_app: function() {
                if (this.app_update_url) {
                    return this.manager.client.app.getwith( {'update_url': this.app_update_url} );
                }
            }

        };

        _.extend(this, methods);

    };


    var ClientSetting = function(manager, data) {

        var setting = this;
        setting.manager = manager;
        setting.__name__ = 'ClientSetting';
        //setting.manager = manager;

        var type_index = APISpecification.client_setting_lookup.type;
        var value_map = APISpecification.client_setting[type_index].value_map;
        var data_type = value_map[data[type_index]];

        _.map( APISpecification.client_setting, function(spec, index) {
            if (spec.name == 'access') {
                setting.access = spec.value_map[ data[index].access ];
            } else if (spec.value_map) {
                setting[ spec.name ] = spec.value_map[data[index]];
            } else if (spec.name == 'value') {
                if (data_type == 'int') {
                    setting[ spec.name ] = parseInt(data[index],10);
                } else if (data_type == 'bool') {
                    setting[ spec.name ] = (data[index] == 'true');
                } else {
                    setting[ spec.name ] = data[index];
                }
            } else {
                setting[ spec.name ] = data[index];
            }
        } );


    }

    ClientSetting.prototype = new function() {

        this.set = function(value) {
            this.manager.client.raptor.post( { action: 'setsetting', s: this.name, v: value } );
        };

    };


    var EventManager = function(client) {
        /* 

    { "appStopping", offsetof(BtApp, events.appStopping), XE_FUNC | SE_ACCRW },
    { "torrentStatus", offsetof(BtApp, events.torrentStatus), XE_FUNC | SE_ACCRW },
    { "clientMessage", offsetof(BtApp, events.clientMessage), XE_FUNC | SE_ACCRW },
    { "appDownloadProgress", offsetof(BtApp, events.appDownloadProgress), XE_FUNC | SE_ACCRW },
    { "appUninstall", offsetof(BtApp, events.appUninstall), XE_FUNC | SE_ACCRW },


         */
        this.__name__ = 'EventManager';
        this.client = client;
        this._events = {};
    };
    EventManager.prototype = {
        add_listener: function(event_name, callback) {
            // add an event listener for an event type
        }
    };

    var Event = function(manager) {
    };
    


    var AppManager = function(client) {
        this.__name__ = 'AppManager';
        this.client = client;
        this.fetched = false;
        this._apps = {};
        this.featured_apps_lookup = {};
        if (config.client_apps || (config.cookies && config.cookies.client_apps)) { return; }

        if (config.classic_iphone_interface) {
            //dont bother with app stuff if on the classic iphone interface
            return;
        }


        // these apps are special. their content is served from talon
        // directly and their javascript has been minified.

        // TODO: make them share the same apps-sdk javascript
        if (config.webui) {
            this.featured_apps = [ 
                { 'app_update_url': "http://apps.bittorrent.com/ubrowse/ubrowse.btapp",
                  'name': 'uBrowse',
                  'alias': 'ubrowse' }
            ];
        } else {
            if (window.featured_apps) {
                this.featured_apps = window.featured_apps;
            } else {
                this.featured_apps = [];
            }
            /*
            // var app_requires = { 'uMap': 'peers', 'browse': 'files' };
            _.each( this.featured_apps, function(data) {
                if (_.contains( app_requires, data['alias'] )) {
                    data['requires'] == app_requires[data['alias']];
                }
            });
 
            */
            if (config && config.dev_mode) {
                this.featured_apps = this.featured_apps.concat([
                  { 'app_update_url': 'http://10.0.3.3/static/apps/transcode/transcode.btapp',
                    'name': 'Transcode',
                    'hidden': true,
                    'alias': 'transcode' }
                ]);
            }
        }


        // update_url -> content_dir

if (window.sha1Hash && ! config.webui) {

        var _this = this;
        _.each( this.featured_apps, function(def) {
            _this.featured_apps_lookup[ def['app_update_url'] ] = def['alias'];
            var app = new App(_this, [def['name'], def['app_update_url'], 'featured'] );
            app._featured = true;
            if (def['requires']) {
                app.requires = def['requires'];
            }
            _this._apps[ def['app_update_url'] ] = app;
        });

}
        this.fetched = true; // make_async_method doesnt allow .get() on
        // featured apps unless fetch comes first so this is a little
        // hack for now...


    };
    window.AppManager = AppManager;

    AppManager.prototype = new function() {
        function eat(json) {
            this.fetched = true;
            this.fetch_time = new Date();
            var _this = this;
            if (json.apps) {
                _.map(json.apps, function(data) {
                    var app = new App(_this, data)
                    var uid = app.uid();
                    if (_this._apps[uid]) {
                        if (_this._apps[uid].featured) {
                            // dont update featured app!
                        } else {
                            // then just update the other properties... 
                        }
                    } else {
                        _this._apps[uid] = app;
                    }
                    if (app.is_store_app()) {
                        this._store_app = app;
                    }
                });
            }
        };
        function async_call(callback) { /*raptor.post( {list:1}, {}, callback );*/ };

        var methods = {
            eat: function(json) { eat.apply(this, [json]); },
            keys: make_async_method( async_call, eat,
                                     function () { return _.keys(this._apps); } ),
            all: make_async_method( async_call, eat,
                                    function () { return this._apps; } ),
            installed_apps: make_async_method( async_call, eat,
                                               function () { return _.filter(this._apps, function(a) { return ! a.is_store_app(); }); } ),
            update: make_async_method( async_call, eat,
                                       function () { return this._apps; }, true ),
            get: make_async_method( async_call, eat,
                                    function (key) { return this._apps[key]; } ),
            get_installed_count: function() {
                return _.filter( this._apps, function(app) { return ! app.is_store_app(); } ).length;
            },
            get_store_app: function() {
                return this._store_app;
            },
            getwith: function( kwargs ) {
                for (uid in this._apps) {
                    var app = this._apps[uid];
                    var match = true;
                    for (key in kwargs) {
                        if (app[key] != kwargs[key]) {
                            match = false;
                            continue;
                        }
                    }
                    if (match) { return app; }
                }
            }


        };
        var _this = this;
        _.each(methods, function(v,k) { _this[k] = v; });
    };

    var App = function(manager, data) {
        this.__name__ = 'App';
        this.manager = manager;
        this._data = data;
        //this._props = {};
        var _this = this;
        _.map( APISpecification.app, function(spec, index) {
            _this[ spec.name ] = data[index];
            //_this._props[ spec.name ] = data[index];
        } );
        if (!window.sha1Hash) {
            this.update_url_hash = null;
            console.warn('sha1 hash not defined');
        } else {
            this.update_url_hash = sha1Hash(this.update_url).toUpperCase();
        }
    };
    App.prototype = {
        uid: function() {
            //return this.name + ' ' + this.version;
            return this.update_url;
        },
        is_store_app: function() {
            return this.update_url == "http://apps.bittorrent.com/store/store.btapp";
        },
        get_url_name: function() {
            var parts = this.update_url.split('/');
            var path = parts[parts.length - 2];
            return path;
        },
        get_content_path: function(force_local) {
            if (this.update_url in this.manager.featured_apps_lookup) {
                if (force_local) {
                    // for the main app index.html, we have to serve
                    // directly from raptor otherwise iframe accessing
                    // parent iframe (port different) fails
                    var prefix = '';
                } else {
                    var prefix = (config.static_prefix ? config.static_prefix : '' );
                }
                var path = prefix + (config.webui ? '/gui' : '' ) + '/static/apps/' + this.manager.featured_apps_lookup[this.update_url] + '/';
                return path;
            }

            //return '/static/apps/' + this.get_url_name() + '/';
            return '/client/gui/apps/' + this.update_url_hash + '.btapp' + '/';
        },
        get_icon: function() {
            if (this.update_url in this.manager.featured_apps_lookup || true) {
                return this.get_content_path() + 'icon.png?' + this.manager.client.client_qs();
            } else {
                // most apps dont seem to bundle a png version of
                // their icon :-(
                return this.get_content_path() + 'icon.bmp?' + this.manager.client.client_qs();
            }
            
        },
        get_icon_html: function() {
            return '<img src="' + this.get_icon() + '" title="'+this.name+'" alt="'+ this.name +'" />';
        }
    };

    function Session(manager, data) {
	this.manager = manager;
        for (k in data) {
            this[k] = data[k];
        }
    }
    Session.prototype = {
        uid: function() { return this.guid; },
        looks_local: function() {
/*
according to wikipedia...

24-bit block    10.0.0.0 – 10.255.255.255    16,777,216    single class A    10.0.0.0/8 (255.0.0.0)    24 bits
20-bit block    172.16.0.0 – 172.31.255.255    1,048,576    16 contiguous class Bs    172.16.0.0/12 (255.240.0.0)    20 bits
16-bit block    192.168.0.0 – 192.168.255.255    65,536    256 contiguous class Cs    192.168.0.0/16 (255.255.0.0)    16 bits
*/
            var parts = this.sock_ip.split('.');
            if (parts.length == 4) {
                if (parts[0] == '10') {
                    return true;
        } else if (parts[0] == '172' && parseInt(parts[1]) >= 16 && parseInt(parts[1] < 32)) {
            return true;
                } else if ((parts.slice(0,2)).join('.') == '192.168') {
                    return true;
                }
            }
        },
        local_gui_url: function() {
            return config.path_gui +'?local=' + escape(this.sock_ip+':'+this.manager.client.setting.get('bind_port').value);
        }
    };

    function SessionManager(client) {
	this.client = client;
        this._sessions = {};
    }
    window.SessionManager = SessionManager;
    SessionManager.prototype = {
        eat: function(json) {
            for (var i = 0; i < json.sessions.length; i++) {
                var session = new Session(this, json.sessions[i]);
                this._sessions[ session.uid() ] = session;
            }
        },
        current: function() {
            for (var k in this._sessions) {
                if (this._sessions[k].guid == jQuery.cookie('GUID')) {
                    return this._sessions[k];
                }
            }
        }
    };

    var LabelManager = function(client) {
        var manager = this;
        manager.fetched = false;
        manager.labels = null;
        manager.nolabel = new Label(this, ['No Label',0]);
        manager.__name__ = 'LabelManager';
        manager.client = client;
    };
    window.LabelManager = LabelManager;
    LabelManager.prototype = new function() {
        var on_full_response = function(json) {
            this.fetched = true;
            this.fetch_time = new Date();
            //this.cacheid = json.torrentc;
            this.labels = {};

            return this;
        };
        
        this.correct_counts_for_primary = function ( torrents ) {
            var lbl_count  = {};
            _.each(torrents, function (t) {
                var lbl = jQuery.trim(t.label);
                if (lbl) {
                    if(lbl_count[lbl]) {
                        lbl_count[lbl] += 1;
                    } else {
                        lbl_count[lbl] = 1;
                    }
                }
            });

            _.each(_.keys(lbl_count), function(lbl) {
                    this.labels[lbl] = new Label(this, [lbl, lbl_count[lbl]]);
            }, this);
           
            return this;
        };

        var async_call = function(callback) { this.client.raptor.post( {list:1}, {}, callback ); };

        this.eat = function(json) { return on_full_response.apply(this, [json]); };

        this.keys = make_async_method( async_call, on_full_response,
                                       function () { return _.keys(this.labels); } );
        this.all = make_async_method( async_call, on_full_response,
                                      function () { return this.labels; } );
        this.update = make_async_method( async_call, on_full_response,
                                      function () { return this.labels; }, true );
        this.get = make_async_method( async_call, on_full_response,
                                      function (key) { return this.labels[key]; } );
    };


    var Label = function(manager, data) {
        var label = this;
        label.__name__ = 'Label';
        label.manager = manager;

        _.map( APISpecification.label, function(spec, index) {
            label[ spec.name ] = data[index];
        } );
    };

    Label.prototype = {
        torrents: function() {
            var self = this;
            return _.filter(this.manager.client.torrent.all(),
                            function(torrent) { return (torrent.label == self.name); });
        }
    };


    var ClientSettingManager = function(client, data) {
        var manager = this;
        manager.__name__ = 'ClientSettingManager';
        manager.client = client;
        manager.settings = null;
        manager.fetched = false;
    };
	
    window.ClientSettingManager = ClientSettingManager;
    
	ClientSettingManager.prototype = new function() {

        var on_full_response = function(json) {
            this.fetched = true;
            this.fetch_time = new Date();
            //this.cacheid = json.torrentc;
            this.settings = {};
            _.map(json.settings, function(data) {
                
                var cs = new ClientSetting(this, data);
                this.settings[cs.name] = cs;

            }, this);
            return this;
        };

        var async_call = function(callback) { this.client.raptor.post( { action: 'getsettings' }, {}, callback ); };

        this.keys = make_async_method( async_call, on_full_response,  
                                       function() { return _.keys(this.settings); } );
        this.all = make_async_method( async_call, on_full_response,  
                                      function() { return this.settings; } );
        this.get = make_async_method( async_call, on_full_response, 
                                      function(key) { return this.settings[key]; } );
        this.update = make_async_method( async_call, on_full_response,  
                                         function() { return this.settings; }, true );

        this.set = function(key, val, callback, fail_cb) {
            // too bad this doesnt do the fancy multi key value thing
            this.client.raptor.post( { action: 'setsetting', s: key, v: val }, 
                                     {},
                                     callback, fail_cb );
            
        };
    };


})(exports._, jQuery);

// I stuck this all the way down here because it breaks emacs
// js-espresso-mode syntax highlighting

String.prototype.replacebacks = function() {
  return this.replace(/\\/g,'/');
};
