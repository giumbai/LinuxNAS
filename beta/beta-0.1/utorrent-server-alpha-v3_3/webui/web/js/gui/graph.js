(function(_) {
function SpeedGraph(app) {
    this.app = app;
    this.initialized = false;

    this.maxSeconds = 600;
    this.seconds = -1;
    this.startSeconds = (new Date).getTime() / 1000;
    this.speeds = {};


    this.opts = {
        "colors": ["#1C8DFF", "#009900"],
        "lines": {
            show: true
        },
        "xaxis": {
            "max": (this.seconds - this.startSeconds >= this.maxSeconds) ? null : this.maxSeconds + this.startSeconds,
            "tickSize": 60,
            "tickFormatter": function(n, axis) {
                var dt = new Date(n * 1000);
                var h = dt.getHours();
                var m = dt.getMinutes();
                var s = dt.getSeconds();
                h = (h < 10) ? ("0" + h) : h;
                m = (m < 10) ? ("0" + m) : m;
                s = (s < 10) ? ("0" + s) : s;
                return (h + ":" + m);
            }
        },
        "yaxis": {
            "min": 0,
            "minTickSize": 1 * 1024,
            "tickFormatter": function(n, axis) {
                return (Formatters.to_file_size(parseInt(n)) + '/s');
            }
        },
        "grid": {
            "color": "#868686"
        },
        "shadowSize": 0
    };
    var _this = this;
    uki('#detail_pane_speed', uki_view).bind('resize', function(event) {
                                                   if (utweb.active_tab == 'speed') {
                                                       _this.draw(true);
                                                   }
                              });


}

SpeedGraph.prototype = {

    "attach": function(element) {
        this.element = jQuery(element);
    },

    merge_series: function (a, b)
    {
        if(!a.length) return b;
        if(!b.length) return a;
        if(a[0][0] < b[0][0]) return [a[0][0]].concat(this.merge_series(a.slice(1), b));
        if(a[0][0] > b[0][0]) return [b[0][0]].concat(this.merge_series(a, b.slice(1)));
        return [[a[0][0], a[0][1] + b[0][1], a[0][2] + b[0][2]]].concat(this.merge_series(a.slice(1), b.slice(1)));
    },

    draw: function(resize) {
        //console.log('speedgraph draw',resize);
        var self = this;
        if (utweb.active_tab != "speed" || ! self.received_data) return;

        var selected = self.app.selectedTorrents();

        var seriess = _.map(selected.length ? selected : utweb.current_client().torrent.all(),
                            function(tor)
                            {
                                return self.speeds[tor.hash];
                            });

        if (seriess.length > 0) {

            series = _.reduce(seriess, _.bind(self.merge_series,self), []);

            this.opts.xaxis.max = ((new Date).getTime() / 1000 - this.startSeconds >= this.maxSeconds) ? null : this.maxSeconds + this.startSeconds;
            // xxx: resize causes labels to jump around a little...
            var plotme = [{label: resize?'':locale('OV_COL_UPSPD'), data: _.map(series, function(point) {return [point[0], [point[1]]]})},
                          {label: resize?'':locale('OV_COL_DOWNSPD'), data: _.map(series, function(point) {return [point[0], [point[2]]]})}];

            try {
                jQuery.plot(this.element, plotme, this.opts);
            } catch(e) {
                console.log(e,'failed drawing plot - probably in headless mode or plot dimensions wrong');
            }
        }
    },
/*
    "resize": function(w, h) {
        if(w) jQuery(this.element).width(w);
        if(h) jQuery(this.element).height(h);
        this.draw();
        return;
        // This is a horrible hack that has to do with IE being a piece of
        // crap.
        //        this.element = $("spgraph");
        if (!w && !h) return;
        var style = {};
        if (w) style.width = w;
        if (h) style.height = h;
        this.element.setStyles(style);
        this.draw();
    },
    */
    "add_data": function(torrents) {
        var self = this;
        this.received_data = true;
        var seconds = (new Date).getTime() / 1000;

        _.each(torrents, function(tor)
               {
                   if(!self.speeds.hasOwnProperty(tor.hash))
                   {
                       self.speeds[tor.hash] = [];
                   }
                   self.speeds[tor.hash].push([seconds, tor.up_speed, tor.down_speed]);
                   while(_.last(self.speeds[tor.hash])[0] - _.first(self.speeds[tor.hash])[0] > self.maxSeconds)
                   {
                       self.speeds[tor.hash].shift();
                   }
               });
    }
};

window.SpeedGraph2 = SpeedGraph;

})(exports._);
