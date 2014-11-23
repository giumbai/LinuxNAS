/*

uploading a torrent file to the client

ff > 3.6, chrome > 6 support reading local file contents into
javascript, for IE, etc, we need to use flash

opera started supporting html5 File api too

 */

function WrappedFileReader() {
    this._native = this.html5_supported();
    if (! this._native) {
        // initialize the flash component
        
    }
        
}

WrappedFileReader.prototype = {
    html5_supported: function() {
        if (! config.experimental) { return false; }
        return (window.File && window.FileReader && window.FileList && window.Blob);
    },
    register: function(file, callback) {
        var reader = new FileReader();
        //var result = reader.readAsDataURL(file);
        var result = reader.readAsBinaryString(file);
        reader.onload = function(f) {
            var result = f.target.result;
            // TODO: make sure result read out ok and everything
            callback(result);
        };
    }
};