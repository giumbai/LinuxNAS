/* kyle's rewrite of the connect module */

(function(underscore) {

// Eventerizer adds bind/trigger event functionality to any class! yay!
var Eventerizer = window.Eventerizer = {
    eventify: function(c) {
        c.prototype.bind = function(eventName, func) {
            if(!this.event_bindings)
                this.event_bindings = {}
            if(!this.event_bindings[eventName])
                this.event_bindings[eventName] = []
            this.event_bindings[eventName].push(func)
        }
        c.prototype.trigger = function(eventName) {
            if(!this.event_bindings) return;
            if(!this.event_bindings[eventName]) return;

            for(var i = 0; i < this.event_bindings[eventName].length; i++) {
                this.event_bindings[eventName][i].apply(this, Array.prototype.slice.call(arguments, 1))
            }
        }
        c.prototype.unbind = function(eventName, func) {
            if(!this.event_bindings) return;
            if(!this.event_bindings[eventName]) return;

            if(!func) {
                delete this.event_bindings[eventName]
                return
            }

            for(var i = this.event_bindings[eventName].length - 1; i >= 0; i-- ) {
                if(this.event_bindings[eventName][i] == func)
                    this.event_bindings[eventName].splice(i, 1)
            }
        }
    }
}


    var _ = underscore;

if (window.jQuery) {
    window.fjQuery = jQuery.noConflict();
  if (window.config.ipad_ui) {
    window.$ = jQuery;
  }
}

if (! String.prototype.trim) {
    String.prototype.trim = function() {
        return jQuery.trim(this);
    };
}

if (! JSON) {
    var JSON = { stringify: function(arg) { return jQuery.toJSON(arg); },
                 parse: function(arg) { return jQuery.parseJSON(arg); } };
}


if (! window.console) {
    window.console = {};
}
if (! window.console.log) {
    window.console.log = function() {};
}

function parse_cookies() {
    if (! String.prototype.trim) {
        var rtrim = /^(\s|\u00A0)+|(\s|\u00A0)+$/g;
        String.prototype.trim = function() {
            return this.replace( rtrim, "" );
        };
    }
    if (document.cookie) {
        var cookies = {};
        var kvs = document.cookie.split(';');
        for (var i=0; i < kvs.length; i++) {
            var kv = kvs[i];
            var idx = kv.indexOf('=');
            if (idx != -1) {
                cookies[ kv.slice(0, idx).trim() ] = kv.slice(idx+1, kv.length).trim();
            }
        }
    } else {
        var cookies = {};
    }
    return cookies;
}

function ClientAPI( optional_srp ) {
    var _this = this;

    //var decrypt_mgr = DecryptionManager.create();
    _this.pairing = null;
    _this.token = null;
    if (config.webui || optional_srp == null) {
        _this.cipher = { 
            decrypt: function(data,options) { return data; },
            decrypt_async: function(data, callback, options) { return callback(data); },
            encrypt: function(data) { return data; },
            is_null_cipher: true
        }; // webui, pairing have trivial cipher
    } else if (window.srp) {
        _this.cipher = optional_srp || new srp(); // need to give it the key
    } else {
        console.log('unrecognized initialization');
        debugger;
    }
    _this.boundary = 'AaB03x';


    this.jsonp = config.jsonp;
    this.url_base = (config.jsonp | config.toolbar) ? config.srp_root : '';
/*
    if (window.location.protocol + '//' + window.location.host != config.srp_root) {
        this.jsonp = true;
        this.url_base = config.srp_root;
    } else {
        this.url_base = '';
        this.jsonp = false;
    }
*/
}
window.ClientAPI=ClientAPI;
ClientAPI.prototype = {
    is_remote: function() {
        return ! this.cipher.is_null_cipher;
    },
    processResponse: function(origdata, status, xhr, options) {
        var _this = this;
        var bt_seq = xhr.getResponseHeader('x-bt-seq');
        if (origdata.encbody && origdata.GUID && origdata['x-bt-seq']) {
            _this.cipher.ivoffset = parseInt(origdata['x-bt-seq']);
            origdata = origdata.encbody;
        } else {
            _this.cipher.ivoffset = parseInt(bt_seq ? bt_seq : "0");
        }
        //var s = (new Date()).getTime();
        var opts = options;
        var response = _this.cipher.decrypt(origdata, opts);
        //console.log('Decryption took ' + ( (new Date()).getTime() - s )/1000 + ' seconds.');
        return response;
    },

    unrecoverable_error: function(message) {
        this.client.remove_from_stored_sessions();
        if (config.utweb) {
            console.error(message);
            if (config.asserts) { debugger; }
            utweb.redirect_logout(message);
        } else {
            throw Error(message);
        }
    },

    processResponseAsync: function(origdata, status, xhr, callback, options) {
        var _this = this;
        var bt_seq = xhr.getResponseHeader('x-bt-seq');
        if (origdata.encbody && origdata.GUID && origdata['x-bt-seq']) {
            _this.cipher.ivoffset = parseInt(origdata['x-bt-seq']);
            origdata = origdata.encbody;
        } else {
            _this.cipher.ivoffset = parseInt(bt_seq ? bt_seq : "0");
        }
        //var s = (new Date()).getTime();
        _this.cipher.decrypt_async(origdata, function(data) {
            //console.log('Async decryption took ' + ( (new Date()).getTime() - s )/1000 + ' seconds.');
            callback(origdata, data);
        }, options);
    },

    check_username: function(username, cb) {
        var ajax_opts = {
            url: (this.url_base?this.url_base:'')+"/api/exists?username=" + encodeURIComponent(username),
            dataType: this.jsonp ? 'jsonp' : 'json',
            success: function(data, status, xhr) {
                cb(data);
            },
            error: function(xhr, status) {
                debugger;
                console.error('error fetching username status');
                cb({});
            }
        };
        console.log('checking username', ajax_opts);
        fjQuery.ajax(ajax_opts);
    },

  get_info: function(cb) {
    var _this = this;
	var ajax_opts = {
            url: (this.url_base?this.url_base:'')+"/talon/getinfo?bt_talon_tkt=" + encodeURIComponent(this.client.data.bt_talon_tkt),
            dataType: this.jsonp ? 'jsonp' : 'json',
          success: function(data, status, xhr) {
              if (!data) { debugger; }
              if (data && data.not_found) {
                  console.log('client not currently attached! -- try again in a bit? ??');
              }

            _this.client.detailed_client_info = data;


            if (data && data.plus && data.plus.proxy_files) { 
              console.log('PLUS file transfer ENABLED! :-)', data);
                if (window.utweb) {
                    utweb.notify_plus_active();
                }
            } else {
              console.log('PLUS file transfer not enabled :-(', data);
            }

            cb();
          },
          error: function(xhr, status) {
            console.error('error fetching get_info (for determining plus status etc)');
            _this.client.detailed_client_info = { error: status, response_code: xhr.status, xhr: xhr };
            cb();
          }
	  };
	  console.log('fetching plus/client info', ajax_opts);
	  fjQuery.ajax(ajax_opts);
  },

  get_raptor: function(cb, failure_callback, opts) {
        var _this = this;
        if (! this.client.data.bt_talon_tkt) { console.error('client not initialized correctly'); debugger; }
      var baseurl = (this.url_base?this.url_base:'');
      if (opts && opts.jsonp && ! baseurl) {
          baseurl = 'https://' + config.logout_root;
      }
      var extra = (config.ssl !== undefined && ! config.ssl) ? '&nossl=1' : '';
      var use_jsonp = this.jsonp || (opts && opts.jsonp);
        var ajax_opts = {
            url: baseurl+"/talon/getrapton?bt_talon_tkt=" + encodeURIComponent(this.client.data.bt_talon_tkt) + extra,
            dataType: (use_jsonp) ? 'jsonp' : 'json',
            cache: false,
          success: function(data, status, xhr) {
              if (data.error) {
                  if (failure_callback) { return failure_callback( { xhr: xhr, status: status, data: data } ); }
                  return _this.unrecoverable_error(data.error);
              }

                _this.raptor = data.rapton;
                _this.info = data;
                console.log('got rapton response', data, 'current location', window.location.href);
                if (config.toolbar || config.in_app || _this.jsonp || config.jsonp || config.ipad_ui || use_jsonp) { // ipad ui is like debug mode for now
                    console.log('bypass rapton switch -- in an app url or jsonp');
                    _this.client.raptor_host = data.rapton;
                    cb();
                } else if (window.location.protocol + '//' + window.location.host == data.rapton || config.raptor_redirect === false) {
                    _this.client.raptor_host = data.rapton;
                    console.log('client is on same raptor! nice');
                    cb();
                } else {
                    if (config.raptor_rendezvouz) {
                        _this.client.raptor_host = data.rapton;
                        console.warn('client on different raptor -- will proxy');
                        cb();
                    } else {
                        console.warn('client is on different raptor... will need to redirect :-( frowney face');
                        if (config.asserts) { debugger; }
                        clients.redirect(data.rapton + '/talon/gui');
                    }
                }

            },
            error: function(xhr, status) { 
              if (failure_callback) { failure_callback(xhr, status); }
                // JSONP doesnt get to the 403 unfortunately so had to re-work this api.
                if (xhr.status == 403) {
                    _this.unrecoverable_error('bt_talon_tkt corresponded to user with no database entry');
                } else if (xhr.readyState != 0) {
                    _this.unrecoverable_error('error asking for raptor');
                }

            }
        };
        fjQuery.ajax(ajax_opts);
    },

    get_token: function(cb, failure_callback) {
        if (this.pairing) { return cb(); } // pairing does not need token
        var _this = this;
        if (config.webui) { return _this.webui_get_token(cb, failure_callback); }

        if (! (config.webui || _this.pairing) && ! _this.client.raptor_host) {
            // switching between sessions, need to make sure we are requesting token/list data from the right raptor (the one we are currently on)
            console.log('get token deferred until fetching raptor');
            var thislater = _.bind(this.get_token, this, cb, failure_callback);
            return _this.get_raptor(thislater);
        }

      if (config.utweb && ! _this.client.detailed_client_info) {
            var thislater = _.bind(this.get_token, this, cb, failure_callback);
            return _this.get_info(thislater);
      }

        var failed = false;

        //if (! _.all( _.map(['bt_talon_tkt', 'GUID'], function(k) { return _.contains( _.keys(cookies), k ); } ) )) {
        var private_key = clients.get_current_client().data.key;
        //var private_key = fjQuery.jStorage.get('falconStore.sessionKey');
        if (! private_key || private_key.length != 32 + 8) {
            failed = true;
            var failure_msg = 'You must re log in (invalid private key). Private key: "' + private_key + '"';
        }

        if (failed) {
            if (failure_callback) {
                return failure_callback( { err: Error(failure_msg) } );
            } else {
                this.unrecoverable_error(failure_msg);
            }
        }

        var token = null;
        var xbtseq = _this.cipher.ivoffset;
        var token_url = ((this.jsonp||config.toolbar)?this.client.raptor_host:'')+"/client/gui/token.html?" + this.client.client_qs();
        var ajax_opts = {
            url: token_url,
            processData: false,
            dataType: this.jsonp ? 'jsonp' : 'text',
            beforeSend: function(xhr) {
                xhr.setRequestHeader("x-bt-seq", xbtseq);
            },
            success: function(rawdata, status, xhr) {
                var data = _this.processResponse(rawdata, status, xhr, { encoding: 'ascii' } );
                var token = null;
                if (_this.jsonp) {
                    token = data;
                } else {
                    var matches = data.match(/\'\>(.*)\<\/d/);
                    if (matches && matches.length == 2) {
                        token = matches[1];
                    }
                }
                if (token && token.length == 64) {
                    console.log('Received token',token);
                } else {
                    if (config.asserts) { debugger; }
                    console.error('Could not parse token');
                    if (rawdata.length == 0) {
                        // retry?... raptor is just being retarded!
                        // maybe exponential backoff?
                        err_data = {xhr: xhr, status: status, message: "Raptor returned OK but decryption resulted in empty data.", decrypted_data: data };
                    } else {
                        err_data = {xhr: xhr, status: status, message: "Got a garbled looking token.", decrypted_data: data};
                        // mark this as an invalid GUID/enc key pair... or reinitialize the srp state
                        return _this.client.token_decryption_failed();
                        if (config.asserts) { debugger; }
                    }
                    if (failure_callback) {
                        return failure_callback( err_data );
                    } else {
                        if (config.asserts) { debugger; }
                        throw Error( err_data );
                    }
                }
                    
                _this.token = token;
                if (cb)
					cb();
            },
            error: function(xhr, status) { 
              if (_this.jsonp && xhr.statusText == 'parsererror') {
                var msg = 'no client jsonp support';
              } else {
                var msg  = 'XHR status > 400 (your client probably bounced)';
              }
                console.error(msg);
                if (xhr.status == 401) {
                    console.error('client reports this GUID is no longer valid');
                }
                if (config.asserts) { debugger; }
                if (failure_callback) {
                    if (xhr.status == 401) {
                        _this.client.remove_from_stored_sessions();
                    }
                    return failure_callback( { err: Error(msg), xhr: xhr, status: status } );
                } else {
                    return _this.client.client_sent_error( xhr, status, msg );
                    if (config.utweb) {
                        if (config.asserts) { debugger; }
                        var extra_param = (config.build!='purpleization'?'&utorrent=1':'');
                        window.location = '/talon/logout?message=' + encodeURIComponent(msg) + extra_param;
                    } else {
                        throw Error( msg );
                    }
                }
            }
        };
        console.log('Request token', token_url);
        fjQuery.ajax(ajax_opts);
    },

    

    make_request_url: function(params) {
        var parts = [];

        _.each(params, function(val,key) {
          if (val !== undefined) {
            if (_.isArray(val)) {
                _.each(val, function(item) {
                    parts.push( key + '=' + encodeURIComponent(item) );
                });
            } else {
                parts.push( key + '=' + encodeURIComponent(val) );
            }
          }
        });
        return parts.join('&');
        
    },

    make_post_body: function(params) {
        var _this = this;
        if (config.webui) { return params; }

        function make_part(v,k) {
            return 'Content-Disposition: multipart/form-data; name="' + k + '"\r\n\r\n' + v + '\r\n';
        }

        var body = '--' + _this.boundary + '\r\n';
        
        var bodyparts = [];

        _.each(params, function(val,key) {
            // support multidict... (torrent hashes...)
            if (_.isArray(val)) {
                _.each(val, function(item) {
                    bodyparts.push( make_part(item, key) );
                });
            } else {
                bodyparts.push( make_part(val, key) );
            }
        });

        body += bodyparts.join('--' + _this.boundary + "\r\n");
        body += '--' + _this.boundary + '\r\n\r\n\r\n';
        return body;
    },

    request: function(method, base_url, url_params, body_data, callback, failure_callback, options) {
        var _this = this;
         if (! (config.webui || this.pairing) && ! _this.client.raptor_host) {
            console.log('request deferred until raptor fetched');
            // switching between sessions, need to make sure we are requesting token/list data from the right raptor (the one we are currently on)
            var thislater = _.bind(this.request, this, method, base_url, url_params, body_data, callback, failure_callback, options);
            return _this.get_raptor(thislater, failure_callback); // kind of weird to pass in failure callback here...
        }

        var log_this = ((config.verbose > 2 && url_params.list == null) || config.verbose > 3);

        if (log_this) {
            if (_.keys(body_data).length > 0) {
                console.log('Request', url_params, body_data);
            } else {
                console.log('Request', url_params);
            }
        }


        // pairing does not need token
        if (this.pairing) { return _this.pairing_get(url_params, body_data, callback, failure_callback, options); }

        if (! _this.token) { 
            // also get current raptor (getrapton)
            var thislater = _.bind(this.request, this, method, base_url, url_params, body_data, callback, failure_callback, options);
            return _this.get_token(thislater);
            //throw Error('Must call get_token first'); 
        }


        if (config.webui) { return _this.webui_get(url_params, body_data, callback, failure_callback, options); }

        if (_.isString(url_params)) {
            var url = base_url + "?" + url_params + '&' + _this.client.client_qs();
        } else {
            var url = base_url + "?" + _this.make_request_url(url_params) + '&' + _this.client.client_qs();
        }
        if (this.jsonp) { url = this.client.raptor_host + url; }

        var data = _.extend({
            token: _this.token,
            t: (new Date()).getTime()
        }, body_data);

        var post_body = _this.make_post_body( data );
        var xbtseq = _this.cipher.ivoffset; // GRAB this before encrypting!!!
        var encrypted_body = _this.cipher.encrypt( post_body );
        
        if (options && options.timeout) {
            var timeout = options.timeout;
        } else {
            var timeout = 40000;
        }

        if (this.jsonp) { 
            method = 'GET'; 
            url = url + '&encbody=' + encrypted_body;
            encrypted_body = null;
        }

        var async = true;
        if (options && ! options['async']) {
            async = false;
        }

        var ajax_options = {
            url: url,
            type: method,
            data: encrypted_body,
            timeout: timeout,
            async: async,
            dataType: this.jsonp ? 'jsonp' : 'text',
            processData: false,
            contentType: 'application/octet-stream; boundary=' + _this.boundary + '; charset=ascii',
            beforeSend: function(xhr) {
                //xhr.setRequestHeader('Cookie', 'GUID=' + cookies['GUID'] + '; bt_talon_tkt=' + cookies['bt_talon_tkt']); // want to only send the required cookies to save bandwidth
                // unfortunately this doesn't work...
                xhr.setRequestHeader("x-bt-seq", xbtseq);
            },
            success: function(data, status, xhr) {
                // jquery is mistakenly firing success even if the
                // server is completely dead
                if (data == 'invalid request') { 
                    if (failure_callback) {
                        var err_data = { msg: 'Client thought request was invalid (no explicit reason returned)', xhr: xhr, data: data, status: status };
                        console.error(err_data.msg);
                        return failure_callback( err_data );
                    } else {
                        debugger;
                    }
                }
                function on_decrypted_data(orig_data, decrypted_data) {
                    if (decrypted_data) {
                        if (callback) {
                            try { 
                                // client sends invalid utf-8 inside
                                // strings, which can cause quotes on
                                // the ends of string literals to be
                                // interpreted as parts of multi-byte
                                // character sequences (breaking
                                // JSON).

                                // thus, TODO:
                                // if this fails, fall back to ASCII
                                var json = JSON.parse(decrypted_data);
                            } catch (e) {
                                // fallback to ASCII
                                console.error('utf-8 decoding failed -- falling back to ascii');
                                if (config.asserts) { debugger; }
                                function asciidecrypted(inp, outp) {
                                    if (callback) {
                                        try {
                                            json = JSON.parse(outp);
                                        } catch (e) {
                                            console.error('fallback ascii json parse failed too');
                                            if (config.asserts) { debugger; }
                                            return failure_callback( { message: 'JSON parse error', error: e, status: status, xhr: xhr } );
                                        }
                                        callback(json, status, xhr);
                                    }
                                }
                                return _this.processResponseAsync(orig_data, status, xhr, asciidecrypted, { encoding: 'ascii' });

                                /*
                                var err_data = { message: 'JSON parse error', error: e, decrypted_data: decrypted_data, status: status, xhr: xhr };
                                var felog_data = {
                                    "feid": "webui.error",
                                    "msg": "JSON Parse Error",
                                    "badjson": 'not sending data for now because of security concerns',
                                    "iserr": "1"
                                };
                                fjQuery.get("/api/felog", felog_data);

                                return failure_callback( err_data );
                                */
                            }
                            if (log_this) {
                                console.log('Response', json);
                            }
                            //console.log("Response:", _.keys(json));
                            if (callback) {
                                callback(json, status, xhr);
                            }
                        } else {
                            console.log('no callback specified for',this, decrypted_data.slice(0,200) + '...');
                            if (config.asserts) { debugger; }
                        }
                    } else {
                        err_data = { msg: 'No data was decrypted (cipher returned nothing)', xhr: xhr, data: data, status: status };
                        console.log(err_data.msg);
                        if (failure_callback) {
                            return failure_callback( err_data );
                        } else {
                            throw Error(err_data);
                        }
                    }
                }
                /*
                function compare_nonasync_callback(decrypted_data) {
                    decrypted_data_nonasync = processResponse(data, status, xhr);
                    on_decrypted_data(decrypted_data);
                }
                */
                if (true) { // async
                  if (data) { 
                    _this.processResponseAsync(data, status, xhr, on_decrypted_data);
                  } else {
                    on_decrypted_data( data, data );
                  }
                    //processResponseAsync(data, status, xhr, compare_nonasync_callback);
                } else {
                    decrypted_data = _this.processResponse(data, status, xhr);
                    on_decrypted_data( data, decrypted_data );
                }

            },
            error: function(xhr, status) { 
                console.error('XHR error',xhr,status);
                if (status == 'timeout') {
                    // dont try to JSON.stringify xhr, youll get an error
                    var err_data = { xhr: xhr, status: status, msg: 'Request timed out' };
                } else if (xhr.status == 0) {
                    // server is dead
                    var err_data = { xhr: xhr, status: status, msg: 'Raptor host/port is refusing connections. Did raptor segfault?' };
                } else {
                    var err_data = { msg: 'Raptor is alive but wont proxy your request', xhr: xhr, status: status };
                }

                if (failure_callback) {
                    return failure_callback( err_data );
                } else {
                    console.log( err_data.msg );
                    console.error('the following error is uncaught... that is (probably) a problem.');
                    if (config.asserts) { debugger; }
                    throw Error( err_data );
                }

            }
        };
        return fjQuery.ajax(ajax_options);
    },

  create_pairing_url: function(action) {
    return this.pairing.local_url + '/gui/?action=' + action + '&' + this.pairing.create_qs(this.pairing.pairing_key);
  },

    pairing_get: function(url_params, body_params, callback, failure_callback, options) {
        var _this = this;
        var params_list = [];

        if (_.isString(url_params)) {
            params_list.push( url_params );
            url_params = {};
        }         
            
        if (url_params.list) {
            log_this = false;
            params_list.push( 'list=' + url_params.list );
            delete url_params.list;
        }
        if (url_params.action) {
            params_list.push( 'action=' + url_params.action );
            delete url_params.action;
        }

        _.extend(url_params, body_params); // broken for multi file hashes ?

        _.each(url_params, function(val, key) {
            if (_.isArray(val)) {
                _.each(val, function(v) {
                    params_list.push( key + '=' + encodeURIComponent(v) );
                });
            } else {
                params_list.push( key + '=' + encodeURIComponent(val) );
            }
        });
        if (! _this.pairing.local_url) { console.error('pairing was not initialized yet'); debugger; }
        var url = _this.pairing.local_url + '/gui/?' + params_list.join('&') + '&' + _this.pairing.create_qs(_this.pairing.pairing_key);
        //console.log('pairing get',url);
        function error(xhr,status,status2) {
            console.error('pairing request failure');
            if (failure_callback) {
              var err_data = { error: '400 bad request maybe', info: 'jsonp fail', extra_info: 'jsonp does not give very many error codes', xhr: xhr, status: status };
              return failure_callback(err_data);
            }
        }
        function success(json, status, xhr) {
          if (json == 'invalid request') {
            console.error('pairing key invalid for client', _this.client);
            if (config.asserts) { debugger; }
            _this.client.remove_from_stored_sessions();
            if (failure_callback) {
              var err_data = { error: 'not authorized' };
              return failure_callback(err_data);
            }
            return error(status, xhr);
          } else if (_.isString(json)) {
                if (failure_callback) {
                    var err_data = { error: 'invalid json' };
                    return failure_callback(err_data);
                }
                return error(status, xhr);
            }
            if (config.verbose > 2) {
                console.log("Pairing Response:", json);
            }

            return callback(json);
        }
        var ajax_options = {
            url: url,
            timeout: 10000, // 10 seconds seems like enough...
            type: 'get',
            dataType: 'jsonp',
            success: _.bind(success, this),
            error: error
        };
        if (config.verbose > 2) {
          console.log("Pairing Request:", url);
        }

        return fjQuery.ajax(ajax_options);

    },
    webui_get: function(url_params, body_params, callback, failure_callback, options) {
        // need to manually construct the url because list/action has
        // to come first, (jQuery does not seem to support sending
        // multihash array parameters
        var _this = this;

        //var thislater = _.bind(this.webui_get, this, url_params, body_params, callback, failure_callback, options);
        //return _this.get_token(thislater);

        // nasty race condition

        if (! _this.token) { 
            if (Browser.opera) { return; }
            throw Error('Must call get_token first'); 
        }

        var log_this = true;

        var base_url = '/gui/?';

        var params_list = [];

        if (_.isString(url_params)) {
            params_list.push( url_params );
            url_params = {};
        }         
            
        if (url_params.list) {
            log_this = false;
            params_list.push( 'list=' + url_params.list );
            delete url_params.list;
        }
        if (url_params.action) {
            params_list.push( 'action=' + url_params.action );
            delete url_params.action;
        }

        _.extend(url_params, body_params);
        _.each(url_params, function(val, key) {
            if (_.isArray(val)) {
                _.each(val, function(v) {
                    if(v !== undefined)
                        params_list.push( key + '=' + encodeURIComponent(v) );
                });
            } else {
                if(val !== undefined)
	                params_list.push( key + '=' + encodeURIComponent(val) );
            }
        });

        var url = base_url + 'token=' + _this.token + '&' + params_list.join('&');
        var async = true;
        if (options && ! options['async']) {
            async = false;
        }

        var ajax_options = {
            url: url,
            timeout: 10000, // 10 seconds seems like enough...
            type: 'get',
            async: async,
            success: function(data, status, xhr) {
                try {
                    var json = JSON.parse(data);
                } catch (e) {
                    // not valid JSON -- invalid request?
                    var err_data = { msg: 'JSON parse error', error: e, data: data, status: status, xhr: xhr };
                    if (failure_callback) { 
                        failure_callback(err_data);
                    } else {
                        throw err_data;
                    }
                }
                if (callback) {
                    if (log_this || config.verbose > 1 || true) {
                        if (window.console && console.log)
                            console.log("WebUI Response:", json);
                    }
                    callback(json, status, xhr);
                }
            },
            error: function(xhr, status) {
                if (status == 'timeout') {
                    var err_data = { xhr: xhr, status: status, msg: 'Request timed out' };
                    if (window.console && console.error)
                      console.error(err_data.msg);
                } else if (xhr.status == 400 && xhr.responseText.match("invalid request")) {
                    var err_data = { xhr: xhr, status: status, msg: 'Invalid token (30 minute expiry met)', code:'webui.invalid_token' };
                } else {
                    var err_data = { xhr: xhr, status: status, msg: 'Other error' };
                    if (window.console && console.error)
                      console.error(err_data.msg);
                }

                if (failure_callback) {
                    return failure_callback( err_data );
                } else {
                    if (window.console && console.error)
                      console.error(err_data.msg);
                    throw Error( err_data );
                }

            }
        };

        if (log_this || config.verbose > 1 || true) {
            if (window.console && console.log)
              console.log("WebUI Request:", url);
        }
        return fjQuery.ajax(ajax_options);
    },
    webui_get_token: function(callback, failure_callback) {
		console.log('webui: get token');
        var cookies = parse_cookies();
        if ( ! cookies['GUID'] ) {
            failed = true;
            var failure_msg = "you're missing some cookies!!! this will FAIL";
            if (config.asserts) { debugger; }
        }

        var _this = this;
        // why would this fail?

        var ajax_opts = {
            url: "/gui/token.html",
            type: 'get',
            success: function(data, status, xhr) {
                var matches = data.match(/\'\>(.*)\<\/d/);
                if (matches && matches.length == 2) {
                    var token = matches[1];
                    _this.token = token;
                    console.log('Received token',token);
                    callback();
                    _this.trigger('got_token')
                }
            }
        };
        console.log('Request token');
        return fjQuery.ajax(ajax_opts);
    },

    post: function(url_params, body_data, callback, failure_callback, options) {
        return this.request('post', '/client/gui/', url_params, body_data, callback, failure_callback, options);
    }

}

Eventerizer.eventify(ClientAPI)

})(exports._);
