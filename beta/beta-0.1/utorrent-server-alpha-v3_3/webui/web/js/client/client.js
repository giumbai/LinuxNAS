(function(_) {

     function ClientManager(autologin_data) {
         /*


          This class is responsible for maintaining necessary
          information for resuming uT sessions.

          There are 3 types of connections

          1) locally paired connections. These have a 40 character key
          and happen only over localhost. Unfortunately currently
          there is no other information given (computer id, etc)

          2) direct (i.e. WebUI) connections, in which the connection
          is made directly to the uT client over the network.

          3) remote (i.e. raptor proxied) connections.


          all information about sessions is stored within a "sessions"
          cookie that runs across all of *.utorrent.com. The
          javascript is completely responsible for maintaining this
          cookie.

          when passing between say remote.utorrent.com (login) to a
          rapton-*.utorrent.com, we need to pass the encryption key
          for all sessions. this is done by serializing the {GUID->key}
          pairs into window.name.

          */
         this._clients = {};
         this._store = fjQuery.jStorage;
         this._current = null;
         this._app = null;

         if (autologin_data) {
             this.do_autologin(autologin_data);
         } else if (window.autologin_data) {
             this.do_autologin(window.autologin_data);
         }

     }
     window.ClientManager = ClientManager;
     ClientManager.prototype = {
         do_autologin: function(data) {
             if (config.asserts) { debugger; }
             this._called_autologin = true;
             data = data || window.autologin_data;
             window.clients = this;
             clients.sync(window.autologin_data.sessions, window.autologin_data.enc_keys);
             //window.name = jQuery.toJSON( this.serialize( { window_name: true } ) );

             var which_client = data.current_client;

             if (which_client.type == 'remote') {
                 clients.set_current_client(which_client.key);
             } else {
                 clients.set_current_client(null);
             }
             var client = clients.get_current_client();
             if (client) {
                 client.go_to_gui_page();
             } else {
                 console.error('autologin setup client failed (should not happen) -- redirect to basic login page?');
                 debugger;
             }
         },
       redirect: function(new_location) {
           if (config.asserts) { debugger; }
             // put encryption keys in window.name and move location
             // not very robust, does not handle basic cookie/session information
             var serialized_keys = this.serialize( {window_name:true} );
             window.name = jQuery.toJSON( serialized_keys );
             window.location = new_location;
         },
         login_remote: function(username, password, opts) {
             // create a new client and login remotely with srp
             var client = new Client(null, this, null, opts);
             client.negotiate_session_key(username, password, opts);
         },
         create_paired_client: function(options) {
             // create a new paired client 
             var api = new ClientAPI();
             api.pairing = new Pairing(options, api);
             var client = new Client( null, clients, { api: api } );
             // guid manager data
             clients.add(client);
             clients.set_current_client();
         },
         add_to_sessions_cookie: function(client) {
             var s = jQuery.cookie('sessions') || '{}';
             s = jQuery.parseJSON(s);

             var todelete = [];
             // this cookie can get very big... purge
             // out other sessions with the same username. Also purge
             // if it gets too big (nginx has a limit on header size)
             for (var guid in s) {
                 if (client.data.bt_user == s[guid].u) {
                     // if there is a a stored session cookie with this username already
                     todelete.push( guid );
                 }
             }
             _.each( todelete, function(guid) {
                         delete s[guid];
                     });
             if (_.keys(s).length > 10) {
                 s = {};
             }
             _.extend(s, client.serialize({cookie:true}));
             this.save_sessions_cookie(s);
         },
         save_sessions_cookie: function(sessions) {
             // XXX does this work in IE???
             var opts = { expires: 14, path: '/', domain: config.cookie_domain};
             jQuery.cookie('sessions', jQuery.toJSON(sessions), opts );
         },
         add: function(client) {
           this._clients[client.guid] = client;
         },
         sync: function(manual_store, enc_keys) {
             /*
              restores sessions from local storage, cookies, and window.name

              sessions cookie holds cid, bt_user, guid

              local storage holds guid, enc key
              
              window.name also holds guid, enc key (and overrides local storage values)
              */

             if (manual_store) {
                 var sessions = manual_store;
                 enc_keys = enc_keys || null;
             } else {
                 var _this = this;
                 // reads from falconStore.sessionKeys
                 var stored_keys = this._store.get('falconStore.sessionKeys') || {};
                 var window_keys = {};
                 try {
                     window_keys = jQuery.parseJSON(window.name);
                 } catch(e) {

                 }
                 window.name = "";
                 enc_keys = enc_keys || {};
                 _.extend( enc_keys, stored_keys, window_keys );

                 var agent=navigator.userAgent.toLowerCase();
                 var is_iphone = (agent.indexOf('iphone')!=-1);
                 var is_ipad = (agent.indexOf('ipad')!=-1);
                 var url_sessions = window_urlparams.sessions;

                 if (window_urlparams.sessions) { 
                     // urlparam sessions take precedence
                     var sessions = jQuery.parseJSON( window_urlparams.sessions ); 

                     // now throw these into the cookies as a backup...
/*
                 } else if (jQuery.jStorage.get('sessions')) {
                     var sessions = jQuery.jStorage.get( 'sessions' ); 
*/
                 } else {
                     var sessions = {};
                     if (jQuery.cookie('sessions')) {
                         try {
                             sessions = jQuery.parseJSON( jQuery.cookie('sessions') );
                         } catch(e) {
                             console.error('error loading cookies from sessions cookie');
                         }
                     }

                 }

                 // This is a temporary fix for session break on standalone ios remote app
                 // ---- temporary begin ----
                 if ((is_iphone || is_ipad) && navigator.standalone) {
                    // If session was taken from url, include cookie session as well. Sessions got from url
                    // might be outdated for standalone iphone app
                    if (window_urlparams.sessions) {
                        var cookie_sessions = jQuery.parseJSON( jQuery.cookie('sessions') ) || {};
                        for (var s in cookie_sessions) {
                            if (cookie_sessions.hasOwnProperty(s)) {
                                sessions[s] = cookie_sessions[s];
                            }
                        }
                    }
                 }

                 console.log('url/cookie sessions',sessions,'domain',window.location.href);

                 //clean up unused stored encryption keys
                 var todelete = {};
                 for (var guid in enc_keys) {
                     var is_pairing_key = (guid.length == 40);
                     if (sessions[guid] === undefined && ! is_pairing_key) {
                         todelete[guid] = true; // no cookie session for this encryption key, so delete it
                     }
                 }
                 for (var k in todelete) {
                     console.log('deleting unused encryption key for guid',k);
                     delete enc_keys[k];
                 }

                 this._store.set('falconStore.sessionKeys', enc_keys);
             }

             var want_current_session = false;
             if (sessions['current'] !== undefined) {
                 want_current_session = sessions['current'];
                 delete sessions['current'];
             }


             for (var guid in sessions) {
                 var data = sessions[guid];
               if (data.pairing_port) {
                 // pairing stored session

                 var pairing_port = data.pairing_port;
                 var pairing_key = guid;
                 var api = new ClientAPI();
                 var options = {foundport: pairing_port, pairing_key: pairing_key, dontscan: true};
                 api.pairing = new Pairing(options, api);
                 var client = new Client( null, clients, { api: api } );
                 console.log('client resuming from stored pairing key', client);
                 //this._clients[pairing_key] = client;
                 this._clients[null] = client; // see get_paired_client
                 continue;
               }

                 if (enc_keys && enc_keys[guid]) {
                     data.key = enc_keys[guid];
                 } else if (data.k) {
                     data.key = data.k;
                 }
                 var verbose_data = { cid: data.c,
                                      bt_talon_tkt: data.t,
                                      bt_user: data.u,
                                      key: data.key
                                    };
                 if (guid === null) {
                     var client = new Client( guid, this, verbose_data );
                     console.log('initializing paired client',client);
                     this._clients[guid] = client;
                 } else if (! data.key) {
                     console.error('cookie session without corresponding encryption key -- remove');
                     if (config.asserts) { debugger; }
                     var client = new Client( guid, this, verbose_data );
                     client.remove_from_stored_sessions();
                 } else {
                     var client = new Client( guid, this, verbose_data );
                     console.log('initializing remote client!',client);
                     this._clients[guid] = client;
                 }
             }

             var opts = { expires: 14, path: '/', domain: config.cookie_domain};
             jQuery.cookie('sessions', jQuery.toJSON(this.serialize({cookie:true})), opts); // sets the default session

             if (want_current_session !== false) {
                 // the stored current session
                 if (want_current_session === null) { // paired client
                     if (this._clients[null]) {
                         this.set_current_client(null);
                     }
                 } else {
                     // sets guid cookie
                     if (this._clients[want_current_session]) {
                         this.set_current_client(want_current_session);
                     }
                 }

             }




/*
             var data = jQuery.jStorage.get('falconStore.pairingKey');
             if (data) {
                 var pairing_port = data[0];
                 var pairing_key = data[1];
                 var api = new ClientAPI();
                 var options = {foundport: pairing_port, pairing_key: pairing_key, dontscan: true};
                 api.pairing = new Pairing(options, api);
                 var client = new Client( null, clients, { api: api } );
                 console.log('client resuming from stored pairing key', client);
                 //this._clients[pairing_key] = client;
                 this._clients[null] = client; // see get_paired_client
             }
             */
         },
         register_paired_client: function(client) {
             console.log('register paired client',client);
             // unnecessary -- pairing.js itself stores this
             // register this pairing key 
             //jQuery.jStorage.set('falconStore.pairingKey', [client.raptor.api.pairing.foundport, client.raptor.api.pairing.pairing_key]);
             if (this.onready) { this.onready(); }
         },
         set_current: function(guid) {
             debugger; // this fn no longer used?
             this.active_guid = guid;
             var opts = { expires: 14, path: '/', domain: config.cookie_domain};
             jQuery.cookie('GUID', guid, opts); // sets the default session
         },
         set_current_client: function(guid_or_client) {
             if (guid_or_client === undefined && this.get_current_client()) {
                 // don't do anything if already have a valid client and no input
                 return;
             }
             // sets an active client
             if (guid_or_client && guid_or_client.__name__ == 'Client') {
                 this._current = guid_or_client;
                 return;
             } else {
                 var guid = guid_or_client;
             }
             var client = null;
             if (guid === undefined) {
                 client = this._clients[ jQuery.cookie('GUID') ];
                 if (! client && config.cookies && config.cookies.GUID) {
                     client = this._clients[config.cookies.GUID];
                     console.error('DANG! cookie was set on rapton-i-* domain -- trying using document.cookie instead. found',client);
                 }
                 if (! client) {
                     console.error('no GUID cookie set :-( -- picking the 0th client');
                     client = this._clients[ _.keys(this._clients)[0] ];
                 }
                 this._current = client;
             } else {
                 this._current = this._clients[guid];
             }
             if (this._current) {
                 console.log('set current client to', this._current.data);
             } else {
                 console.log('set current client failed -- no clients');
                 if (config.asserts && ! config.toolbar) { debugger; }
             }
             // set sessions cookie making this the default (or local storage?)
         },
         disable: function() { this._current = null; },
         get_paired_client: function() {
             if (this._clients[null] && this._clients[null].raptor.api.pairing) {
                 return this._clients[null];
             }
         },
       get_remote_client: function() {
         for (var guid in this._clients) {
           if (guid != 'null') { 
             return this._clients[guid];
           }
         }
       },
         get_current_client: function() { return this._current; },
         set_app: function(app) {
             this._app = app;
             _.each(this._clients, function(c) { 
                        c.view = app;
                    });
         },
         serialize: function(options) {
             var d = {};
             for (var guid in this._clients) {
                 var c = this._clients[guid];
                 var data = c.serialize(options);
                 _.extend(d, data);
             }
             return d;
         }
     };

    Client = function(guid, manager, data, opts) {
        // cid is somewhat legacy, but we need talon to send it because there is no api call to return the cid
        client = this;
        client.__name__ = 'Client';
        client.guid = guid;
        client.raptor_host = null;
        client.manager = manager;
        if (opts && opts.for_srp_only) {
            client.data = {};
        } else if (! data && manager && manager._clients[guid]) {
            // when toolbar tries to do remote login,  it uses the paired client's data! bleh
            client.data = manager._clients[guid].data;
        } else {
            client.data = data;
        }
        if (! client.data && config.webui) { client.data = {}; }
        
        if (window.RaptorRequestManager === undefined) {
            console.log('client.js: models.js not loaded. key negotiation only mode.');
            return; // models.js has not loaded!
        }

        if (! client.data) {
            console.log('data was not specified for client -- looking in local storage');
            var stored = client.manager._store.get('falconStore.sessionKeys');
            if (stored) {
                if (stored[guid]) {
                    data = stored[guid];
                }
            }
        }
        if (! client.data) {
            throw new Error('unable to fetch key for this client');
        }
        // TODO: cleanup instantiation
        if (config.webui) {
            var s = null;
        } else if (client.data.key) {
            var s = new srp(client.data.key);
        } else if (client.data.api) {
            var s = client.data.api.srp;
        } else {
            var s = new srp();
        }

        var api = client.data.api || new ClientAPI(s); // handles encryption and stuff (todo: more explicit instantiation)
        client.raptor = new RaptorRequestManager(client, api); // each client gets their own raptor instance
        client.setting = new ClientSettingManager(client);
        client.torrent = new TorrentManager(client);
        client.feed = new FeedManager(client);
        client.feedrule = new FeedRuleManager(client);
        client.label = new LabelManager(client);
        client.app = new AppManager(client);
        client.session = new SessionManager(client);
        client._update_listeners = [];
        client._update_fail_listeners = [];
        client._updating = false;
        client._update_timeout = null;
        client._outbound_update_request = null;
        client._stop_updating = null;
        client.everything_fetched = false;
    };

    Client.prototype = {

        go_to_gui_page: function() {
            var _this = this;
            if (this.connection_type() == 'remote') {
                this.raptor.api.get_raptor( function() {
                                                // error check?
                                                _this.go_to_gui_page_ready(_this.raptor.api.info.rapton);
                                                //clients.redirect(data.rapton + '/talon/gui');
                                            },
                                            null,
                                            { jsonp: true } /* need to use jsonp for this cuz
                                                             window.location is HTTP only and want
                                                             to send it over HTTPS plus the load balancer
                                                             does not allow this url nonssl
                                            */
                                          );
            } else {

                if (navigator.userAgent.match('MSIE')) {
                    var opts = { nossl: true };
                } else {
                    var opts = {};
                }

                this.go_to_gui_page_ready( config.logout_root, opts );
                //clients.redirect('http://' + config.logout_root + '/talon/gui');
            }
        },
        go_to_gui_page_ready: function(host, opts) {
            debugger;
            var sessions_data = this.manager.serialize( { cookie: true } );
            sessions_data['current'] = this.guid;
            // include bt_talon_tkt in url?
            window.name = jQuery.toJSON( this.manager.serialize( { window_name: true } ) );

            var prot = document.location.protocol;
            if (opts && opts.nossl) {
                prot = 'http:';
            }
            var newurl = host + '/talon/gui/?sessions=' + encodeURIComponent( jQuery.toJSON(sessions_data) );

            // this is rather crummy handling...
            if (newurl.slice(0,'https://'.length) == 'https://') {
                // cool! :-)
            } else {
                newurl = prot + '//' + newurl;
            }
            window.location = newurl;
        },
        get_name: function() {
            if (this.connection_type() == 'local') {
                return this.setting.get('webui.uconnect_username').value + ' <em>(local)</em>';
            } else {
                return '<strong>' + this.data.bt_user + '</strong> <em>(remote)</em>';
            }
        },
      ready: function() {
        // returns whether the client is good to go
        if (this.raptor.api.pairing) {
          return this.raptor.api.pairing.pairing_key;
        } else {
          // remote clients always ready
          return true;
        }
      },
      plus_features: function(key) {
        if (this.detailed_client_info) {
          if (this.detailed_client_info.error) {
            console.error('plus status error!', this.detailed_client_info);
          } else {
              if (key) {
                  return this.detailed_client_info.plus[key]; 
              } else {
                  return this.detailed_client_info.plus;
              }
          }
        } else {
          return null; // pending!
        }
      },
      add_update_listener: function( cb, opts ) {
        // call this function when new data has arrived from the
        // client
        this._update_listeners.push( cb );
      },
      add_update_fail_listener: function( cb, opts ) {
        // call this function when new data has arrived from the
        // client
        this._update_fail_listeners.push( cb );
      },
      call_update_listeners: function(keys) {
        for (var i=0; i<this._update_listeners.length; i++) {
          try {
            this._update_listeners[i]();
          } catch(e) {
            console.error('error in client update listener callback');
          }
        }
      },
      call_update_fail_listeners: function(xhr,status, data) {
          // if "data" is present, then xhr/status was actually successful but should be interpreted as an error... (403 stuff requires jsonp to do 200s)
        console.log('calling update fail listeners');
        for (var i=0; i<this._update_fail_listeners.length; i++) {
          try {
            this._update_fail_listeners[i](xhr,status, data);
          } catch(e) {
            console.error('error in client update listener fail callback');
          }
        }
      },
      get_torrents_that_can_fetch_files: function() {
        // this happens automagically when we get the coverart!
        var unfetched =  _.filter( this.torrent.keys(), function(hash) { 
          var torrent = client.torrent.get(hash);
          if (torrent.size != 0 && ! torrent.file.fetched) {
            return true;
          }
        } );
        return unfetched;
      },
        stop_updating: function(cb) {
            this._stop_updating = true;
            if (this._outbound_update_request) {
                console.error('stop updating called but already an outbound request (and we dont have direct access to the xhr object');
                this._stop_updating_callback = cb;
            } else {
                this._updating = false;
                this._stop_updating = false;
                if (cb) {
                    _.defer(cb);
                }
                if (this._update_timeout) {
                    console.log('stop updating -- cleared scheduled update');
                    clearTimeout( this._update_timeout);
                }
            }
        },
      start_updating: function(opts) {
          var _this = this;
          if (this._stop_updating) { console.error('cannot start updating because stop updating has not been processed completely'); return; }
        if ( this._updating ) { console.error('cannot start updating -- already updating!'); return; }

        this._updating = true;
        this._update_opts = opts || {};
        this._update_opts.delay = this._update_opts.interval || 2000;
        if (this._update_opts.fetch_files) {
          var hashes = this.get_torrents_that_can_fetch_files();
          if (hashes.length > 0) { debugger; }
        }
          if (this._update_opts['fetch_settings']) {
              this._outbound_update_request = true;
              // require settings to be fetched before any other updating happens
              this.setting.all(
                  function() {
                      _this._really_start_updating();
                  }
              );
              return true;
          } else {
              _this._really_start_updating();
          }
      },
        _really_start_updating: function() {
            var cid = this.torrent.cacheid;
            this._outbound_update_request = true;
            this.raptor.post( { list: 1, cid: cid }, {}, 
                              _.bind(this.do_update, this),
                              _.bind(this.do_update_failed, this)
                            );
            return true;

        },
        destroy: function() {
            // used to make sure references are cleaned up... (probably not necessary?)
            delete this.manager._clients[ this.guid ];
            this.raptor.api = null;
            this.raptor = null;
            this.torrent = null;
            this.feed = null;
            this.label = null;
            this.session = null;
            this.setting = null;
            this.data = null;
        },
        do_update_failed: function(xhr, status, data) {
            this._outbound_update_request = false;

            if (this._stop_updating_callback) {
                _.defer(this._stop_updating_callback);
                this._stop_updating_callback = null;
            }

            if (this._stop_updating) {
                this._stop_updating = false;
                this._updating = false;
                return;
            }

          if (true || xhr.status == 403) {
            //console.error('unrecoverable update!');
            this.call_update_fail_listeners(xhr, status, data);
          } else {
              // this was a hack for ifademo
            console.error('update failed! default retry logic is will just try again in same interval...',xhr,status, data);
            this.do_update();
          }
        },
      do_update: function() {
          this._outbound_update_request = false;

          if (this._update_opts['first_update']) {
              var cb = this._update_opts['first_update'];
              delete this._update_opts['first_update'];
              cb();
          }

          if (this._stop_updating_callback) {
              _.defer(this._stop_updating_callback);
              this._stop_updating_callback = null;
          }

          if (this._stop_updating) {
              this._stop_updating = false;
              this._updating = false;
              return;
          }
        if (! this._updating) { return; }
        var _this = this;
        var body_data = {};
        if (this._update_opts.fetch_files) {
          var hashes = this.get_torrents_that_can_fetch_files();
          if (hashes.length > 0) { 
            body_data.hash = hashes;
          }
        }

        this._update_timeout = setTimeout( function() {
          var url_data = { list: 1, cid: _this.torrent.cacheid };
          if (body_data.hash) { url_data.action = 'getfiles'; };
          _this.raptor.post( url_data, body_data, 
                             _.bind(_this.do_update, _this),
                             _.bind(_this.do_update_failed, _this)
                           );
        }, this._update_opts.delay);
      },
        negotiate_session_key: function(username, password, opts) {
            this.negotiate_srp = new srp();
            var callback = _.bind(this.negotiated_session_key, this, opts && opts.success);
            //var srp_opts = { callback: callback, domain: config.srp_root, jsonp: config.jsonp };
            var srp_opts = { callback: callback, domain: config.srp_root, jsonp: config.toolbar };
            if (opts && opts.error) { srp_opts.error = opts.error; }
            // if callback is passed in opts
            this.negotiate_srp.negotiate(opts && opts.stay_signed_in, username, password, srp_opts );
        },
        negotiated_session_key: function(extra_callback, key, srp_cookies) { 
            var s = new srp(key);
            var api = new ClientAPI(s);
            api.client = this;
            this.raptor.api = api;
            // get the guid
            if (srp_cookies) {

                var data = { key: key,
                             bt_talon_tkt: srp_cookies.bt_talon_tkt,
                             bt_user: srp_cookies.bt_user,
                             cid: srp_cookies.cid };
                this.guid = srp_cookies.GUID;
            } else {
                var data = { key: key,
                             bt_talon_tkt: jQuery.cookie('bt_talon_tkt'),
                             bt_user: jQuery.cookie('bt_user'),
                             cid: jQuery.cookie('cid')
                           };
                this.guid = jQuery.cookie('GUID');
            }
            client.type = 'remote';
            this.data = data;
            //this.raptor.api.pairing = null;
            clients.add(this);
            this.manager.set_current_client(this.guid);
            if (extra_callback) { console.log('finished negotiating session key and client initialized. calling extra callback'); extra_callback(this); }
        },
        connection_type: function() {
            if (this.type == 'remote' || this.guid || this.data && this.data.guid) {
                return 'remote';
            } else if (this.raptor && this.raptor.api.pairing) {
                return 'local';
            } else if (! this.raptor) {
                return 'direct';
            } else {
                debugger;
                return null;
            }
        },
        add_unknown: function( url, cb, fail_cb ) {
            if (raptor.version > 23217) {
                // theron added this neat functionality
                this.raptor.post( { action: 'add-unknown-url' }, { s: url }, cb, fail_cb );
            } else {

                // decide whether this is an rss feed or torrent...
                if (! url.match('\.rss$')) {
                var domain = parseUri(url).host;
                var saved_cookies = fjQuery.jStorage.get("cookies", {});
                _.each(saved_cookies, function(cookie_data, cookie_host)
                   {
                       if(domain.match(cookie_host+'$') == cookie_host)
                       {
                       url += ":COOKIE:" + cookie_data;
                       _.breakLoop();
                       }
                   });
                this.torrent.add(url, cb);
                }

                if (! url.match('\.torrent$') && ! url.match('^magnet:')) {
                    this.feed.add(url, cb);
                }


            }
        },

        get_everything: function( cb ) {
            var _this = this;

            if (this.everything_fetched) {
                cb();
                return;
            }

            // might be nice to have a minimal get everything, that
            // only gets everything that hasnt been fetched yet

            var options = { timeout: 30000 }; // need to increase the
            // timeout because this can take a loooong while :-)
            console.log('fetching all torrents');
            this.torrent.all( function() {
                var filehashes = _.filter( _this.torrent.keys(), function(hash) { return ! _this.torrent.get(hash).file.fetched; } );
                console.log('getting all (unfetched) files');
                _this.raptor.post( { action: 'getfiles' }, { hash: filehashes }, function( res ) {
                    console.log('getting all peers');
                    _this.raptor.post( { action: 'getpeers' }, { hash: _this.torrent.keys() }, function( res ) {
                        console.log('getting all settings');
                        _this.setting.all( function() {
                            _this.everything_fetched = true;
                            if (cb) {
                                cb();
                            }
                        } );
                    }, options );
                }, options );
            } );
        },
        
        get_all_files: function( cb ) {
            var options = { timeout: 30000 }; // long enough?
            var _this = this;
            this.torrent.all( function() {
                var filehashes = _.filter( _this.torrent.keys(), function(hash) { return ! _this.torrent.get(hash).file.fetched; } );
                console.log('getting all files');
                _this.raptor.post( { action: 'getfiles' }, { hash: _this.torrent.keys() }, function( res ) {
                    if (cb) {
                        cb();
                    }
                }, options );
            } );
        },

        get_all_peers: function( cb ) {
            var options = { timeout: 30000 }; // long enough?
            var _this = this;
            this.torrent.all( function() {
                var filehashes = _.filter( _this.torrent.keys(), function(hash) { return ! _this.torrent.get(hash).file.fetched; } );
                console.log('getting all peers');
                _this.raptor.post( { action: 'getpeers' }, { hash: _this.torrent.keys() }, function( res ) {
                    if (cb) {
                        cb();
                    }
                }, options );
            } );
        },

        log: function() {
            if (typeof console == "undefined" || typeof console.log == "undefined") {
                // dont log :-(
            } else {
                if (console.log.apply) { 
                    console.log.apply(console, arguments); 
                } else {
                    console.log(arguments[0], arguments[1], arguments[2], arguments[3]); // IE does not support console.log.apply
                }
            }
            
        },
        client_qs: function() {
            var str = "GUID=" + encodeURIComponent(this.guid) + '&bt_talon_tkt=' + encodeURIComponent(this.data.bt_talon_tkt);
            if (this.raptor_host) {
                if (window.location.protocol + '//' + window.location.host != this.raptor_host && config.raptor_redirect !== false) {
                    // only append the rrendezvous if client is on a different raptor from the current host
                    str = str + '&_rrendezvouz=' + encodeURIComponent(this.raptor_host);
                }
                if (this.raptor.api.cipher.ivoffset && this.raptor.api.jsonp) {
                    str = str + '&x_bt_seq=' + this.raptor.api.cipher.ivoffset;
                }
            }
            return str;
        },
        info: function() {
            var info = { GUID: this.guid };
            _.extend(info, this.data);
            return jQuery.toJSON(info);
        },
        remove_from_stored_sessions: function() {
            var stored_sessions = this.manager._store.get('falconStore.sessionKeys') || {};
            if (stored_sessions[this.guid]) {
                delete stored_sessions[this.guid];
                this.manager._store.set('falconStore.sessionKeys', stored_sessions);
            }
            var cookie_sessions = jQuery.parseJSON(jQuery.cookie('sessions') || '{}') ;
            if (cookie_sessions[this.guid]) {
                delete cookie_sessions[this.guid];
            }

            this.manager.save_sessions_cookie(cookie_sessions);
        },
        set_on_error: function(fn) {
            this._on_error = fn;
        },
        client_sent_error: function(xhr, status, msg) {
          if (msg == 'no client jsonp support') {
            console.error('your client version has no jsonp support');
          }
            if (config.asserts) { debugger; }
            this.remove_from_stored_sessions();
            this.cleanup();
            if (this._on_error) { 
                this._on_error(xhr, status, msg);
            } else if (window.utweb)  {
                utweb.redirect_logout('Client sent error: '+ xhr.status);
            }
        },
        client_sent_unauthorized: function() {
            // client gave us a 401...
            console.log('client sent 401 -- removing from stored sessions');
            this.remove_from_stored_sessions();
            this.cleanup();
        },
        token_decryption_failed: function() {
            console.log('token decryption failed -- :-( -- remove from stored sessions');
            // decrypting the token failed for this client... so delete it from stored sessions
            this.remove_from_stored_sessions();
            this.cleanup();
        },
        serialize: function(options) {
            /*
             serialize data relevant for resuming a session { cid, bt_user, bt_talon_tkt, guid, key }
             3 cases: 
             1) serializing to window.name (for passing encryption keys cross domain)
             2) serializing to local storage
             3) serializing to session cookie (include everything except encryption key)
             */
            var d = {};
            if (this.connection_type() == 'remote' ) {
                if (options.window_name || options.local_pairing) {
                    // dont bother storing other information in local
                    // storage since it will be available through the
                    // sessions cookie
                    var data = this.data.key;
                } else {
                    var data = {
                        u: this.data.bt_user,
                        c: this.data.cid,
                        t: this.data.bt_talon_tkt
                    };
                }
                if (options.all) {
                    data.k = this.data.key;
                }
                d[this.guid] = data;
            } else if (this.connection_type() == 'local') {
                // locally paired clients dont have any of this information

                // unsafe
                if (this.raptor.api.pairing.foundport) {
                    // only store if this paired client actually found a pairing port
                    d[this.raptor.api.pairing.pairing_key] = { pairing_port: this.raptor.api.pairing.foundport };
                }
            } else if (this.connection_type() == 'direct' ){
                debugger;
            } else {
                debugger;
            }
            return d;

        },
        cleanup: function() {
            // removes all the stored torrent/file/feed state for this client to free up memory
            // TODO
        }
    };

})(exports._);
