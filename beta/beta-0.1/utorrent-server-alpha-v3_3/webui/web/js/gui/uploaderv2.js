function setupUploader() {
    if (!window.btu) window.btu = new BTUploader({
        "swf_id": "btuploader",
        "target": "/"
//        "debug": "true",
    });
};

function BTUploader(opts) {

    var self = this;
    var swf = null;
    var url = null;
    var file_data = null;

    self.init = function(opts) {
        if (!("target" in opts)) throw "Target URL not defined.";
        if (!("swf_id" in opts)) throw "Flash destination not defined.";
        self.swf = document.getElementById(opts["swf_id"]);
        self.url = opts["target"];
        self.file_data = {};

        opts["xferData"] = "window.btu.getData";
        //opts["onSelectHandler"] = "window.btu.populateInput";
        self.swf.initUploader(opts);
    };

    self.populateInput = function(name) {
        var el = document.getElementById("file_upload");
        el.textContent = name;
    };

    self.getData = function() {
        var data = self.swf.getData();
        data.data = data.data.replace(/\+/g, "%2B"); // because AS3 will not escape pluses

        if (window.gadget) {
            console.log('gadget ondata',self);
            window.gadget.ondata(data);
            console.log('gadget ondata returned');
/*
            console.log('getdata',data);

            // defer this because otherwise flash will hang
            //toolbar.give_torrent_upload_data(data);
            console.log('gadget',gadget);
            gadget.handle_torrent_data(data);
            console.log('handled torrent data');
*/
        } else {
            utweb.current_client().torrent.addfile(data.data);
        }
    }

    self.init(opts);

};
