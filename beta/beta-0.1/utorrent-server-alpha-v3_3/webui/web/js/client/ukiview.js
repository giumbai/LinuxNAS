function uki_main(underscore) {
var _ = underscore;
var perSec = '/s';

var ut_colors = { grey: [157,160,163],
                  orange: [255,153,0],
                  red: [255,0,0],
                  white: [255,255,255],
                  gray: [222,222,222],
                  blue: [132,194,255],
                  purple: [102,51,153],
                  ltgreen: [171,214,121],
                  green: [134,196,63],
                  ltgrey: [235, 235, 235]
                  };

var global_font_size = '12px';
var table_line_height = '18px';
var table_row_height = 18;

function darker(color, amount) {
    return _.map(color, function(v) { return Math.floor(amount * v); } );
}
function rgb(vals) {
    return 'rgb(' + _.map(vals, function(v) { return Math.min(v,255); }).join(',') + ')';
}

function pad(str, n, padwith) {
    var padding = '';
    for (var i = 0; i < (n - str.length); i++) {
        padding += padwith;
    }
    return padding + str;
}
function rgb_hex(arr) {
    var i = arr[2] + (256 * arr[1]) + (65536 * arr[0]);
    var str = i.toString(16);
    return '#' + pad(str, 6, '0');

    //return '#' + arr[0].toString(16) + arr[1].toString(16) + arr[2].toString(16)
}

    var tstatus_icons = { filename: config.static_prefix + '/images/' + ((config.build=='purpleization') ? 'bt_' : '') + 'tstatus2px.png',
                      items: 'downloading seeding downloading_grey paused downloading_error uploading_error error completed download_queued upload_queued active torrents inactive feed feed_2 feed_3 feed_error feed_favorite feed_added bittorrent play play_grey play_2 share open label apps poof0 poof1 poof2 poof3 poof4 poof5 poof6 poof7 find shift_to_pc'.split(' '),
                      padding: 2,
                      size: 16 };

// the torrent uploader is sourcing this file without the static
// prefix :-(
    var toolbar_icons = { filename: config.static_prefix + '/images/' + ((config.build=='purpleization') ? 'bt_' : '') + 'toolbar2px.png',
                      items: 'torrent_add torrent_add_url torrent_create remove start pause stop up down find feed_add preferences webprefs interface_minify interface_normal shield share'.split(' '),
                      padding: 2,
                      size: 24 };

	var tab_icons = { filename: config.static_prefix + '/images/' + ((config.build=='purpleization') ? 'bt_' : '') + 'tabs2px.png',
	                  items: 'general trackers peers parts files speed logger'.split(' '),
	                  size: 16,
					  margin: (config.build == 'embedded' || config.product == 'embedded') ? 0 : 0,
	                  padding: (config.build == 'embedded' || config.product == 'embedded') ? 2 : 2 };

function get_icon_background_style(def, name) {
    var idx = _.indexOf(def.items, name);
    if (idx != -1) {
        var xoffset = _.indexOf(def.items, name) *  - def.size;
        return 'background: transparent url(' +def.filename+') no-repeat '+xoffset+'px 0px';
    }
}

function make_icon(def, name, offset) {
    var idx = _.indexOf(def.items, name);
    if (idx != -1) {
        //var offset = idx * (size + tab_icons.padding*2) + (tab_icons.padding*2);

        var xoffset = -1 * _.indexOf(def.items, name) * ((def.margin ? def.margin:0) + def.size + def.padding * 2) - def.padding;
        return '<div style="position: absolute; padding: 0; margin: '+(offset?offset:'0')+'; width:' + def.size +'px;height:'+ def.size +'px;background: transparent url('+def.filename+') no-repeat '+xoffset+'px 0px">&nbsp;</div>';
    } else {
        return 'icon not found';
    }
}

function make_status_icon(name, offset) {
    return make_icon(tstatus_icons, name, offset);
}

function icon_and_text(iconname, text, title, dont_include_icon) {
    if (title) { var title_str = ' title="'+title+'" '; } else { var title_str = ''; }
    if (!dont_include_icon) { var icon_str = make_status_icon(iconname); } else { var icon_str = ''; }
    
    return icon_str + '<span ' + title_str + ' style="margin-left:20px;">' + text + '</span>';
}

function app_icon_and_text(path, text, title) {
    if (title) { var title_str = ' title="'+title+'" '; } else { var title_str = ''; }
    var img = '<div style="position: absolute; padding: 0; margin: 0; width:16px;height:16px;background: transparent url('+path+') no-repeat">&nbsp;</div>';
    return img + '<span '+title_str+' style="margin-left:20px;">' + text + '</span>';
}

function make_toolbar_icon(name) {
    return make_icon(toolbar_icons, name);
}

var Formatters = new function() {
    var self = this;
    
    function bit_repr(num, max_bits) {
        if (max_bits === undefined) { max_bits = 8; }
        var bits = [];
        for (var i = max_bits - 1; i >= 0; i--) {
            bits.push( (num >> i) & 1 );
        }
        return bits;
    }

    var torrent_complete_template = new uki.theme.Template('\
  <div title="${title}" style="padding: 0px; margin: 1px; width:${total_width}px; height:15px; position: relative; line-height: 11px;">\
    <div style="position: absolute; background:${color};width: ${leftportion}px; height: 100%; z-index: 0; overflow: hidden;">\
      <div style="position: absolute; color: ${color_occluded}; margin-left: ${left_margin}px; z-index: 2; text-align:right">${str}</div>\
    </div>\
    <div style="border-top: 1px solid ${top_border_color}; border-radius: 2px; position: absolute; background: ${background_color}; width: ${rightportion}px; margin-left: ${leftportion}px; overflow: hidden; height: 100%; z-index: 3">\
      <div style="position: absolute; margin-left: ${neg_margin}px; color: ${darker_color}; z-index:4; text-align: right">${str}</div>\
    </div>\
  </div>');

    var colors = {
        ltgreen: ut_colors.ltgreen, 
        green: ut_colors.green, 
        blue: ut_colors.blue, 
        grey: ut_colors.grey, 
        red: ut_colors.red, 
        white: ut_colors.white,
        gray: ut_colors.gray 
    };
    if (window.config.build == 'embedded' || window.config.product == 'embedded')
        colors.blue = ut_colors.purple;
    colors.finished = colors.downloading;

    this.percent_complete = function(data, str, color, rect, title, files_only, border_color) {
        
        var padding = 5;
        var width = rect.width - padding * 2;

        var rgbcolor = colors[color];
        if (rgbcolor === undefined) { rgbcolor = [255,0,0]; }
        var complete = (data == 1000);
        var font_w = 6;

        /*
        if (complete) {
            if (color == 'seeding') {
                var str = 'Seeding'
            } else if (color == 'error') {
                var str = 'Error';
            } else {
                var str = 'Finished';
            }

        } else {
            var str = data > 0 ? data/10 + '%' : '0.0%';
        }
        */
        var str_w = str.length * font_w;

        var left_margin = width/2 - str_w/2;

        var neg_margin = - data/1000 * width + left_margin;

        if (files_only)
            files_only = data == 1000;
        if (!border_color)
            border_color = rgb(rgbcolor);

        return torrent_complete_template.render( { total_width: width,
                                                   title: title ? title : str,
                                                   border_color: border_color,
                                                   color: files_only ? "#FFFFFF" : rgb(rgbcolor),
                                                   background_color: rgb(ut_colors.ltgrey),
                                                   top_border_color: files_only ? "#FFFFFF" : rgb(darker(ut_colors.ltgrey, .8)),
                                                   darker_color: files_only ? "#FFFFFF" : rgb(darker(ut_colors.ltgrey, .4)),
                                                   color_occluded: files_only ? 'gray' : 'white',
                                                   leftportion: Math.floor(data/1000 * width),
                                                   rightportion: width - Math.floor(data/1000 * width),
                                                   str: str,
                                                   neg_margin: neg_margin,
                                                   left_margin: left_margin} );
    };

    if (jQuery.browser.msie && parseInt(jQuery.browser.version) == 6) {
        this.percent_complete = function(data, str, color, rect, title) {
            var padding = 5;
            var width = rect.width - padding * 2;
            var leftportion = Math.floor(data/1000 * width);
            var template =  new uki.theme.Template('<div style="width:${width}; border-right: 1px solid grey; border-bottom: 1px solid grey"><div style="width:${leftportion}; background: ${color}; position: absolute; left: 0px"></div></div>');
            return template.render( { width: width, leftportion: leftportion, color: rgb(colors[color]) } );
        };
    }



    this.priority = function(data) {
        return [locale("FI_PRI0"), locale("FI_PRI1"), locale("FI_PRI2"), locale("FI_PRI3")][data];
    };
    this.country = function(peer) { return '<div style="position: relative; width:30px; height: 16px;" class="country_' + peer.country + '"></div>'; };

    function torrent_status_icon(torrent, filledwith) { 
        // TODO: fix these
        var complete = torrent.progress == 1000;
        if (torrent.status_array == undefined) { debugger; }
        if (_.contains(torrent.status_array, 'paused')) {
            var icon = 'paused';
        } else if (_.contains(torrent.status_array, 'started')) {
            if (complete) {
                var icon = 'seeding';
            } else {
                var icon = 'downloading';
            }
        } else {
            if (complete && !_.contains(torrent.status_array, 'queued')) {
                var icon = 'completed';
            } else {
                var icon = 'upload_queued';
            }
        }
        return icon_and_text(icon, filledwith, false, true);

    };


    this.to_file_size = function(size) {
        var precision = 1;
        var sz = [locale("SIZE_B"), locale("SIZE_KB"), locale("SIZE_MB"), locale("SIZE_GB"), locale("SIZE_TB"), locale("SIZE_PB"), locale("SIZE_EB")];
        var szmax = sz.length-1;

        // Force units to be at least kB
        var unit = 1;
        size /= 1024;

        while ((size >= 1024) && (unit < szmax)) {
            size /= 1024;
            unit++;
        }
        return (size.toFixed(precision || 1) + " " + sz[unit]);
    };
    this.to_rate = function(data) {
        return self.to_file_size(data) + '/s';
    };
    this.to_time_string = function(data, empty_infinity) {
        if (data == -1) { return "\u221E"; }
        var secs = Number(data);
        if (secs > 63072000) {
            if (empty_infinity) { 
                return ''; 
            } else {
                return "\u221E"; // secs > 2 years ~= inf. :)
            }
        }
        var div, y, w, d, h, m, s, output = "";
        y = Math.floor(secs / 31536000);
        div = secs % 31536000;
        w = Math.floor(div / 604800);
        div = div % 604800;
        d = Math.floor(div / 86400);
        div = div % 86400;
        h = Math.floor(div / 3600);
        div = div % 3600;
        m = Math.floor(div / 60);
        s = div % 60;
        if (y > 0) {
            output = LANG_STR["TIME_YEARS_WEEKS"].replace(/%d/, y).replace(/%d/, w);
        } else if (w > 0) {
            output = LANG_STR["TIME_WEEKS_DAYS"].replace(/%d/, w).replace(/%d/, d);
        } else if (d > 0) {
            output = LANG_STR["TIME_DAYS_HOURS"].replace(/%d/, d).replace(/%d/, h);
        } else if (h > 0) {
            output = LANG_STR["TIME_HOURS_MINS"].replace(/%d/, h).replace(/%d/, m);
        } else if (m > 0) {
            output = LANG_STR["TIME_MINS_SECS"].replace(/%d/, m).replace(/%d/, s);
        } else {
            output = LANG_STR["TIME_SECS"].replace(/%d/, s);
        }
        return output;
    };

    Number.prototype.round = function(precision){
    precision = Math.pow(10, precision || 0);
    return Math.round(this * precision) / precision;
    };
    String.prototype.pad = function(len, str, type) {
        var inp = this;
        str = str || " ";
        type = type || "right";
        len -= inp.length;
        if (len < 0) return inp;
        str = (new Array(Math.ceil(len / str.length) + 1)).join(str).substr(0, len);
        return ((type == "left") ? (str + inp) : (inp + str));
    };


    function roundTo(input, precision) {
        var num = "" + input.round(precision);
        var offset = num.indexOf(".");
        if (offset == -1) {
            offset = num.length;
            num += ".";
        }
        return num.pad(precision + ++offset, "0");
    }

    this.per1000 = function(i) { return roundTo(i/10, 1); };

    
    this.print_peers = function(torrent) {
    //return _.sprintf("%d of %d", torrent.peers_connected, torrent.peers_swarm);
        if (torrent.peers_connected == 0 && torrent.peers_swarm == 0) { return ''; }
        return torrent.peers_connected + ' of ' + torrent.peers_swarm;
    };
    this.print_seeds = function(torrent) {
    //return _.sprintf("%d of %d", torrent.seed_connected, torrent.seed_swarm);
        if (torrent.seed_connected == 0 && torrent.seed_swarm == 0) { return ''; }
        return torrent.seed_connected + ' of ' + torrent.seed_swarm;
    };
    
    this.status_info = function(torrent) {
        var state = torrent.status;
        var done = torrent.progress;
        if (torrent.message != torrent.status) {
            return torrent.message;
        }

        var res = ["", ""];
        if (state & CONST.STATE_STARTED) { // started
            if (state & CONST.STATE_PAUSED) { // paused
                return locale("OV_FL_PAUSED");
            } else { // seeding or leeching
                return locale((done == 1000) ? "OV_FL_SEEDING" : "OV_FL_DOWNLOADING");
            }
        } else if (state & CONST.STATE_CHECKING) { // checking
            return locale("OV_FL_CHECKED");
        } else if (state & CONST.STATE_ERROR) { // error
            return locale("OV_FL_ERROR");
        } else if (state & CONST.STATE_QUEUED) { // queued
            return locale("OV_FL_QUEUED");
        }
        
        if(done == 1000) {
            return locale("OV_FL_FINISHED");
        } else {
            return locale("OV_FL_STOPPED");
        }
    };

    this.name_with_icon = function(torrent, rect, i, gen_pane) {
        return gen_pane ? torrent.name : torrent_status_icon(torrent, torrent.name);
    };

    this.hostname = function(peer) {
        var hostname = peer.hostname;
        var ip = peer.ip;
        var protocol = peer.protocol;
        var protstr = protocol ? ' [uTP]' : '';
        var port = peer.port;
        if (hostname.length > 1) { return hostname + ':' + port + protstr; } else { return ip + ':' + port + protstr; }
    };

    this.requests_display = function(peer) {
        if (peer.pending || peer.requests) { return peer.pending + ' | ' + peer.requests; } else { return ''; }
    };


    this.simple = {
        torrent: function(response_name) {
            return function(torrent) {
                return torrent[response_name];
            };
        },
        peer: function(response_name) {
            return function(peer) {
                return peer[response_name];
            };
        },
        file: function(response_name) {
            return function(file) {
                return file[response_name];
            };
        },
        feeditem: function(response_name) {
            return function(feeditem) {
                return feeditem[response_name];
            };
        }
    };

    this.standard = {
        torrent: function(response_name, formatter) {
            return function(torrent) {
                return formatter( torrent[response_name] );
            };
        },
        peer: function(response_name, formatter) {
            return function(peer) {
                return formatter( peer[response_name] );
            };
        },
        file: function(response_name, formatter) {
            return function(file) {
                return formatter( file[response_name] );
            };
        },
        feeditem: function(response_name, formatter) {
            return function(feeditem) {
                return formatter( feeditem[response_name] );
            };
        }
    };


};

var display_columns = new function() {

    var dims = {'IP': 300,
        'default': 65,
        'percent': 50,
        'rate': 80,
        'size': 80,
        'port': 60,
        'time': 80
           };


    Number.prototype.roundTo = function(precision) {
            var num = "" + this.round(precision);
            var offset = num.indexOf(".");
            if (offset == -1) {
                offset = num.length;
                num += ".";
            }
            return num.pad(precision + ++offset, "0");
        };

    this.torrent = [
        { name: 'queue_position', localized: 'OV_COL_ORDER', type: 'int', formatter: Formatters.standard.torrent('queue_position', function(v) { if (v != -1) { return v; } else { return ''; } }), width: 20, hidden: true },
        { name: 'name', formatter: Formatters.name_with_icon,
          localized: 'OV_COL_NAME', width: 350, sortby: function(torrent) { return torrent.name.toLowerCase(); } },

        { name: 'size', localized: 'OV_COL_SIZE', type: 'int', formatter: Formatters.standard.torrent('size', Formatters.to_file_size), width: 70 },
        { name: 'progress', localized: 'OV_COL_DONE', type: 'int', formatter: function(t, rect, i, gen_pane) {
            if (gen_pane) { 
                return Formatters.per1000(t.progress) + locale('PRS_COL_PCNT');
            } else {
                return Formatters.percent_complete(t.progress, t.get_progress_text(), t.get_progress_color(), rect );
            }
        } , width: 110 },
        { name: 'down_speed', localized: 'OV_COL_DOWNSPD', type: 'int', formatter: function(torrent) { var value = torrent.down_speed; return (value > 0) ? Formatters.to_rate(value) : ''; }, width: 74},
        { name: 'up_speed', localized: 'OV_COL_UPSPD', type: 'int', formatter: function(torrent) { var value = torrent.up_speed; return (value > 0) ? Formatters.to_rate(value) : ''; }, width: 74 },
        { name: 'eta', localized: 'OV_COL_ETA', type: 'int', formatter: function(torrent) { if (torrent.eta > 0) { return Formatters.to_time_string(torrent.eta); } }, width: 50 },
        { name: 'seeds', localized: 'OV_COL_SEEDS', type: 'int', formatter: Formatters.print_seeds, width: 60, sortby: function(torrent) { return torrent.seed_connected + torrent.seed_swarm; } },
        { name: 'peers', localized: 'OV_COL_PEERS', type: 'int', formatter: Formatters.print_peers, width: 60, sortby: function(torrent) { return torrent.peers_connected + torrent.peers_swarm; } },
        { name: 'downloaded', localized: 'OV_COL_DOWNLOADED', type: 'int', formatter: Formatters.standard.torrent('downloaded',Formatters.to_file_size), width: 70 },
        { name: 'uploaded', localized: 'OV_COL_UPPED', type: 'int', formatter: Formatters.standard.torrent('uploaded', Formatters.to_file_size), width: 70 },
        { name: 'ratio', localized: 'OV_COL_SHARED', type: 'int', formatter: Formatters.standard.torrent('ratio', function(v) { return (v/1000).roundTo(2); } ), width: 40 },
        // { name: 'status', localized: 'OV_COL_STATUS', formatter: Formatters.status_info, width: 80, hidden: true },
        { name: 'availability', localized: 'OV_COL_AVAIL', localized_filter: function(s) { return s.split('||')[2]; }, type: 'int', formatter: Formatters.standard.torrent('availability', function(v) { if (v > 0) { return (v/65536).roundTo(1); } else { return ''; } } ), width: 60, hidden: true },
        { name: 'remaining', localized: 'OV_COL_REMAINING', type: 'int', formatter: function(torrent) { if (torrent.remaining > 0) { return Formatters.to_file_size(torrent.remaining); } else { return ''; } }, width: 60, hidden: true },
        { name: 'download_url', hidden: true, formatter: 
      function(t) {
          return t.download_url ? '<a target="_new" href="'+t.download_url+'">'+t.download_url+'</a>' : '';
      },
          localized: 'FEED_COL_URL'
    },
        { name: 'rss_feed_url', hidden: true, localized: 'DLG_ADDEDITRSSFEED_04', formatter:
      function(t) {
          return t.rss_feed_url ? '<a target="_new" href="'+t.rss_feed_url+'">'+t.rss_feed_url+'</a>' : '';
      }          
        },
        // { name: 'message', hidden: true,
        //   localized: 'OV_COL_STATUS'
        // },
        { name: 'label', localized: 'OV_COL_LABEL', hidden: true},
        { name: 'Added', formatter: function(item) { 
            return Formatters.to_time_string( Math.floor(new Date()/1000 - item.added_on), true );
        },
          localized: 'OV_COL_DATE_ADDED',
          sortby: function(item) { return item.added_on; }
        },
        { name: 'completed_on', formatter: function(item) { 
            return Formatters.to_time_string( Math.floor(new Date()/1000 - item.completed_on), true );
        }, 
          localized: 'OV_CAT_COMPL',
          sortby: function(item) { return item.completed_on; }
        },
        { name: 'Source', 
          formatter: function(t) { 
              var app = t.get_app();
              if (app && config.enable_apps) {
                  return app.get_icon_html();
              }
          }, 
          sortby: function(t) {
              return t.app_update_url;
          },
          localized: 'App',
          width: 30,
          hidden: (window.config.build == "embedded")
        },
        { name: 'hash', hidden: true, localized: 'GN_TP_10', formatter: 
          function(t) {
              return '<a target="_new" href="' + t.magnet_link() + '">' + t.hash + '</a>';
          } 
        }
//        {name: 'stream_id' }


    ];

    this.peer = [
        { name: 'country', width: 22, localized: 'country', 
            hidden: (window.config.build == "embedded"),
            formatter: Formatters.country },
        { name: 'Host',
          formatter: Formatters.hostname, 
          width: 220,
          localized: 'PRS_COL_IP'
        },
        { name: 'port', width: 50, localized: 'PRS_COL_PORT', hidden: true },
        { name: 'client', width: 100, 
          formatter: function(peer) { 
              return peer.client;
              if (peer.client.charCodeAt(0) == 194) { 
                  return '<span style="color:green">' + peer.client.slice(1, peer.client.length) + '</span>';
              } else if (peer.client.match('BitTorrent')) {
                  return '<span style="color:green">' + peer.client + '</span>';
              } else { return peer.client; } 
          },
          localized: 'PRS_COL_CLIENT'
        },
        { name: 'flags', localized: 'PRS_COL_FLAGS' },
        { name: 'complete', localized: 'PRS_COL_PCNT', formatter: function(peer,rect) { return Formatters.per1000(peer.complete) + '%'; }, width: 110,
          sortby: function(peer) { return peer.complete; }
        },
        { name: 'relevance', localized: 'PRS_COL_RELEVANCE', formatter: Formatters.standard.peer('relevance', Formatters.per1000 ), width: 85, hidden: (window.config.build == "embedded") },
        { name: 'down_speed', localized: 'PRS_COL_DOWNSPEED', formatter: function(peer) { return (peer.down_speed == 0) ? '' : Formatters.to_rate(peer.down_speed); } },
        { name: 'up_speed', localized: 'PRS_COL_UPSPEED', formatter: function(peer) { return (peer.up_speed == 0) ? '' : Formatters.to_rate(peer.up_speed); }  },
        { name: 'requests', localized: 'PRS_COL_REQS', formatter: Formatters.requests_display, hidden: (window.config.build == "embedded") },
        { name: 'waited', localized: 'PRS_COL_WAITED', formatter: function(peer) { return Formatters.to_time_string(new Date()/1000 - peer.waited);  }, hidden: true }, // seems to be broken
        { name: 'uploaded', localized: 'PRS_COL_UPLOADED', formatter: function(peer) { if (peer.uploaded > 0) { return Formatters.to_file_size(peer.uploaded); } } },
        { name: 'downloaded', localized: 'PRS_COL_DOWNLOADED', formatter: function(peer) { if (peer.downloaded > 0) { return Formatters.to_file_size(peer.downloaded); } } },
        { name: 'hasherr', localized: 'PRS_COL_HASHERR', formatter: Formatters.standard.peer('hasherr', function(i) { if (i == 0) { return ''; } else { return i; } }), hidden: true },
        { name: 'peer_download_rate', localized: 'PRS_COL_PEERDL', formatter: function(peer) { if (peer.peer_download_rate > 0) { return Formatters.to_rate(peer.peer_download_rate); } }, width: 110, hidden: true },
        { name: 'maxdown', localized: 'PRS_COL_MAXDOWN', formatter: function(peer) { return (peer.maxdown == 0) ? '' : Formatters.to_rate(peer.maxdown); }, width: 110, hidden: true  },
        { name: 'maxup', localized: 'PRS_COL_MAXUP', formatter: function(peer) { return (peer.maxup == 0) ? '' : Formatters.to_rate(peer.maxup); }, width: 110, hidden: true  },
        { name: 'queued', localized: 'PRS_COL_QUEUED', formatter: Formatters.standard.peer('queued', Formatters.to_file_size), width: 110, hidden: true  },
        { name: 'inactive', localized: 'PRS_COL_INACTIVE', formatter: Formatters.standard.peer('inactive', Formatters.to_time_string), width: 80, hidden: true  }
    ];
    this.file = [
        { name: 'name',
          localized: 'FI_COL_NAME',
          formatter: function(file) {
              //return '<a href="'+file.get_link()+'" target="_new">'+file.name+'</a>';
              return file.name;
          },
          width: 350
        },
        { name: 'Type',
          localized: 'type',
          formatter: function(f) { return f.extension; } },
        { name: 'size', type: 'int', width: 60,
          formatter: Formatters.standard.file('size', Formatters.to_file_size),
          localized: 'FI_COL_SIZE'
        },
        { name: 'progress',
          localized: 'FI_COL_PCNT', width: 110,
          formatter: function(file, rect) { return Formatters.percent_complete(file.progress, file.get_progress_text(), file.get_progress_color(), rect, null, true, "#DEDEDE"); },
          sortby: function(file) { return file.progress; }
        },
        { name: 'priority',
          localized: 'FI_COL_PRIO',
          formatter: function(file) { if (! file.isCompleted()) { return Formatters.priority(file.priority); } else { return ''; } }
        },
        { name: 'first_piece', hidden: true, localized: 'FI_COL_FIRSTPC' },
        { name: 'num_pieces', localized: 'FI_COL_NUMPCS', hidden: true },

        { name: 'Bitrate', localized: 'bitrate',
      formatter: function(file) { if (file.encoded_rate > 0) { return Formatters.to_rate(file.encoded_rate); } }, hidden: true },
        { name: 'Length', localized: 'length',
      formatter: function(file) { if (file.duration > 0) { return Formatters.to_time_string(file.duration); } }, hidden: true },

        { name: 'Resolution', localized: 'resolution',
      formatter: function(file) { if (file.width > 0 && file.height > 0) { return file.width + 'x' + file.height; } }, hidden: true },
        { name: 'Streamable', localized: 'streamable',
      formatter: function(file) { if (file.stream_eta != -1) { return Formatters.to_time_string(file.stream_eta); } }, hidden: true },
//        { name: 'streamability', formatter: function(file) { if (file.streamability != -1) { return file.streamability; } }, hidden: true },

        { name: 'Get File', 
          localized: 'Open file',
          header_align: 'center',
          formatter: function(file) {
              var str = '';
/*
              if (file.streamable) {
                  str += make_status_icon('play');
              }
              */
/*
              if (file.progress == 1000) {
                  str += make_status_icon('downloading');
              }
              */

              //str += '<a href="'+file.get_link()+'">link</a>';
              //str += '<a href="'+file.get_link('inline')+'" target="_blank">'+make_status_icon('downloading')+'</a>';

              if (jQuery.browser.msie && false) {
                  str += '<a href="#" onclick="var iframe = document.createElement(\'iframe\'); iframe.src = \''+file.get_link('attachment')+'\'; console.log(\''+file.get_link('attachment')+'\'); iframe.setAttribute(\'style\',\'display:none\'); document.body.appendChild(iframe); ">'+make_status_icon('downloading')+'</a>';
              } else {

                  if (file.isCompleted() && file.playable() && ! config.cookies.disable_player && ! wants_mobile_ui()) {
                    if (config.cookies.html5video) {
                      // str += '<a title="Play" href="'+file.get_link('inline', 'STREAMING')+'" target="_blank">'+make_status_icon('play')+'</a>';
                    } else {
                      if (getfiles_enabled()) {
                        if (file.html5_playable() || config.local_discovery || config.debug) {
                          if (config.build_variant && config.build_variant == 'demo') {
                              str += '<a title="Send open command" href="#" onclick="utweb.remote_open(\''+file.manager.torrent.hash + '\','+ file.id +')">'+make_status_icon('play')+'</a> ';
                          } else if (! (config.webui || config.build == 'embedded')) {
                              str += '<a title="Open with Media player" href="#" onclick="utweb.media_open(\''+file.manager.torrent.hash + '\','+ file.id +')">'+make_status_icon('play')+'</a> ';
                          } else {
                             // this is NAS dont append thegreen button
                          }
                        }
                      }
                    }
                  }
                  if (file.isCompleted()) {
                    if (getfiles_enabled()) {
                      str += '<a onclick="eventTracker.track(\'WebUI\', \'OpenFile\')" title="Open file" style="position: absolute; left: 40px"  href="'+file.get_link('inline','DOWNLOAD')+'" target="_blank">'+make_status_icon('open')+'</a>';
                      if (window.config.build != "embedded")
                          str += '<a onclick="eventTracker.track(\'WebUI\', \'GetFile\')" title="Download to your computer" style="position: absolute; left: 20px"  href="'+file.get_link('attachment','DOWNLOAD')+'" target="_blank">'+make_status_icon('shift_to_pc')+'</a>';
                    }
                  }
                  if (file.playable() && config.dev_mode) {
                      str += '<a onclick="utweb.transcode(\''+file.manager.torrent.hash+'\',\''+file.id+'\');" title="Transcode" style="position: absolute; left: 60px" href="#_">'+make_status_icon('poof0')+'</a>';
                  }
              }

              return str;
          }
        }

    ];

    this.feeditem = [
        { name: 'Name', width: 350,
          localized: 'FEED_COL_NAME',
          formatter: function(feeditem) { 
              if (feeditem.__name__ == 'Torrent') {
                  var torrent = feeditem;
              } else {
                  var torrent = feeditem.get_torrent();
              }

              if (torrent) {
                  return Formatters.name_with_icon(torrent);
              } else {
                  var icon = 'feed';
                  if (feeditem.in_history) {
                      icon = 'feed_added';
                  }
                  return icon_and_text(icon, feeditem.name_full || feeditem.name);
              }

          },
          sortby: function(feeditem) { return feeditem.name.toLowerCase(); }
        },
        { name: 'complete', hidden:true, width: 110, localized: 'OV_COL_STATUS',
          formatter: function(feeditem, rect) { 
              if (feeditem.__name__ == 'Torrent') {
                  var torrent = feeditem;
              } else {
                  var torrent = feeditem.get_torrent();
              }
              
              if (torrent) {
                  return Formatters.percent_complete(torrent.progress, torrent.get_progress_text(), torrent.get_progress_color(), rect);
              } else {
                  return 'RSS';
              }
          }
        },
        { name: 'url', localized: 'URL', formatter: function(item) { 
            if (item.__name__ == 'Torrent') {
                var url = item.download_url;
            } else {
                var url = item.url;
            }
            return '<a target="_new" href="'+url+'">'+url+'</a>'; }, width: 250, localized: 'FEED_COL_URL'
        },
        { name: 'quality', hidden:true, localized: 'Quality', width: 40, localized: 'DLG_RSSDOWNLOADER_10',
      formatter: function(feeditem) {
          return APISpecification.feed_quality[feeditem.quality] || feeditem.quality;
      }
    },
        { name: 'codec', hidden:true, localized: 'Codec', width: 40, localized: 'FEED_COL_CODEC',
      formatter: function(feeditem) {
          return APISpecification.feed_encoding[feeditem.codec] || feeditem.codec;
      }
    },
        { name: 'timestamp', localized: 'Added On', width: 60, localized: 'OV_COL_DATE_ADDED',
          formatter: function(item) { 
              if (item.__name__ == 'Torrent') {
                  var timestamp = item.added_on;
              } else {
                  var timestamp = item.timestamp;
              }
              
              return Formatters.to_time_string( Math.floor(new Date()/1000 - timestamp), true );
          },
          sortby: function(item) { 
              if (item.__name__ == 'Torrent') {
                  return item.added_on;
              } else {
                  return item.timestamp; 
              }
          } },
        { name: 'season', localized: 'Season', width: 50, hidden:true },
        { name: 'episodes', hidden:true, formatter: function(item) { 
            if (item.episode != undefined) { return item.episode + (item.episode_to ? '- ' + item.episode_to : ''); } else { return ''; }}, width: 50, localized: 'FEED_COL_EPISODE' }
    ];

};

var display_column_lookup = {};
_.each(['torrent','feeditem','file','peer'], function(table_name) {
    display_column_lookup[table_name] = {};
    _.each(display_columns[table_name], function(col, i) {
        display_column_lookup[table_name][col.name] = i;
    });
});


category_data = [
//    { data: icon_and_text('find', 'Find Content') },
    { category: 'Torrents', 
		data: icon_and_text('torrents', /* 'Torrents', */ 'Torrents'), status: 'All', icon:'torrents', localized:'Torrents',
      	children: [
	        { data: icon_and_text('downloading', 'OV_CAT_DL'), status: 'Downloading', icon:'downloading', localized:'OV_CAT_DL'},
	        { data: icon_and_text('seeding', 'Seeding'), status: 'Seeding', icon:'seeding', localized:'OV_FL_SEEDING'},
	        { data: icon_and_text('completed','OV_CAT_COMPL'), status: 'Completed', icon:'completed', localized:'OV_CAT_COMPL' },
	        { data: icon_and_text('active','OV_CAT_ACTIVE'), status: 'Active', icon:'active', localized:'OV_CAT_ACTIVE' },
	        { data: icon_and_text('inactive','OV_CAT_INACTIVE'), status: 'Inactive', icon:'inactive', localized:'OV_CAT_INACTIVE' },
	        { category: 'Labels', data: icon_and_text('label','Labels'), status: 'All', children: [], icon:'label', localized:'ML_LABEL' }
    	]
	},
    { category: 'Feeds', data: icon_and_text('feed','Feeds'), children: [], icon:'feed', localized:'Feeds' }
];

if (config.enable_apps) {
    category_data.push(
        { category: 'Apps', data: icon_and_text('apps','Apps'), icon:'apps', localized: 'Apps',
          children: [
        ] }
    );

}


var custom_widths = { name: 250, hostname: 100, progress: 110, complete: 110 };




function RC(x,y,w,h) {
    for (i=0;i<arguments.length;i++) {
        if (isNaN(arguments[i]) || arguments[i] == null) {
            throw Error('invalid rect arguments');
        }
    }
    return [x,y,w,h].join(' ');
}




var window_h = jQuery(window).height();
var window_w = jQuery(window).width();

var toolbar_buttons = [
//                      items: 'torrent_add torrent_add_url torrent_create remove start pause stop up down find feed_add preferences share interface_minify interface_normal shield'.split(' '),
                          add_file_button(),
                          toolbar_button('torrent_add_url'),
                          toolbar_button('feed_add'),
                          toolbar_button('remove'),
                          toolbar_button('start'),
                          toolbar_button('pause'),
                          toolbar_button('stop'),
                          toolbar_button('up'),
                          toolbar_button('down'),
                          toolbar_button('preferences')
];

//This list of actions is also listed in utweb.js under more_action_items
var more_actions_options = [
	{value: 'ml_force_recheck', data: locale('ML_FORCE_RECHECK')},
	{value: 'ml_force_start', data: locale('ML_FORCE_START')},
	{value: 'ml_properties', data: locale('ML_PROPERTIES')},
	{value: '', data: locale('ML_LABEL'), children: [
    	{value: 'ov_new_label', data: locale('OV_NEW_LABEL')}
    ]}
];

if (! config.webui) {
    toolbar_buttons.push( toolbar_button('share') );
}

var dims = { 
    window_w: window_w,
    window_h: window_h,
    menubar: 85,
    toolbar: 40,
    add_url_stuff: 26,
    more_actions_width: 100,
    more_actions_spacer: 50, 
    toolbar_width: 33 * toolbar_buttons.length,
    sidebar: 150,
    button_w: 60,
    button_h: 20,
    statusbar: 30,
    tabs: 31,
    header_height: 85,
    loading_height: 40,
    loading_width: 200,
    divider: 7
};

dims.torrent_pane_height = Math.floor(dims.window_h/2) - dims.menubar - dims.toolbar;
dims.main_pane_width = window_w - dims.sidebar - dims.divider;
dims.detail_pane_height = dims.window_h - dims.menubar - dims.toolbar - dims.tabs - dims.divider - dims.torrent_pane_height - dims.statusbar;

function tab_button(label) {
    var size = tab_icons.size;
    var width = size;
    var idx = _.indexOf(tab_icons.items, label);
    var offset = idx * (size + tab_icons.padding * 2) + ((tab_icons.margin ? tab_icons.margin:0) + tab_icons.padding);
    var parts = locale('OV_TABS').split('||');
    var localized_name = { general: parts[0],
                           peers: parts[2],
                           files: parts[4],
                           speed: parts[5] };
//                           logger: 'Logger' };

    var html_parts = ['<div ', ' title="' + label.capitalize() + '" ',
                      'style="margin-left:4px; margin-top: 6px; background:', 
                      'url(' + tab_icons.filename + ') -' + offset + 'px 0px no-repeat',
                      ";width:", size, "px;height:", size, 
                      "px;position:absolute;top:", 0, 
                      "px;left:-", size, 'px"></div>', '<span style="margin-left:8px;">' + localized_name[label] + '</span>'];

    return { 
		html: html_parts.join(''), 
		inset: '0 6 0 ' + (size + 2),
		id: 'tab_' + label,
		style: { 
			fontWeight: 'normal',
			fontSize: global_font_size,
			textAlign: 'left',
			color: ''
		}
	};
}

function loading_view(id, rect) {
    return { view: 'Label', id: id, html: 'Loading, please wait... <img src="' + config.static_prefix + '/images/snake.gif" />', rect: rect, anchors: 'left top', background: '#fff', inset: '10 10 20 20', style: {border: '1px solid black', borderRadius: '10px' } };
}

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

function toolbar_button(label, additional) {
    var size = toolbar_icons.size;
    var padding = toolbar_icons.padding;
    var idx = _.indexOf(toolbar_icons.items, label);
    if (idx != -1) {
        var offset = idx * (size + padding * 2) + padding;
    } else {
        throw Error('could not find toolbar icon ' + label );
    }

    var html_parts = ['<div ', // ' title="' + label.capitalize() + '" ',
                      // title is now set dynamically
                      'style="background:',
                      'url(' + toolbar_icons.filename + ') -' + offset +'px 0',
                      ";width:", size, "px;height:", size,
                      "px;position:absolute;top:", 2, 
                      "px;left:-", size, 'px">', additional ? additional : '' ,'</div>'];
    var html = html_parts.join('');
    return { html: html, inset: '1 4 0 28', id: 'toolbar_'+label, style: { fontWeight: 'normal', fontSize: global_font_size, textAlign: 'left', color: '' } };

}

function add_file_button() {
    if (utweb.filereader._native) {
        var html = '<div style="padding-top: 4px; width: 24px; height: 24px"><div id="upload_btn" style="overflow:hidden; "><input type="file" id="upload_file_selection" style="text-indent:-9999px" /></div></div>';
        return toolbar_button('torrent_add',html);
    } else if (! config.webui) {
        try { // IE9 new activexobject returns exception when flash is not installed... 
        if (config.utweb && navigator.mimeTypes['application/x-shockwave-flash'] !== undefined || (window.ActiveXObject && new ActiveXObject('ShockwaveFlash.ShockwaveFlash.6'))) {
                //console.log('embedding the swf object thingiemagig');
                return { html:'<div style="padding-top: 4px; width: 24px; height: 24px"><div id="upload_btn"></div></div>' };
        }
        } catch(e) {
        // flash not installed... maybe show a warning...?
        }
    }
    return toolbar_button('torrent_add');

}

uki.theme.airport.backgrounds.list = function(rowHeight) {
    return new uki.background.Rows(rowHeight, '#ffffff');
};
//uki.theme.register(uki.theme.airport);

var color_theme = {

    // menubar: new uki.background.LinearGradient({
    //     startColor: rgb(ut_colors.green),//'#22cc33',
    //     stops: [ 
    //         { pos: 0.8, color: rgb(darker(ut_colors.green,.9)) }
    //     ],
    // 
    //     endColor: rgb(darker(ut_colors.green,.5)) }),
        
    menubar: rgb_hex(ut_colors.green),
    dividers: '#ffffff',

    toolbar: new uki.background.LinearGradient({
        startColor: '#ededed',
        endColor: '#dcdcdc' }),

    tabs: new uki.background.LinearGradient({
        startColor: '#e0e0e0',
        endColor: '#e7e7e7' }),

    statusbar: new uki.background.LinearGradient({
        startColor: '#e7e7e7',
        endColor: '#d2d2d2' })
};


var statusbar_childviews = [
		{ view: "Label", id: "statusbar_download", html: "", anchors: "bottom", rect: RC((window_w/2) - 60, 0, 40, dims.statusbar)}
		, { view: "Label", id: "statusbar_upload", html: "", anchors: "bottom", rect: RC((window_w/2) + 40, 0, 40, dims.statusbar)}
		//, { view: "Label", id: "statusbar_about", text: 'About', anchors: "bottom left", rect: RC(20, 0, 60, dims.statusbar) }
];

if (config.utweb) {
    statusbar_childviews = [ { view: "Label", id: "statusbar_sessions", text: 'Sessions', anchors: "bottom right", rect: RC(window_w - 70, dims.statusbar - 24, 60, 18) }
               ].concat( statusbar_childviews );
}


var detail_panes = [
    { view: 'Box', id: 'detail_pane_general', anchors: 'left top right bottom', background:'#fff', sketch: true,
      rect: RC(0, dims.tabs, dims.main_pane_width, dims.detail_pane_height) },

    { view: 'Table', id: "detail_pane_peers", anchors: 'left top right bottom', sketch: true, rowHeight: table_row_height,
      rect: RC(0, dims.tabs, dims.main_pane_width, dims.detail_pane_height),
      columns: [], 
      multiselect: true, style: {fontSize: global_font_size, lineHeight: table_line_height} },

    { view: 'Table', id: "detail_pane_files", anchors: 'left top right bottom', sketch: true, rowHeight: table_row_height,
      rect: RC(0, dims.tabs, dims.main_pane_width, dims.detail_pane_height),
      columns: [], 
      multiselect: true, style: {fontSize: global_font_size, lineHeight: table_line_height} },

    { view: 'Box', id: 'detail_pane_speed', anchors: 'left top right bottom', sketch: true, rowHeight: table_row_height,
      rect: RC(0, dims.tabs, dims.main_pane_width, dims.detail_pane_height) }

/*
    { view: 'ScrollPane', id: 'detail_pane_logger', anchors: 'left top right bottom', background: '#fff',
      rect: RC(0, dims.tabs, dims.main_pane_width, dims.detail_pane_height), childViews: [
          
          { view: 'List', id: "logger_list", rect: RC(0, 0, dims.main_pane_width, dims.detail_pane_height), background: '#fff',
            multiselect: true, style: {fontSize: '8px', lineHeight: '8px'},
            anchors: 'left top right bottom' }
      ] }
      */

];

var add_url_disabled = (config.build == 'embedded' || config.product == 'embedded');
var toolbar_childviews = [{ view: 'Toolbar', sketch: true, rect: RC(10, 4, dims.toolbar_width, 30), anchors: 'left top right bottom', focusable: false,
                            buttons: toolbar_buttons}];

toolbar_childviews = toolbar_childviews.concat( [
    { view: 'TreeListSelect', sketch: true, id: "toolbar_more_actions", rect: RC(dims.toolbar_width + 10, 7, dims.more_actions_width, dims.add_url_stuff), anchors: 'top right', options: more_actions_options}
]); 
                          
if (! add_url_disabled) {
    toolbar_childviews = toolbar_childviews.concat( [
/* these are dynamically resized at the bottom of this file */
        { view: 'TextField', sketch: true, id: "torrent_url", placeholder: ' ' + locale('Paste a torrent or feed URL'), rect: RC(dims.toolbar_width + dims.more_actions_width, 0, dims.main_pane_width - (dims.toolbar_width + dims.more_actions_width + 100), dims.add_url_stuff), anchors: 'top right' },
        { view: 'Button', sketch: true, id: "torrent_url_add", text:'Add', rect: RC(dims.main_pane_width - 40, 0, 40, dims.add_url_stuff), anchors: 'top right' }
    ]);
}

var global_container = [
    // Top bar
    { view: 'Box', id: 'menubar',  rect: RC(0,0,window_w, dims.menubar), anchors: 'top left right' },


/*
    { view: 'Box', id: "global_container", rect: RC(0,0,window_w,dims.menubar), anchors: 'top left right', 

      background: color_theme.menubar, 
      childViews: [
          { view: 'Image', rect: '8 0 148 31', anchors: 'left top', src: config.static_prefix + '/images/ut_logo_full.png' },

          { view: "Label", id:"survey_button", rect: RC( window_w - 210, 6, 120, 20), anchors: 'right', html: '<a href="http://www.surveymonkey.com/s/JGSP6ZR" style="font-weight: bold; color: white" target="_blank">Take our Survey</a>' },

          { view: 'Button', id:"media_button", rect: RC( 180 , 4, 70, 20 ), anchors: 'left', text: 'Media' },
          { view: 'Button', id:"logout_button", rect: RC( window_w - 75 , 4, 70, 20 ), anchors: 'right', text: 'Logout' }
      ]},
      */

    { view: 'HSplitPane', id:"hsplitpane",
      rect: RC(0, dims.menubar, window_w, window_h - dims.menubar - dims.statusbar), anchors: 'left top bottom right', 
      handleWidth: 1, handlePosition: dims.sidebar/*, leftMin: 100*/, rightMin: 100, background: color_theme.dividers,

      leftChildViews: [

          { view: 'ScrollPane', id:"category_scrollpane", rect: RC(0, 0, dims.sidebar, window_h - dims.menubar - dims.statusbar), anchors: 'top left right bottom',
            scrollableH: true, scrollableV: true,
			background: new uki.background.Css('#f4f6f9'),
            childViews: [
				// Categories Pane
                {
					view: 'uki.more.view.TreeList', sketch: true, id: 'categories', anchors: 'left top right', className: 'categories',
					rect: RC(0, 8, dims.sidebar, 10),
					data: category_data,
					rowHeight: 18,
					style: {fontSize: global_font_size },
					multiselect: true
				}

          ]}

      ],

      rightChildViews: [
          { view: 'Box', id: 'btapp_container', rect: RC(0,0,dims.main_pane_width,window_h - dims.menubar - dims.statusbar), anchors: 'left top right bottom' },

          { view: 'VSplitPane', id: 'vsplitpane',
            rect: RC(0, 0, dims.main_pane_width, window_h - dims.menubar - dims.statusbar), 
            background: color_theme.dividers, handleWidth: 1, 
            handlePosition: dims.torrent_pane_height + dims.toolbar, anchors: 'top left right bottom',

            topChildViews: [
                // Toolbar BG hack
                { view: 'Box', focusable: false, id: "ToolbarBG", rect: RC(0, 0, dims.main_pane_width, dims.toolbar), anchors: 'left top right', background: color_theme.toolbar },

                // Toolbar
                { view: 'Box', focusable: false, id: "Toolbar", rect: RC(0, 0, dims.main_pane_width, dims.toolbar), anchors: 'left top', background: color_theme.toolbar, childViews: 
                    toolbar_childviews
                },

                // RSS feed item list
                { view: 'Table', id: "FeedItems", anchors: 'left top right bottom', sketch: true,
                  rect: RC(0, dims.toolbar, dims.main_pane_width, dims.torrent_pane_height),
                  columns: [], textSelectable: false, rowHeight: table_row_height,
                  multiselect: true, style: {fontSize: global_font_size, lineHeight: table_line_height} },

                // Torrents List
                { view: 'Table', id: "Torrents", anchors: 'left top right bottom', sketch: true,
                  rect: RC(0, dims.toolbar, dims.main_pane_width, dims.torrent_pane_height),
                  columns: [], textSelectable: false, rowHeight: table_row_height,
                  multiselect: true, style: {fontSize: global_font_size, lineHeight: table_line_height} },

                loading_view('Torrents_loading', RC(0, dims.toolbar + dims.header_height, dims.loading_width, dims.loading_height) )
                


            ],
            bottomChildViews: [

                { view: 'Toolbar', id: "tabs_toolbar", rect: RC(0, 0, dims.main_pane_width, dims.tabs), anchors: 'left top right', background: color_theme.tabs, sketch: true,
                  buttons: [
                      tab_button('files'),
                      tab_button('general'),
                      tab_button('peers'),
                      tab_button('speed')
//                      tab_button('logger')
                  ]},

                detail_panes[0],
                detail_panes[1],
                detail_panes[2],
                detail_panes[3],
//                detail_panes[4],
                loading_view('Detail_loading', RC(0, dims.tabs + dims.header_height, dims.loading_width, dims.loading_height))

                


            ]
          }
      ]
    },
    // Status bar
    { view: 'Box', id:"statusbar", rect: RC(0, window_h - dims.statusbar, window_w, dims.statusbar), anchors: 'left bottom right', sketch: false, background: color_theme.statusbar, childViews: statusbar_childviews
    }
];


var uki_view = uki(global_container);

if (! add_url_disabled) {
    var pane = uki('VSplitPane:eq(0)', uki_view).bind('resize', function(event) {
    // "Paste a Torrent URL" resizing math
        var toolbarbuttons_width = dims.toolbar_width;
		var right_padding = 10;
        var url_textfield = uki('#torrent_url')[0];
        var new_width = event.newRect.width - toolbarbuttons_width - 42;
        var vpadding = Math.floor((dims.toolbar - dims.add_url_stuff)/2);
        var newRect = RC( - right_padding + toolbarbuttons_width + 2 + dims.more_actions_width + dims.more_actions_spacer, vpadding, new_width - 156, dims.add_url_stuff );

        uki('#torrent_url')[0].rect( newRect );
        uki('#torrent_url_add')[0].rect( RC( - right_padding + toolbarbuttons_width + new_width, vpadding, 40, dims.add_url_stuff ) );

    });
}

window.uki_view = uki_view;
window.display_columns = display_columns;
window.display_column_lookup = display_column_lookup;
window.icon_and_text = icon_and_text;
window.app_icon_and_text = app_icon_and_text;
window.Formatters = Formatters;
window.RC = RC;
window.ut_colors = ut_colors;
window.rgb_hex = rgb_hex;
window.darker = darker;
window.tab_button = tab_button;
window.dims = dims;

}
