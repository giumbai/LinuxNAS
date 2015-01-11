window.raptor = {};

if (! window.exports) {
    window.exports = {};
}
if (! window.config) {
    window.config = {};
}
if (! Array.prototype.invert) {
    Array.prototype.invert = function() {
        var obj = {};
        for (var i = 0, il = this.length; i < il; ++i) {
	    obj[this[i]] = i;
        }
        return obj;
    };
}

function decode_location_params() {
    var hash = window.location.href.slice( window.location.href.indexOf('?')+1, window.location.href.length );
    if (hash.indexOf('#') != -1) {
        hash = hash.slice(0, hash.indexOf('#'));
    }
    var parts = hash.split('&');
    var d = {};
    for (var i=0; i<parts.length; i++) {
        var kv = parts[i].split('=');
        d[kv[0]] = decodeURIComponent(kv[1]);
    }
    return d;
}
var window_urlparams = decode_location_params();

function getfiles_enabled() {
    if (window.utweb && utweb.current_client() && utweb.current_client().plus_features('proxy_files')) {
        return true;
    }
    return config.local_discovery || config.debug || config.webui || config.experimental || config.dev_mode;
}