/* 

uTorrent Web / Web UI controller logic

config.utweb -> uTorrent Web (falcon)
config.webui -> Web UI (no falcon)

*/

(function(_) {

var uservoice = null;
var update_ms = 30; // maximum time needed between ui redraws ...
var fps = 1000/update_ms;

var agent=navigator.userAgent.toLowerCase();
var is_iphone = (agent.indexOf('iphone')!=-1);
var is_ipad = (agent.indexOf('ipad')!=-1);
var is_android = (agent.indexOf('android')!=-1);

function detect_new_blackberry() {
    return (agent.indexOf('blackberry')!=-1 && agent.indexOf('mobile safari')!=-1);
}

function wants_mobile_ui() {
    return (is_iphone || is_android || detect_new_blackberry());
}

uki.destroy_helper = function(uki_item) {
    // uki does not really support dynamically creating views, so it
    // doesnt provice any mechanism to garbage collect them. this gets
    // 90% of the way, but each view leaves a couple of phantom
    // observers behind... so is a slow memory leak (for each uki dialog)
    if (uki_item._eventTargets) {
        _.each(_.keys(uki_item._eventTargets), function(event_name) {
            uki_item._unbindFromDom(event_name);
        });
    }
    if (uki_item._observers) {
        _.each(_.keys(uki_item._observers), function(item) {
            uki_item.unbind(item, uki_item._observers[item]);
        });
    }
    if (uki_item._childViews) {
        _.each(uki_item._childViews, function(view) {
            uki.destroy_helper(view);
        });
    }
    uki_item._unbindFromDom(); // doesnt seem to work
    jQuery(uki_item.dom()).remove();
}

uki.destroy = function destroy(uki_item) {
    //console.log('before destroy debug: # uki binds/handlers', _.keys(uki.dom.bound).length,'/',_.keys(uki.dom.handlers).length);
    uki.destroy_helper(uki_item);
    //console.log('after destroy debug: # uki binds/handlers', _.keys(uki.dom.bound).length,'/',_.keys(uki.dom.handlers).length);
}

function DisplaySettings(app) {
    // use jStorage to save display settings...
    this.app = app;
}
DisplaySettings.prototype = {
    pre_attach_restore: function() {
	    var self = this;
	    var settings = this.settings;

        if (settings.visible_columns) {
            _.each( settings.visible_columns, function(col, table_name) {
                _.each( col, function(settings, col_name) {
                    var idx = display_column_lookup[table_name][col_name];
                    var coldata = display_columns[table_name][idx];
                    if (idx !== undefined && coldata) {
                        coldata.hidden = ! settings.visible;
                        if (settings.width != undefined) {
                            coldata.width = settings.width;
                        }
                    }
                });
                self.app.tables[table_name].reinitializeColumns();

            });
        }

	    if (settings.hsplit_position) {
	        uki('#hsplitpane')[0].handlePosition( settings.hsplit_position );
	    }
	    if (settings.vsplit_position) {
	        uki('#vsplitpane')[0].handlePosition( settings.vsplit_position );
	    }

        var hsplit = uki('#hsplitpane')[0];
        // make the detail tabs lay themselves out correctly
        hsplit.handlePosition( hsplit.handlePosition()+1 );
        hsplit.handlePosition( hsplit.handlePosition()-1 );
        //hsplit.parent().layout();

        self.app.active_tab = settings.active_tab;
    
    },
    restore_after_first_view_update: function(callback) {
        //console.log('Restoring view-dependent settings');
        var self = this;
        var settings = this.settings;
        uki('#Detail_loading').visible(false);
        self.app.tables.category.restore_expanders( settings.categories_expanded );

        if (settings.selected_categories) {

            var restore_category_selection_delay = settings.categories_expanded ? (settings.categories_expanded.length + 1) * update_ms: 0;

            setTimeout( function() {
                self.app.tables.category.view.selectedIndexes( settings.selected_categories );
                //console.log('category pane changeselection');
                self.app.tables.category.changeSelection();

                var how_long_torrent_table_draw_takes = update_ms * 4;

                setTimeout( function() {


                    setTimeout( function() {
                        if (settings.active_tab) {
                            //console.log('restoring active tab',settings.active_tab);
                            self.app.switchtab(settings.active_tab, true);
                        }
                    }, update_ms );


                    if (settings.selected_items) {
                        if (self.app.tables.torrent.view.visible()) {
                            //console.log('restoring torrent selection');
                            self.app.tables.torrent.view.selectedIndexes( settings.selected_items );

                            //self.app.redrawDetailPane();
                        } else {
                            //console.log('restoring feed item selection');
                            self.app.tables.feeditem.view.selectedIndexes( settings.selected_items );
                        }
                    }
                }, how_long_torrent_table_draw_takes); 

            }, restore_category_selection_delay);
            if (callback) {
                setTimeout( callback, restore_category_selection_delay + update_ms );
            }
        } else {
            if (callback) {
                setTimeout( callback, update_ms );
            }
        }


/*
        var hsplit = uki('#hsplitpane')[0];
        // make the detail tabs lay themselves out correctly
        hsplit.handlePosition( hsplit.handlePosition()+1 );
        hsplit.handlePosition( hsplit.handlePosition()-1 );
        hsplit.parent().layout();
        */

    },
    load: function() {
        var settings = fjQuery.jStorage.get('utweb_display_settings') || {};
        //var settings = null;

        default_settings = {
            categories_expanded: ['Torrents','Apps'],
            selected_categories: [0],
            active_tab: 'speed',
            hsplit_position: uki('#hsplitpane')[0].handlePosition(),
            vsplit_position: uki('#vsplitpane')[0].handlePosition()
        };

        _.each(default_settings, function(val,key) {
            if (settings[key] === undefined) {
                settings[key] = val;
            }
        });

        this.settings = settings;

    },
    save: function() {
        var self = this;
        var settings = { categories_expanded: [],
                         hsplit_position: uki('#hsplitpane')[0].handlePosition(),
                         vsplit_position: uki('#vsplitpane')[0].handlePosition(),
                         visible_columns: self.app.visible_column_settings(),
                         selected_items: self.app.tables.torrent.view.visible() ?
                         self.app.tables.torrent.view.selectedIndexes() : self.app.tables.feeditem.view.selectedIndexes(),
                         selected_hashes: _.map( self.app.selectedTorrents(), function(t) { return t.hash; } ),
                         active_tab: self.app.active_tab,
                         selected_categories: self.app.tables.category.view.selectedIndexes()
                       };

        

        _.each(['Torrents','Feeds','Labels','Apps'], function(category) {
            var node = self.app.tables.category.getnode('category', category);
            if (node && node.__opened) {
                settings.categories_expanded.push(category);
            }
        });
        fjQuery.jStorage.set('utweb_display_settings', settings);
    }
}





function LoginWindow(err_data, login_here) { 

    if (!login_here) {
        var error_message = 'Authentication error.';
    
        if (err_data && err_data.xhr) {
            if (err_data.xhr.status == 404) { // not found
                error_message = "Your client doesn't seem to be connected. Sign in with username and password in the Remote Access preferences";
            } else if (err_data.xhr.status == 401) { // not authorized
                if (err_data.get_token) {
                    error_message = 'Your session has expired.';
                    if (config.asserts) { debugger; }
                } else {
                    error_message = "Not authorized. You need to re-negotiate a new session key.";
                    if (config.asserts) { debugger; }
                }
            } else if (err_data.xhr.status == 0) { // ???
                error_message = "Connection closed unexpectedly.";
            } else if (err_data.message == 'Got a garbled looking token.') {
                console.log(err_data);
                error_message = err_data.message;
            }
        } else if (err_data.get_token) {
            error_message = err_data.err;;
        } else {
            error_message = 'Goodbye';
            //error_message = 'Thanks for using &micro;Torrent Remote.';
        }

        var xhrstatus = err_data.xhr ? err_data.xhr.status : -1;

        // TODO: purge from falconStore.sessionKeys
      var extra_param = (config.build!='purpleization'?'&utorrent=1':'');
      window.location = '//' + config.logout_root + '/talon/logout?message=' + encodeURIComponent(error_message) + '&xhr_status=' + encodeURI(xhrstatus) + extra_param;
        return;
    }

    var login_layout = { view: 'Box', rect: RC(jQuery(window).width()/4, jQuery(window).height()/3-100, jQuery(window).width()/2, 200), style: { boxShadow: '4px 4px 4px black', border: '1px solid grey', borderRadius: '10px', padding: '10px' }, 
                         background: new uki.background.Multi(

                             new uki.background.Css({ 
                                 background: '#fff',
                                 boxShadow: '0 10px 6px #000',
                                 borderRadius: '10px'
                             })
                         ),

                         childViews: [
        { view: 'Label', rect: '20 0 100 0', anchors: 'left top', html: '<h2>Login</h2>' },
        { view: 'Label', rect: '20 24 400 65', anchors: 'left top right', adaptToContents: true, multiline: true, html: error_message },

        { view: 'TextField',rect: '40 60 100 24', anchors: 'left top', placeholder: 'Username', id:"username" },
        { view: 'PasswordTextField',rect: '40 84 100 24', anchors: 'left top', placeholder: 'Password', id:"password" },
        { view: 'Checkbox', rect: '40 120 24 24', anchors: 'top left', name: 'stay_signed_in' },
        { view: 'Label', rect: '70 120 24 24', anchors: 'left top', text: 'Stay signed in' },
        { view: 'Button', rect: '60 155 60 24', anchors: 'left top', text:'Login' }
    ]};

    var layout = { view: 'Box', rect: RC(0,0,jQuery(window).width(), jQuery(window).height()), 
                   background: 'rgb(0,0,0, 0.3)', anchors: 'top left right bottom',
                   background: new uki.background.CssBox( 'background:#000;' + (uki.browser.cssFilter() && uki.image.needAlphaFix ? 'filter:Alpha(opacity=70);' : 'opacity:0.7;') ),
                   childViews: [login_layout] };

    var _this = this;
    this.view = uki(layout);
    uki('Button[text=Login]',this.view).click( function() { 
        _this.login( uki('Checkbox', _this.view).value(),  
                     uki('TextField', _this.view).value(), 
                     uki('PasswordTextField', _this.view).value() );
    } );
    this.view.attachTo(window);
    this.view = this.view[0];
}
LoginWindow.prototype = {
    login: function(stay_signed_in, username, password) {
        jsLoader.load( ['srp/key_negotiation'], function() {
                           login(username, password, { from_raptor: true } );
                       });
    }

}

function PopupWindow(rect, contents, title, no_close_button) {
    var rect = uki.geometry.Rect.fromString(rect);

    var layout = {view: 'ScrollPane', scrollableV: true, scrollableH: true, defaultCss:"z-index:9999",
                  background: new uki.background.Multi(

                      new uki.background.Css({ 
                          background: '#fff',
                          boxShadow: '0 10px 6px #000',
                          borderRadius: '10px'
                      })
                  ),

                  rect: rect, anchors: 'top left', childViews: [

                      {view: 'Label', 
                       multiline: true,
                       rect: RC(50, 50, rect.width - 100, rect.height - 50),
                       style: { "white-space": 'pre-wrap' }, // does this work?
                       adaptToContents: true,
                       selectable: true,
                       //         text: contents
                       html: contents
                      },

                      { view: 'Label', rect: RC(20, 0, rect.width - 50, 30),
                        html: title },
                      { view: 'Button',
                        text: locale('DLG_BTN_CLOSE'),
                        rect: RC(rect.width - 50 - 10, 10, 50, 30)
                      }
                     ]};

    if (no_close_button) {
      layout.childViews.splice(2,2);
    }

    layout = { view: 'Box', rect: RC(0,0,jQuery(window).width(), jQuery(window).height()),
               background: 'rgb(0,0,0, 0.3)', anchors: 'top left bottom right',
               background: new uki.background.CssBox( 'background:#000;' + (uki.browser.cssFilter() && uki.image.needAlphaFix ? 'filter:Alpha(opacity=70);' : 'opacity:0.7;') ),
               childViews: [layout] };

    this.view = uki(layout)[0];
    var self = this;
    uki('Button', this.view).click( function() { self.die(); } );
    uki(this.view).attachTo(window);
}

PopupWindow.prototype = {
    add: function(item) {
        uki('ScrollPane',this.view)[0].dom().appendChild( item );
    },
    die: function() {
        uki.destroy(this.view);
    }
  }


function SortableHideableTable(view, display_columns) {
    var self = this;
    this.__name__ = 'SortableHideableTable';
    this.view = view;
    this.display_columns = display_columns;
    this.index = {};
    this.reinitializeColumns();

    uki(self.view.header()).bind('columnClick', function(e) {
        self.columnClick(e.source, e.column, e.columnIndex);
    });

    uki(self.view.header()).contextmenu( function(event) {
        event.preventDefault(); // prevent browser context menu
    });
    uki(self.view.header()).mouseup( function(event) { 
        if (event.which == 3) {

            var column_callbacks = _.map(self.display_columns, function(column, colindex) {
                var colname = column.name || column.localized;
                var localized;
                if (column.localized_filter) {
                    localized = column.localized_filter( locale(column.localized) );
                } else {
                    localized = column.localized ? locale(column.localized) : column.name;
                }
                var html;
                if (column.hidden) {
                    html = '<span style="visibility:hidden">&#10003;</span>';
                } else {
                    html = '&#10003;';
                }
                html += '<span style="text-transform:capitalize;margin-left: 4px">'+localized+'</span>';
                var item = { label: colname,
                             html: html,
                             callback: function() { 
                                 setTimeout( function() {
                                     if (column.hidden) {
                                         self.showColumn(colname, colindex);
                                     } else {
                                         self.hideColumn(colname, colindex);
                                     }
                                 }, update_ms );
                             }
                           };
                return item;
            });

            new UTContextMenu( { app: self.app, event: event, items: column_callbacks } );

        }
    });

    uki(self.view.list()).click( function(event) {
        
        if (self.app.last_detail_draw && 
            new Date() - self.app.last_detail_draw.time < 200 && 
            self.app.active_tab == self.app.last_detail_draw.tab &&
            self.app.selectedTorrent() == self.app.last_detail_draw.torrent) {
            var redraw = false;
        } else {
            var redraw = true;
        }
        //console.log('sortable table list item click event with redraw', redraw);
        self.changeSelection(redraw);
    });

    uki(self.view.list()).bind('ctrla', function(event) {
        setTimeout( function() {
            self.app.toolbar.update(); // need to update toolbar
            // commands in a little bit, after the new selection has registered
        }, update_ms);
    });



    var KEYS = { left: 37,
                 up: 38,
                 right: 39,
                 down: 40 };

    uki(self.view.list()).keydown( function(event) {
        if ( _.contains( [KEYS.up, KEYS.down], event.which) ) {
            self.changeSelection(true);
        }
        
        switch ( event.which ) {
        case KEYS.right: 
            var scrollpane = self.view._scrollPane;
            scrollpane.dom().scrollLeft = scrollpane.scrollLeft() + 30;
            break;
        case KEYS.left:
            var scrollpane = self.view._scrollPane;
            scrollpane.dom().scrollLeft = scrollpane.scrollLeft() - 30;
            break;
            
        }

    });


}
SortableHideableTable.prototype = {
    draw: function() {
        if (this.view.visible() == true) {
            var self = this;
            // redraw myself, taking into account
            // 1) current filters
            // 2) current sort
            // 3) current selection

            // TODO: make sorting faster by creating an index?

            var sel = this.view.selectedRows();
            if (this.current_filter) {
                var data = this.filterData( this.getData(), this.current_filter );
            } else {
                var data = this.getData();
            }
            if (data) {
                if (this.loader) { this.loader.visible(false); }
                data = this.sortData( data );
                this.view.data( data );
                this.view.list().layout();
                this.view._scrollPane.layout();
                this.update_index( data );


                // now restore selection
                var restore_sel = _.map(sel, function(item) { return self.view_find_index(item); });
                this.view.selectedIndexes( restore_sel );
            } else {
                //console.log('no data for drawing',this.__name__,this);
            }
        }
    },

    changeSelection: function() {
        // implement me
    },

    update_index: function(view_data, attribute) {
        var column = attribute || 'uid';
        var self = this;
        self.index[column] = {};
        for (var i=0; i < view_data.length; i++) {
            var item = view_data[i];
            self.index[column][ item[column] ] = i;
        }
    },

    view_find_index: function(item) {
        var data_index = this.index.uid[item.uid];
        if (data_index !== undefined) {
            return data_index;
        } else {
            return -1
        }
    },

    redrawHeaders: function() {
    	var header = this.view.header();
        _.each(header.columns(), function(col,i) {
            header.redrawColumn(i);
        });
    },

    columnClick: function(header, ukicolumn, index) {
        var self = this;

        var visible_columns = _.filter(this.display_columns, function(c) { return ! c.hidden; });
        var column = visible_columns[index];

        _.each(header.columns(), function(col,i) {
            col.sort('');
            header.redrawColumn(i);
        });
        _.each(self.display_columns, function(col) { 
            if (col == column) {
                col.sorted = true;
                if (column.sort_dir == 'ASC') {
                    column.sort_dir = 'DESC';
                } else {
                    column.sort_dir = 'ASC';
                }
                ukicolumn.sort(column.sort_dir); // set the sort icon
                header.redrawColumn(index);
            } else {
                col.sorted = false; 

            }
        });
        this.draw(true);

    },

    make_view_column: function(spec) {
        var col = { view: 'table.' + (spec.type == 'int' ? 'NumberColumn' : 'CustomColumn'),
                    label: spec.localized || spec.name,
                    name: spec.name,
                    resizable: true,
                    width: spec.width ? spec.width : 100,
                    minWidth: 10
                  };

        if (spec.name == 'progress') {
            col.css = uki.view.table.Column.prototype._css + '; text-align:center;';
        }
        if (spec.header_align)
            col.css = uki.view.table.Column.prototype._css + '; text-align:' + spec.header_align + ';';
        if (spec.sortby === undefined) {
            if (spec.name) {
                spec.sortby = function(item) { return item[spec.name]; };
            } else if (spec.formatter) {
                console.log('using formatter sort',spec);
                spec.sortby = function(item) { return spec.formatter(item); };
            } else {
                consloe.log('not able to sort',spec);
            }
        } else {
            spec.sortby = spec.sortby;
        }
        if (spec['formatter']) { col.formatter = spec['formatter']; }
        if (spec.name && spec.formatter === undefined) {
            col.formatter = function(item) { return item[spec.name]; };
        };
        return col;
    },

    change_column_visibility: function(name, show) {
        var _this = this;
        _.each(self.display_columns.file, function(v,i) {
                   if (v.name == name) {
                       _this.showColumn(name, i);
                   }
               });

    },

    reinitializeColumns: function(redraw) {
        var self = this;
        var new_columns = _.map( _.filter( this.display_columns, function(col) { return ! col.hidden; } ), function(col) {
            return self.make_view_column( col );
        });
        this.view.columns( new_columns );
        if (redraw) {
            this.draw();
        }
    },

    updateColumnAttributes: function( colname, data ) {
        var _this = this;
        _.each( this.view.columns(), function(col) {
            var id = col.label();

            _.each( _this.display_columns, function(spec) { // update
                // the column spec width
                if (id == (spec.localized || spec.name)) {
                    spec.width = col.width();
                    _.breakLoop();
                }
                
            });
        });

        _.each( this.display_columns, function(spec) {
            var id = spec.name;
            if (id == colname) {
                _.extend(spec, data);
                _.breakLoop();
            }
        });
        
    },

    hideColumn: function(colname, colindex) {
        this.updateColumnAttributes(colname, { hidden: true });
        this.reinitializeColumns(true);
    },
    showColumn: function(colname, colindex) {
        this.updateColumnAttributes(colname, { hidden: false });
        this.reinitializeColumns(true);
    },

    get_column_visibility: function() {
        // gets column visibility for saving state
        var columns = {};
        var self = this;
        _.each(this.display_columns, function(col) {
            columns[col.name] = { visible: ! col.hidden };
            var ukicol = self.view.getColumnByName(col.name);
            if (ukicol) { 
                columns[col.name].width = ukicol.width();
            }
        });
        return columns;
    },

    sortData: function(data) {
        var getsortvalue = null;
        var sort_dir = null;

        _.each(this.display_columns, function(col) { 
            if (col.sorted) { 
                getsortvalue = col.sortby; 
                sort_dir = col.sort_dir;
                _.breakLoop();
            }
        } );

        function tiebreaker(itema, itemb) {
            // uid "unique identifier" (i.e. hash, hash+filepath, host:port)
            var a = itema.uid;
            var b = itemb.uid;
            return (a >= b ? 1 : a == b ? 0 : -1);
        }

        if (getsortvalue) {
            return data.sort( function(itema, itemb) {
                var a = getsortvalue(itema);
                var b = getsortvalue(itemb);
                var mult = (sort_dir == 'DESC' ? -1 : 1);
                if (a > b) {
                    return 1 * mult;
                } else if (a == b) {
                    return tiebreaker(itema, itemb) * mult;
                } else {
                    return -1 * mult;
                }
            } );
        } else {
            return data;
        }
    }

}


function PeerTable(app) {
    var self = this;
    this.__name__ = 'PeerTable';
    this.app = app;
    this.view = uki('#detail_pane_peers')[0];
    this.loader = uki('#Detail_loading');
    this.timeouts = [];

    SortableHideableTable.apply(this, [this.view, display_columns.peer]);
}

PeerTable.prototype = {};
_.extend(PeerTable.prototype, SortableHideableTable.prototype);
_.extend(PeerTable.prototype, {

    view_open: function(torrents) {
        var self = this;
        if (torrents && torrents.length > 0) {
            self.torrents = torrents;

            var all_fetched = _.reduce( torrents, function(sofar, t) { return sofar && t.peer.fetched; }, true );

            if (all_fetched) {
                //this.draw(torrent); // leading to double draws... ick

            } else {
                this.loader.visible(true);
                this.view.data( [] );

                if (self.app.next_update_id) { 
                    clearTimeout(self.app.next_update_id); // clear
                    // the regular update timer and request an update immediately
                    self.app.updateTick(); // gets fresh data
                } else {
                    // self.app.updateTick(); // this is causing
                    // double updates...
                }
            }

        }

    },
    
    getData: function() {
        if(!this.app.selectedTorrent())
            return  [];

        if (this.torrents) {
            var all_fetched = _.reduce( this.torrents, function(sofar, t) { return sofar && t.peer.fetched; }, true );
            if (all_fetched) {
                var toreturn = [];
                _.each(this.torrents, function(t) {
                    toreturn = toreturn.concat(t.peer.data());
                });
                return toreturn;
            }                
        }
    }

});

function FileTable(app) {
    var self = this;
    this.__name__ = 'FileTable';
    this.app = app;
    this.view = uki('#detail_pane_files')[0];
    this.loader = uki('#Detail_loading');
    this.display_columns = display_columns.file;

    // trying to get away from context menus... move actions to toolbar
    function context_items(file) {

        if (! file.isCompleted()) {
            var items = [
                { label: locale('FI_PRI0').capitalize(), callback: function() {
                    file.setPriority(0);
                }},
                { label: locale('FI_PRI1').capitalize() + ' ' + locale('FI_COL_PRIO'), callback: function() {
                    file.setPriority(1);
                }},
                { label: locale('FI_PRI2').capitalize() + ' ' + locale('FI_COL_PRIO'), callback: function() {
                    file.setPriority(2);
                }},
                { label: locale('FI_PRI3').capitalize() + ' ' + locale('FI_COL_PRIO'), callback: function() {
                    file.setPriority(3);
                }}
            ];
        } else {
            var items = [];
        }

        return items;
    }
    

    uki(self.view.list()).contextmenu( function(event) {
        // TODO: fix to support multiselection (make right click not
        // clear current selection
        var files = self.view.list().selectedRows();
        if (files.length == 0) {
            // do nothing
        } else if (files.length == 1) {
            if (context_items(files[0]).length > 0) {
                event.preventDefault(); // prevent browser context menu
            }
        } else {
            // how to determine what to do hrmmm...
            event.preventDefault();
        }
    });
    uki(self.view.list()).mouseup( function(event) {

        if (event.which == 3) {
            var files = self.view.list().selectedRows();
            if (files.length == 1) {
                var name = files[0].name;
                //var file = self.torrent.file.get(name);
                var file = files[0];

                var items = context_items(file);
                if (items.length > 0) {

                    var contextmenu = new UTContextMenu( {attachTo: self.view, app: self.app, event: event, items: items } );
                }
            } else {
                var incompletes = _.filter( files, function(file) { return ! file.isCompleted(); } );
                if (incompletes.length > 0) {
                    // TODO: command_many set priority
                    var items = [
                        { label: locale('FI_PRI0').capitalize(), callback: function() {
                            _.each(files, function(file) {
                                file.setPriority(0);
                            });
                        }},
                        { label: locale('FI_PRI1').capitalize() + ' ' + locale('FI_COL_PRIO'), callback: function() {
                            _.each(files, function(file) {
                                file.setPriority(1);
                            });
                        }},
                        { label: locale('FI_PRI2').capitalize() + ' ' + locale('FI_COL_PRIO'), callback: function() {
                            _.each(files, function(file) {
                                file.setPriority(2);
                            });
                        }},
                        { label: locale('FI_PRI3').capitalize() + ' ' + locale('FI_COL_PRIO'), callback: function() {
                            _.each(files, function(file) {
                                file.setPriority(3);
                            });
                        }}
                    ];
                    var contextmenu = new UTContextMenu( {attachTo: self.view, app: self.app, event: event, items: items } );
                }
                
            }
        }
    } );
    if (window.config.build != 'embedded') {
        uki(self.view.list()).dblclick( function(event) {
            var file = self.view.list().selectedRows()[0];
            if (file) {
                console.log('doubleclick on file',file);
                file.open();
            }

        });
    }


    // no more context menu!
    SortableHideableTable.apply(this, [this.view, display_columns.file]);
}

FileTable.prototype = {};
_.extend(FileTable.prototype, SortableHideableTable.prototype);
_.extend(FileTable.prototype, {

    getData: function() {
        if(!this.app.selectedTorrent())
            return  [];
        
        if (this.torrents) {
            var all_fetched = _.reduce( this.torrents, function(sofar, t) { return sofar && t.file.fetched; }, true );
            if (all_fetched) {
                var toreturn = [];
                _.each(this.torrents, function(t) {
                    toreturn = toreturn.concat(t.file.data());
                });
                return toreturn;
            }                
        }
    },

    view_open: function(torrents) {
        var self = this;
        if (torrents && torrents.length > 0) {
            self.torrents = torrents;

            var all_fetched = _.reduce( torrents, function(sofar, t) { return sofar && t.file.fetched; }, true );

            if (all_fetched) {
                //this.draw(torrent); // leading to double draws... ick

            } else {
                this.loader.visible(true);
                this.view.data( [] );

                if (self.app.next_update_id) { 
                    clearTimeout(self.app.next_update_id); // clear
                    // the regular update timer and request an update immediately
                    self.app.updateTick(); // gets fresh data
                } else {
                    //self.app.updateTick(); // causing double updates
                }
            }

        }

    },

    getFile: function(file) {
        console.log('download file', file);
        var url_params = { sid: file.manager.torrent.stream_id,
                           file: file.id,
                           service: 'DOWNLOAD',
                           qos: 0
                         };

        if (jQuery.browser.msie) {
            url_params.disposition = 'attachment';
            var iframe = document.getElementById('download_iframe');
            var url = config.proxy_prefix + '?' + jQuery.param( url_params );
            //window.location = url;
            iframe.src = url;
        } else {
            /* other browsers just have raw hyperlinks */
        }
    },
    openFile: function(file) {
        console.log('Openfile on', file);
        var url_params = { sid: file.manager.torrent.stream_id,
                           file: file.id,
                           service: 'DOWNLOAD'
                         };
        this.current_client().raptor.proxy( url_params, function(data, status, xhr) {
            new PopupWindow(RC( 20, 20, Math.max(jQuery(window).width()/2,300) - 20, Math.max(jQuery(window).height(), 300) - 60), 
                            uki.escapeHTML(data), 
                            uki.escapeHTML(file.name));
        });
    },
    viewImage: function(file) {
        // fool

        console.log('View image', file);
        var url_params = { sid: file.manager.torrent.stream_id,
                           file: file.id,
                           service: 'DOWNLOAD',
                           qos: 0
                         };

        url_params.disposition = 'attachment';
        // open in iframe or some stuff

        var img = document.createElement('img');
        img.src = config.proxy_prefix + '?' + jQuery.param( url_params );

        var popup_w = Math.max(jQuery(window).width()/3 * 2,500) - 20;
        var popup_h = Math.max(jQuery(window).height(), 300) - 60;
        img.setAttribute('style', 'margin-top: 50px');
        jQuery(img).width('100%');
        var popup = new PopupWindow(RC( 20, 20, popup_w, popup_h ), '', uki.escapeHTML(file.name) );
        popup.add( img );

    },
    playAudio: function(file) {

        console.log('Play audio', file);
        var url_params = { sid: file.manager.torrent.stream_id,
                           file: file.id,
                           service: 'DOWNLOAD',
                           qos: 0
                         };

        url_params.disposition = 'attachment';
        // open in iframe or some stuff

        var audio = document.createElement('audio');
        audio.src = config.proxy_prefix + '?' + jQuery.param( url_params );
        audio.setAttribute('style', 'margin-top: 2em');
        //audio.autoplay = true;
        audio.controls = true;

        var popup = new PopupWindow(RC( 20, 20, Math.max(jQuery(window).width()/2,300) - 20, Math.max(jQuery(window).height(), 300) - 60), 'An image... (wish I knew its size...)', uki.escapeHTML(file.name) );
        popup.add( audio );

    },
    playVideo: function(file) {

        console.log('Play video', file);
        var url_params = { sid: file.manager.torrent.stream_id,
                           file: file.id,
                           service: 'DOWNLOAD',
                           qos: 0
                         };

        //url_params.disposition = 'attachment';
        // open in iframe or some stuff

        var video = document.createElement('video');
        video.src = config.proxy_prefix + '?' + jQuery.param( url_params );
        video.setAttribute('style', 'margin-top: 3em');
        //audio.autoplay = true;
        video.controls = true;

        var popup = new PopupWindow(RC( 20, 20, Math.max(jQuery(window).width()/2,300) - 20, Math.max(jQuery(window).height(), 300) - 60), 'HTML5 Video', uki.escapeHTML(file.name) );
        popup.add( video );

    }

});


function AppPane(utweb) {
    this.utweb = utweb;
    this.container = uki('#btapp_container')[0];
    this.loading_app = null;
    this.app = null;
}
AppPane.prototype = {
    set_app: function(app, options) {
        console.log('setting app',app);
        jQuery('#uservoice-feedback').hide();
        this.utweb.stopUpdating();
        if (this.get_current_app() == app) {
            this.show();
            console.log('app already active!');
            return;
        }
        if (this.loading_app == app) {
            console.log('same app already loading...');
            return;
        }
        if (this.loading_app) {
            console.log('an app is already loading... canceling the load');
            this.hide();
        }
        //this.app = app;
        this.loading_app = app;

        var _this = this;
        this.remove();

        var iframe = document.createElement('iframe');
        iframe.setAttribute('id', 'app_iframe');
        //iframe.setAttribute('src', '/static/apps/loading.html');
        iframe.setAttribute('style','width:100%; height:100%; border: 0');

        jQuery('#btapp_container').append( iframe );

        function got_everything() {
            var url = app.get_content_path(true) + 'index.html?' + _this.utweb.current_client().client_qs();
            if (options && options.qs) {
                url = url += options.qs;
            }
            console.log('app url is',url);
            jQuery('#app_iframe').attr('src', url);
            jQuery('#app_iframe').load( function() {
                // check that category pane still has us selected...
                var nodes = _this.utweb.tables.category.selectedNodes();
                if (nodes.length ==1 && nodes[0].app == app) {
                    _this.show();
                }
                jQuery('#app_iframe').contents().find('html body').append( jQuery('<script>if (window.console) { console.log(\'loaded app\',\''+app.uid()+'\'); }</script>') );
                _this.app = app;
                _this.loading_app = null;
                _this.utweb.startUpdating();
                //console.log('APP',_this.app,'iframe loaded, injecting adapter script');
                //jQuery('#app_iframe').contents().find('html body').append( jQuery('<script src="/static/js/apps_adapter.js?v='+(new Date()).getTime()+'"></script>') );

            });
        }

        if (app.requires == 'full-state') {
            if (! this.utweb.current_client().everything_fetched) {
                console.log('getting ALL files and peers and settings... (this could take awhile :-)');
            }
            this.utweb.current_client().get_everything( got_everything );
        } else if (app.requires == 'peers') {
            this.utweb.current_client().get_all_peers( got_everything );
            // ladeda
        } else if (app.requires == 'files') {
            this.utweb.current_client().get_all_files( got_everything );
        } else {
            got_everything();
        }

        

    },
    get_current_app: function() {
        return this.app;
    },

    get_current_app_for_ns: function() {
        var app_ns = this.loading_app || this.app;
        if (! app_ns) { debugger; }
        return app_ns;
    },
    
    show: function() {
        // show the app iframe...
        //utweb.tables.torrent.view.visible(false);
        //utweb.tables.feeditem.view.visible(false);
        console.log('app made visible');
        uki('#vsplitpane').visible(false);
        uki('#btapp_container').visible(true);
    },
    remove: function() {
        this.app = null;
        jQuery('#app_iframe').remove();
        jQuery('#btapp_container').html('');
    },
    hide: function() {
        // the app continues to run in the background... should we
        // remove the iframe and such?

        uki('#vsplitpane').visible(true);
        uki('#btapp_container').visible(false);
        this.remove();
    },
    visible: function() {
        return uki('#btapp_container').visible();
    }
};

function CategoryPane(app) {
    var self = this;
    this.__name__ = 'CategoryPane';
    this.app = app;
    this.view = uki('#categories')[0];
    var evt = is_ipad ? 'touchstart' : 'mousedown';
    this.view.bind(evt, function() { self.changeSelection.apply(self, [true]); } );
    this.view.bind('keyup', function() { self.changeSelection.apply(self, [true]); } );
    this.feeds = this.getnode('category', 'Feeds' );
    this.labels = this.getnode('category', 'Labels' );
    this.apps = this.getnode('category', 'Apps' );
    this.torrent_root = this.getnode('category', 'Torrents');

    this.titles = { torrents: 'All Torrents',
                    labels: 'Labels',
                    nolabel: 'Torrents with no label'
                  };

/*
  // want to support dragging in torrents to apply a label
    uki(this.view).dragenter( function(e) {
        //e.preventDefault();
        console.log('item dragged into category pane');
    }).drop( function(e) {
        console.log('drop event');
    });
    */

    uki(this.view).dblclick( function(event) {
        var nodes = self.selectedNodes();
        if (nodes.length == 1 && nodes[0].feed && nodes[0].feed.__name__ == 'Feed') {
            var feed = nodes[0].feed;
            console.log('open up feed properties', feed);
            new FeedPreferences(self.app, feed);
        }
    });

}

CategoryPane.prototype = {
    /*
    selectedFeeds: function() {
        var indicies = this.view.selectedIndexes();
        var nodes = this.view.list().selectedRows();
        return _.filter(nodes, function() { node.feed !== undefined; } );
    },
    */

    get_toolbar_commands: function() {
        var commands = {};
        var _this = this;

        var nodes = this.selectedNodes();
        var feeds = [];
        _.each(nodes, function(node) { if (node.feed) { feeds.push(node.feed); } } );

        if (feeds.length > 0) {
            commands.remove = function() {
                // TODO: command_many
                _.each(feeds, function(feed) { feed.remove(); } );
            };

            commands.stop = function() {
                _.each(feeds, function(feed) { feed.disable(); } );
            };
            commands.start = function() {
                _.each(feeds, function(feed) { feed.enable(); } );
            };

        }

        return commands;

    },

    restore_expanders: function( categories ) {

        //console.log('restore expanders',categories);
        var self = this;
        // this isnt properly recursive
        if (categories) {

            _.each( categories, function(category,i) {
                setTimeout( function() {
                    var node = self.getnode('category', category );
                    var index = _.indexOf(self.view.listData(), node);
                    if (index != -1) {
                        self.view.open( index );
                    }
                }, update_ms*i);
            });
        }
    },

    getnode: function(key,value,nodes) {
        if (nodes === undefined) { nodes = this.view.data(); }
        // gets a node with a given key value pair
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];

            if ( _.contains( _.keys(node), key ) && node[key] == value ) {
                //console.log('found node',key,value);
                return node;
            }
            // also check in child nodes
            if ( _.contains( _.keys(node), 'children' ) ) {
                //console.log('checking child nodes');
                var node = this.getnode(key, value, node.children);
                if (node) {
                    return node;
                }
            }
        }
    },

    open_node: function(node) {
        var index = _.indexOf(this.view.listData(), node);
        if (index != -1) {
            this.view.open( index );
        }
    },

    select_node: function(node) {
        var index = _.indexOf(this.view.listData(), node);
        if (index != -1) {
            this.view.selectedIndexes( [index] );
        }
    },

    selectedNodes: function() {
        // gets the current selected nodes
        var listdata = this.view.listData();
        var nodes = _.map(this.view.selectedIndexes(),
                          function(idx) {
                              var node = listdata[idx];
                              if (! node) { console.log('selected node null'); }
                              return  node || {};
                          }
                         );
        return nodes;
    },

    changeSelection: function(clearselection) {
        if (window.console && console.log)
        this.app.toolbar.set_target(this, true);

        var self = this;
        if (clearselection) {
            this.app.tables.torrent.view.list().clearSelection();
            this.app.tables.feeditem.view.list().clearSelection();
        }
        var previous_state = { torrent: this.app.selectedTorrent() };
        var nodes = this.selectedNodes();

        if (nodes && nodes.length > 0) {
            var node = nodes[0]; // todo: support multiple category
            // selection
            if (node.category == 'Apps') {
                if (! (config.cookies && config.cookies.store_app)) { return; } // disable store app for now
                var store_app = this.app.current_client().app.get("http://apps.bittorrent.com/store/store.btapp");
                if (store_app) {
                    node.app = store_app;
                }
            }

            if (! node.app) {
                utweb.tables.app.hide();
            }
            
            if (node.feed || node.category == 'Feeds') {
                eventTracker.track('WebUI', 'SidebarFeedClick');
                this.app.tables.torrent.view.visible(false);
                this.app.tables.feeditem.view.visible(true);

                if (node.feed) {
                    // toolbar actions for delete feed item
                    nodes = this.view.selectedRows(); // ????
                    var feeds = _.map(nodes, function(node) { return node.feed; });
                }
            } else if (node.app) {
                eventTracker.track('WebUI', 'SidebarAppClick', {'label': node.app.name});
                utweb.tables.app.set_app(node.app);
            } else {
                if (node.status)
                  eventTracker.track('WebUI', 'SidebarStatusClick', {'label': node.status});
                else if (node.category && "Labels" == node.category)
                  eventTracker.track('WebUI', 'SidebarLabelClick');
                this.app.tables.torrent.view.visible(true);
                this.app.tables.feeditem.view.visible(false);
            }

            


            setTimeout( function() {
                // todo: make this more sane ... 

                if (node.label !== undefined) {
                    // this is a label item...

                    self.app.tables.torrent.applyFilter(node.label);

                } else if (node.feed) {

                    self.app.tables.feeditem.showFeed(node.feed);
                    self.app.tables.feeditem.current_filter = { feed: node.feed };

                } else if (node.category == 'Feeds') {

                    // show every feed item for all feeds

                    self.app.tables.feeditem.showAllFeeds();
                    self.app.tables.feeditem.current_filter = { all_feeds: true  };

                } else if (node.category == 'Labels') {

                    // show everything
                    self.app.tables.torrent.applyFilter( { status: 'All' } );

                } else if (node.category == 'Apps') {

                    // dont do nuthin special cuz node has app

                } else if (node.status) {

                    // basic torrent status
                    self.app.tables.torrent.applyFilter(node);

                }

            }, 1 ); // dont redraw right away... (lets the category
            // pane update before the torrent list updates...)



        }
    },

    updateCounts: function() {
        // updates the numbers near the basic torrent status filters

        // XXX need to fix so that it doesn't break when there's no torrent data yet

        var self = this;
        var torrent_category = self.app.tables.category.getnode('category', 'Torrents');
        torrent_category.data = icon_and_text(torrent_category.icon, locale(torrent_category.localized) + ' (' + self.app.current_client().torrent.category_counts['All'] + ')', this.titles.torrents);

        _.each(torrent_category.children,
               function(status_node) {
                   var title = locale(status_node.localized) + ' ' + locale('STM_TORRENTS');
                   if (status_node.status) {
                       var str = icon_and_text(status_node.icon, locale(status_node.localized) + ' (' + self.app.current_client().torrent.category_counts[status_node.status] + ')', title);
                       status_node.data =  str;
                   }
               }
              );
    },

    redraw: function() {
        var selected = this.view.selectedIndexes();
        this.view.data( this.view.data() ); // updates view
    },
    
    updateLabels: function() {
        var self = this;
        var node = this.labels;
        var icon = 'label';

        node.data = icon_and_text(icon, locale('ML_LABEL'), this.titles.labels); // XXX: client does not send multi labels/hidden torrents. needs client fix

        node.children = [];

        var nolabel_count = 0;
        _.each( self.app.current_client().torrent.all(), function(torrent) {
            if (torrent.label == '') { nolabel_count += 1; }
        });

        var rendered = icon_and_text(icon, locale('OV_CAT_NOLABEL') + ' (' + nolabel_count + ')', this.titles.nolabel);
        var nolabel = self.app.current_client().label.nolabel;
        node.children.push( { data: rendered,
                              label: nolabel }
                          );

        self.app.current_client().label.all( function(labels) {
            //node.data = 'Labels (' + _.keys(labels).length + ')';

            _.each( labels, function(label) { 
                var title = label.name;
                var rendered = icon_and_text(icon, label.name + ' (' + label.contains + ')', title);
                var item = { data:  rendered,
                             label: label
                           };
                //Removing this hack for now as the client shows a Hidden Label
                //if (title != 'Hidden') { // XXX: hack
                    node.children.push( item );
                //} 
            } );
        } );

    },

    updateFeeds: function() {
        var self = this;
        var node = this.feeds;
        node.data = icon_and_text('feed', locale('Feeds')+ ' (' + self.app.current_client().feed.keys().length + ')', 'View all feed items');
        node.children = [];

        _.each( self.app.current_client().feed.all(), function(feed) {
            var num_items = _.keys(feed._items).length;
            var title = '';
            if (feed.isSubscribed()) {
                var icon = 'feed_favorite';
                var title = 'Subscribed';
            } else if (num_items == 0) {
                var icon = 'feed_error';
                var title = 'Error with this feed';
            } else if (feed.enabled) {
                var icon = 'feed';
                var title = 'Active feed ' + feed.get_name();
            } else {
                var icon = 'feed_2';
                var title = 'Inactive feed ' + feed.get_name();
            }
            var rendered = icon_and_text(icon, feed.get_name() + ' (' + num_items + ')', title);
            var item = { data: rendered,
                         feed: feed
                       };
            //return item;
            node.children.push( item );
        } );
    },

    updateApps: function() {
        var _this = this;
        var node = this.apps;
        if (node) {

            this.app.current_client().app.installed_apps( function(apps) {
                //node.data = icon_and_text('apps','Apps ('+ (client.app.get_installed_count()) +' installed)');
                node.data = icon_and_text('apps','Apps');
                node.children = _.map( apps, function(app) {
                    var icon = 'bittorrent';
                    var title = app.name;
                    return { data: app_icon_and_text(app.get_icon(), title),
                             app: app };
                });
            });
        }


    }

}


function FeedItemTable(app) {
    var self = this;
    this.__name__ = 'FeedItemTable';
    this.app = app;
    this.view = uki('#FeedItems')[0];
    this.loader = uki('#Torrents_loading');

    uki(self.view.list()).dblclick( function(event) {
      var feeditem = self.view.selectedRow();
      if (feeditem) {
        if (feeditem.__name__ == 'Torrent') {
          var torrent = feeditem;          
        } else {
          var torrent = feeditem.get_torrent();
        }
        if (torrent) {
          self.app.tables.torrent.open_torrent_properties( [torrent] );
        } else {
          feeditem.add();
        }
      }
    });

    SortableHideableTable.apply(this, [this.view, display_columns.feeditem]);


}
FeedItemTable.prototype = {};
_.extend(FeedItemTable.prototype, SortableHideableTable.prototype);
_.extend(FeedItemTable.prototype, {

    get_toolbar_commands: function() {
        var feeditems = this.view.selectedRows();
        var torrents = [];
        var _this = this;
        _.each(feeditems, function(item) {
            if (item.__name__ == 'Torrent') {
                var t = item;
            } else {
                var t = item.get_torrent();
            }
            if (t) { torrents.push(t); }
        });

        if (torrents.length > 0) {
            return _this.app.tables.torrent.get_toolbar_commands(torrents);
        } else {
            var commands = {};
            commands.start = function() {
                
                _.each( feeditems, function(item) { item.add(); } );
                //self.client.feed.command_many( hashes ... );

            };
            return commands;
        }

    },

    filterData: function(data) {
        return data;
    },

    getData: function() {
        if (this.current_filter.feed) {
            return this.current_filter.feed.data(true);
        } else if (this.current_filter.all_feeds) {
            var all = _.reduce( this.app.current_client().feed.all(), function(sofar, feed) { return sofar.concat( feed.data() ); }, [] );
            return all;
        }
    },

    itemAdded: function(newitem) {
        console.log('feed table added', newitem);
        var self = this;
        if (self.view.visible()) {
            var viewdata = self.view.data();
            var found, index;
            _.each(viewdata, function(item, i) {
                //console.log('test',item)
                if (item.url == newitem.url && item.feed_id == newitem.feed_id) { 
                    found = item;
                    index = i;
                    _.breakLoop();
                }
            });
            if (found) {
                self.view.redrawRow(index);
            }
        }
    },

    changeSelection: function(redraw) {
        this.app.toolbar.set_target( this, true );
        this.app.switchtab( this.app.active_tab, redraw );
    },

    showFeed: function(feed) {
        var self = this;
        this.view.data( feed.data(true) );
        this.view.list().layout();
    },

    showAllFeeds: function() {
        var self = this;
        var all = _.reduce( self.app.current_client().feed.all(), function(sofar, feed) { return sofar.concat( feed.data() ); }, [] );
        this.view.data( all );
        this.view.list().layout();
    }
});


/*

Explanation of how labels are used in uTorrent Remote:

So with a response from the client comes an object with a list of all labels(primary or not) used by any torrent and a list of torrents.
Each torrent in the list of torrents has a label attribute that contains the primary label used for that torrent.

Therefore the only way to tie a label to a torrent is through the primary label. Although we are given a list of all labels used,
we have no way of finding the corresponding torrents that use those labels. The torrent list however provides us with a torrent and
the primary label it uses.

Because of this, Remote's label functionality is 98% primary label only. When filtering by labels, it filters via the primary label. 
If the secondary labels were used here and a secondary label was chosen that was not used as a primary label for any of the torrents
nothing would be shown. This is because we can only see the primary label used by any torrent so it makes no sense to try and fliter
by anything else.

Because the API only allows you to set the primary label this is all that is done. The one place that secondary labels are used is
in the list of labels currently in use that are recommendations for re labeling a torrent. This would prevent a user from accidently re creating
a label that is similar but slightly different to one of the secondary labels already in existence.
*/

function Toolbar(app) {
    var self = this;
    this.app = app;
    this.view = uki('#Toolbar')[0];
    if (! this.view) { throw Error('error initializing toolbar'); }
    var evt = is_ipad ? 'touchstart' : 'mousedown';
    
    if (self.app.filereader._native) {
      // when toolbar is initialized, the elements dont actually exist yet :-( (attach_view has not been called)
    } else if (! config.webui) {
        uki('#toolbar_torrent_add', this.view)[evt]( function(event) {

        if (config.utweb && config.build != "embedded") {
            // TODO -- DETECT IE FLASH NOT INSTALLED AND MESSAGE THAT FILE UPLOAD NOT AVAILABLE UNTIL IT'S INSTALLED
            eventTracker.track('WebUI', 'ToolbarClick', {'label': 'upload'});
            if (event.which == 1) {
                var popup = new PopupWindow(RC(jQuery(window).width()/2 - 200, jQuery(window).height()/2 - 200, 400, 100), 
                                            '<div id="browse_add_torrent"></div>', "<h2>Upload Torrent</h2>");
                jQuery('#browse_add_torrent').html( 'Please install flash to upload encrypted files.' );
            }
        } else {
            // pop up the file upload dialog... (or with the download
            // location thing? nah...)
            if (event.which == 1) {
                var form_action = '/gui/?action=add-file&download_dir=0&path=&token=' + self.app.current_client().raptor.api.token;

                window.file_upload_popup = new PopupWindow(RC(jQuery(window).width()/2 - 200, jQuery(window).height()/2 - 200, 400, 160), 
                                            '<div id="browse_add_torrent"><form onsubmit="return utweb.uploaded_torrent();" target="hidden_upload_iframe" method="POST" action="'+form_action+'" enctype="multipart/form-data"><input type="hidden" name="action" value="add-file" /><input type="file" name="torrent_file" /><input type="submit" value="Upload" /></form></div>', "<h2>Upload Torrent</h2>");

            }

        }

      });
    } else {

        uki('#toolbar_torrent_add', this.view)[evt]( function(event) {
            if (event.which == 1) {
                eventTracker.track('WebUI', 'ToolbarClick', {'label': 'torrent_add'});
                utWebUI.getDirectoryList(null, function() { 
                    utWebUI.showAddTorrent();
                });
            }
        });
        
    }

    uki('#toolbar_preferences', this.view)[evt]( function(event) {
        if (event.which == 1) {
            eventTracker.track('WebUI', 'ToolbarClick', { 'label' : 'preferences' });
            console.log('loading settings pane.... please wait');

            self.app.current_client().raptor.post_raw( 'action=getsettings', {}, function(json) {
                utWebUI.addSettings(json);
                utWebUI.loadSettings();
                utWebUI.showSettings();
            });
        }
    });

    uki('#toolbar_torrent_add_url', this.view)[evt]( function(event) {
        if (event.which == 1) {
            eventTracker.track('WebUI', 'ToolbarClick', {'label': 'torrent_add_url'});
            utWebUI.getDirectoryList(null, function() { 
                                         utWebUI.showAddURL(); 
                                     } );
        }
    });

    uki('#toolbar_feed_add', this.view)[evt]( function(event) {
        if (event.which == 1) {
            eventTracker.track('WebUI', 'ToolbarClick', {'label': 'feed_add'});
            // utWebUI.showRSSDownloader();
            utWebUI.showAddEditRSSFeed();
        }
    });
    
    var more_actions_select = uki('#toolbar_more_actions', this.view);
    
    (function() {
        var old_toggle = more_actions_select[0]._popup.toggle;
        more_actions_select[0]._popup.toggle = function() {
            old_toggle.call(this);
            utweb.toolbar.update_more_actions();
        };
    })();
    
    more_actions_select[0].disable();
    
    more_actions_select[0].text(locale("ML_MORE_ACTIONS"));

    more_actions_select[0].bind('change', function(params) {
        var action = params.value.value;
        var fun = undefined;
        if (self.valid_more_actions) {
            fun = self.valid_more_actions[action];
        }
        if (fun) {
            fun(params.value);
        }
    });
    
    var max_label_characters = 12;
    
    more_actions_select[0].bind('toggle', function(params) {
        if(this._visible) {
            self.app.current_client().label.all( function(labels) {
                //Labels is an array with object with a properties name
                //This clears out the drop down menu if its been opened
                var label_list = more_actions_select[0]._options[3].children;
                if (label_list.length > 1) {
                    label_list.splice(1, label_list.length-1);
                }
                
                //Unindent everything
                _.each( labels, function(label) {
                    var name = jQuery.trim(label.name);
                    var short_name = name;
                    if (name.length > (max_label_characters + 1)) {
                        short_name = name.substr(0, max_label_characters) + '…';
                    }
                    if (name) {
                        label_list[ label_list.length ] = {value: 'set_label', full_label: name, data: short_name, __indent: 1};
                    }
                });
                
            });
        }
    });

    var popup = more_actions_select[0]._popup;
    more_actions_select[0]._list.bind('open', function(e) {
        _.defer(function () {
            if (popup.visible()) {
                //Grey out all disabled actions again because this drop down is redrawn
                utweb.toolbar.update_more_actions();
                
                var torrents = window.utweb.tables.torrent.view.selectedRows();
                var select_label = (torrents && torrents.length) ? torrents[0].label: undefined;
                _.each(torrents, function(t) {
                    if (t.label !== select_label) {
                        select_label = undefined;
                    }
                });  
                select_label = jQuery.trim(select_label);
            
                //Now loop through all the labels and put a class on the right div
                var divs = popup._dom.children[1].children[0].children;
                //I start at 3 because I want to skip over the drop down elemnts like Force Check..
                var index_where_labels_start = 5;
                var cur_label = 1;
                var label_options = more_actions_select[0]._options[3].children;
                for(var cur_div = index_where_labels_start; cur_div < divs.length; cur_div++) {
                    var cur = divs[cur_div];
                    var curText = (cur.innerText === undefined) ? cur.textContent : cur.innerText;
                    if (label_options[cur_label].full_label === select_label) {
                        jQuery(cur).addClass("checked_label");
                    }
                    cur_label++;
                }  
            }
        });
    });

    this.items = ['remove','start','pause','stop','up','down','share'];

    this.more_action_items = ['ml_force_recheck', 'ml_force_start', 'ml_properties'];

    this.strings = { 'torrent_add': 'OV_TB_ADDTORR',
		             'torrent_add_url': 'OV_TB_ADDURL',
		             'feed_add': 'OV_TB_RSSDOWNLDR',
                     'remove':'ML_REMOVE',
                     'start':'ML_START',
                     'pause':'ML_PAUSE',
                     'stop':'ML_STOP',
                     'up':'ML_QUEUEUP',
                     'down':'ML_QUEUEDOWN',
                     'share':'share',
                     'preferences':'DLG_SETTINGS_00' };

    var _this = this;

    _.each( this.items, function(item) {
        var uki_item = uki('#toolbar_' + item, _this.view);
        uki_item[evt]( function(event) {
            eventTracker.track('WebUI', 'ToolbarClick', {'label': item});
            if (!uki_item[0].disabled()) {
                var fun = _this.commands[item];
                if (fun) {
                    fun();
                }
            }
        });
    });
}
Toolbar.prototype = {
    loaded_file: function(data) {
        var url_encoded = 0;
        this.app.current_client().raptor.post({ action: 'add-file', p: 1, uu: url_encoded}, {torrent_file: data}, this.uploaded_file);
    },
    uploaded_file: function(res) {
        console.log('file uploaded success',res);
    },
    bind_stuff: function() {
		var _this = this;
  		this.update_titles();
	  
      	jQuery('#upload_file_selection').change( function(evt) {
			console.log('file selected!');
			var files = evt.target.files; // FileList object

			// files is a FileList of File objects. List some properties.
			var output = [];
			for (var i = 0, f; f = files[i]; i++) {
				output.push('<li><strong>', f.name, '</strong> (', f.type || 'n/a', ') - ',
				f.size, ' bytes</li>');
				_this.app.filereader.register(f, _.bind(_this.loaded_file, _this));
			}
			console.log( output.join('') );
      	});
    },
	
	update_more_actions_titles: function()
	{
		var more_actions_select = uki('#toolbar_more_actions')[0];
		more_actions_select.text(locale("ML_MORE_ACTIONS"));
		for(var row, i = 0, length = more_actions_select._options.length; i < length; i++)
		{
			row = more_actions_select._options[i];
			row.data = locale((row.value || "ML_LABEL").toUpperCase());
			more_actions_select._list.redrawRow(i);
			
			if(row.children)
			{
				for(var child, j = 0, length_2 = row.children.length; j < length_2; j++)
				{
					child = row.children[j];
					if(child.value == "ov_new_label")
					{
						child.data = locale(child.value.toUpperCase());
					}
				}				
			}
		}
	},
	
    update_more_actions: function() {
        
        var _this = this;

        var more_actions_select = uki('#toolbar_more_actions')[0];
        //Get all valid actions for the selected torrents
        //then iterate through all the more actions options and
        //enable or disable the right ones

        if(this.valid_more_actions) {
            var options_before_labels = 3;
            for (var i = 0; i < options_before_labels; i++) {
                var action_option = more_actions_select._options[i];
                if (_this.valid_more_actions[action_option.value]) {
                    //Enable
                    more_actions_select._list.enable_row(i);
                }
                else {
                    //Disable
                    more_actions_select._list.disable_row(i);
                }
            }
        }

        //Set the text back to the More Actions text after selecting a value
        more_actions_select.text(locale("ML_MORE_ACTIONS"));
    },

    update: function() {
        // uses the toolbar's current target and asks for the current
        // valid commands for that target, then updates the buttons
        // and their actions accordingly.

        // bug: this is updating twice very fast on a changeselection that
        // needs new data (i.e. file pane open)
        var _this = this;
        
        if (this.target && this.target.get_more_actions_commands) {
            this.valid_more_actions = this.target.get_more_actions_commands();
        } else {
            this.valid_more_actions = null;
        }
        
        if( this.valid_more_actions) {
            var torrent = this.app.selectedTorrent();
            var more_actions_select = uki('#toolbar_more_actions')[0];
            more_actions_select[torrent ? 'enable' : 'disable']();
        }

        if (this.target) {
            this.commands = this.target.get_toolbar_commands();
        } else {
            this.commands = {};
        }

        _.each( this.items, function(item) {

            if (_this.commands[item]) {
                var uki_item = uki('#toolbar_' + item);
                if (uki_item.disabled()) {
                    uki_item.disabled(false);
                    jQuery(uki_item.dom()).fadeTo('fast',1);
                }
            } else {
                var uki_item = uki('#toolbar_' + item);
                if (! uki_item.disabled()) {
                    uki_item.disabled(true);
                    jQuery(uki_item.dom()).fadeTo('fast',0.2);
                }
            }
        });        
    },

    update_titles: function() {
        _.each( this.strings, function(localized, key) {
            jQuery('#toolbar_' + key).attr('title', locale( localized ));
        });
    },

    set_target: function(target, update) {
        this.target = target;
        if (update) { this.update(); }
    }
};

function GeneralPane(app) {
    this.app = app;
    this.numcols = 3;

    this.sections = [ { cols: 3, 
                     items: [
'size','uploaded','downloaded','progress','down_speed','up_speed','availability','eta','seeds','peers','ratio','Added','completed_on','Source','label'
//'ratio','down_speed','up_speed'
                     ] },
                   { cols: 2,
                     items: [
'name', 'download_url','rss_feed_url','hash'
//'download_url','hash'
                     ] } ];

    this.fonth = 12;
    var labels = [];
    var vsplit = uki('#vsplitpane')[0];
    var parenth = vsplit._panes[1].rect().height;
    var parentw = vsplit._panes[1].rect().width;
    this.parent = vsplit._panes[1];
    this.margin = 5;
    this.padding = 20;
    this.vpadding = 10;
    var k = 0;
    for (var j=0; j<this.sections.length; j++) {
        var numcols = this.sections[j].cols;
        var items =  this.sections[j].items;
        var ybegin = (j>0) ? (this.sections[j-1].maxy + this.fonth*2) : 0;
        this.sections[j].maxy = 0;

        for (var i=0; i<items.length; i++) {
            var r = this.getRect(ybegin, parentw, i, k, numcols);
            k++;
            labels.push( { view: 'Label', html: '', rect: r, anchors: 'top left' } );
            this.sections[j].maxy = Math.max(r.y, this.sections[j].maxy);
        }
    }

    this.view = uki( labels );
    attachto = uki('#detail_pane_general');
    this.view.attachTo( attachto[0].dom() );
    var _this = this;
    uki('#detail_pane_general', uki_view).bind('resize', function(event) {
                                                   if (true || utweb.active_tab == 'general') {
                                                       _this.resizeLabels();
                                                   }
                              });
}

GeneralPane.prototype = {
    getRect: function(ybegin, parentw, i, k, numcols) {
        var r = new uki.geometry.Rect( this.margin + this.padding + i%numcols * Math.floor((parentw - this.margin*2) / numcols), 
                                       ybegin + this.margin + Math.floor((i/numcols))*(this.fonth + this.vpadding), 
                                       Math.floor((parentw - this.margin*2 - this.padding) / numcols - this.padding*2), 
                                       this.fonth+ this.vpadding );
        return r;
        
    },
    resizeLabels: function() {
        var vsplit = uki('#vsplitpane')[0];
        var parenth = this.parent.rect().height;
        var parentw = this.parent.rect().width;


        var k=0;
        for (var j=0; j<this.sections.length; j++) {
            var numcols = this.sections[j].cols;
            var items =  this.sections[j].items;
            var ybegin = (j>0) ? (this.sections[j-1].maxy + this.fonth*2) : 0;
            this.sections[j].maxy = 0;

            for (var i=0; i<items.length; i++) {
                var label = this.view[k];
                k++;
                label._style('overflow','hidden');
                var r = this.getRect(ybegin, parentw, i, k, numcols);
                label.rect( r );
                this.sections[j].maxy = Math.max(r.y, this.sections[j].maxy);
            }
        }
    },
    updateLabels: function(torrent) {
        var k=0;
        for (var j=0; j<this.sections.length; j++) {
            //var numcols = this.sections[j].cols;
            var items =  this.sections[j].items;

            for (var i=0; i<items.length; i++) {
                var torcol = display_columns.torrent[ display_column_lookup.torrent[items[i]] ];
                var label = this.view[k];
                k++;
                var r = this.view[i].rect();
                //r.width = Math.floor((this.parent.rect().width - this.margin*2) / numcols - this.padding*2);
                //this.view[i].rect( r );
                if (torcol.name == 'hash') {
                    // brett wants infohash to not be linked
                    var val = torrent ? torrent[torcol.name] : '';
                } else {
                    var val = torrent ? (torcol.formatter ? torcol.formatter(torrent, r, 0, true) : torrent[torcol.name]) : '';
                }
                if (torcol.localized_filter) {
                    var key = torcol.localized_filter( locale(torcol.localized) );
                } else {
                    var key = (torcol.localized ? locale(torcol.localized) : torcol.name);
                }
                if (!val || label._lastval != val) { 
                    var selectable = torcol.name == 'hash';
                    var html = '<span style="background: #fff; position:absolute; padding-right: 2px;">' + key + (key[key.length-1]==':'?'':':') + '</span><span style="'+(selectable?uki.browser.cssUserSelect()+':text; ':'')+'float:right; padding-left:4px;">' + (val ? val: '') + '</span>';
                    label.html( html );
                }
                label._lastval = val;
            }
        }
    },
    draw: function() {
        var torrent = this.app.selectedTorrent();
        this.updateLabels(torrent);

    }
}


function TorrentTable(app) {
    var self = this;
    this.__name__ = 'TorrentTable';
    this.app = app;
    this.view = uki('#Torrents')[0];
    this.index = { hash: {} }; // index for current view
    this.loader = uki('#Torrents_loading');

    uki(self.view.list()).dblclick( function(event) {
        var torrent = self.view.selectedRow();
        if (torrent) {
            self.open_torrent_properties( [torrent] );
        }
    });


    uki(self.view.list()).contextmenu( function(event) {
        var torrent = self.app.selectedTorrent();
        if (torrent && torrent.context_menu_items().length > 0) { // TODO:
            // memoize context_menu_items()
            event.preventDefault(); // prevent browser context menu
        }
    });


    uki(self.view.list()).mouseup( function(event) {
        // torrent context menu
        var torrent = self.app.selectedTorrent();
        
        if (event.which == 3) {
            if (torrent) {
                var items = torrent.context_menu_items();
                items.push({'label':locale('Share this torrent'), 'callback': function() {app.share();}});                
                items.push({'label':locale('ML_PROPERTIES'), 'callback': function() {self.open_torrent_properties([torrent]);}});
                if (items.length > 0) {
                    new UTContextMenu( { app: self.app, event: event, items: items } );
                }
            }
        }
    });

    /*
    uki(self.view).dragstart( function(e) {
        console.log('torrent item drag start');
        console.log(e);
        e.dataTransfer.setDragImage(uki.createElement('div', 'background:blue;width:20px;height:20px'), 5, 5);
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', 'test');
    });
    */

    SortableHideableTable.apply(this, [this.view, display_columns.torrent]);
}

TorrentTable.prototype = {};
_.extend(TorrentTable.prototype, SortableHideableTable.prototype);
_.extend(TorrentTable.prototype, {
    open_torrent_properties: function(sel) {
        // only supports single torrent prop (sel.length == 0)
        var self = this;
        console.log('opening torrent properties');

        function got_props(json) {
            // setup label editing

            //Not needed now that tags are not editable in the properties window
            //var torrent = sel[0];
            //var val = jQuery('#torrent_props_label').val( torrent.label );
            
            utWebUI.loadProperties(json);
        }
        var hashes = _.map(sel, function(t) { return t.hash; } );
        this.app.current_client().raptor.post_raw( 'action=getprops', { hash: hashes }, got_props );
        return;


        function props_received(props) {
            var div = jQuery('#dlgProps');
            var w = 450;
            var h = 434;
            var left = jQuery(window).width()/2 - w/2;
            var top = jQuery(window).height()/2 - h/2;
            var stylestr = 'position: absolute; left: '+left+'px; top: '+top+'px';
            div.setStyle('left',left);
            div.setStyle('top',top);
            self.app.legacy_dialog_manager.updateProperties(sel);
            div.show();
        }

        self.app.current_client().setting.all(function() { // TODO: make it
            // so torrent properties doesnt depend on client
            // settings being loaded...
            if (! self.app.legacy_dialog_manager) {
                self.app.legacy_dialog_manager = new legacy_dialog_manager(self.app);
            }

            self.app.current_client().raptor.post( { action: 'getprops' }, { hash: hashes }, props_received );
            
        });

    },
    get_more_actions_commands: function(torrents) {
        var _this = this;
        var self = this;
        var commands = {};
        torrents = torrents ? torrents : this.view.selectedRows();
        if (torrents.length > 0) {
            var hashes = _.map(torrents, function(t) { return t.hash; });
            
            commands.ov_new_label = function() {
                window.utWebUI.showAddLabel();
            };
            
            commands.set_label = function(selected) {
                var cur_label = torrents[0].label;
                for(var i = 1; i < torrents.length; i++) {
                    if(torrents[i].label !== cur_label) {
                        cur_label = undefined;
                    }
                }

                if (cur_label !== undefined && cur_label == selected.data) {
                    _.each( torrents, function(t) { 
       			       self.app.current_client().torrent.client.raptor.post_raw( "action=setprops&s=label&v=", { hash: t.hash }, function() {} );
                    });
                } else {                
                    _.each( torrents, function(t) { 
                        var after_update = function() {
                            self.app.current_client().torrent.client.raptor.post_raw( "action=setprops&s=label&v="+selected.full_label, { hash: t.hash }, function() {} );
                        }
       			       self.app.current_client().torrent.client.raptor.post_raw( "action=setprops&s=label&v=", { hash: t.hash }, after_update );
                    });
                }
            };                        
            
            commands.ml_properties = function() {
                var torrent = self.view.selectedRow();
                if (torrent) {
                    self.open_torrent_properties( [torrent] );
                }
            };
            
            if (_.some( torrents, function(t) { return ! _.contains(t.status_array, 'started') && ! _.contains(t.status_array, 'queued'); })) {
                commands.ml_force_recheck = function() {
                    self.app.current_client().torrent.command_many( hashes, { action: 'recheck' } ); 
                };
            }
            
            if (_.some( torrents, function(t) { return ! _.contains(t.status_array, 'started') || _.contains(t.status_array, 'queued'); })) {
                commands.ml_force_start = function() {
                    self.app.current_client().torrent.command_many( hashes, { action: 'forcestart' } ); 
                };
            }
            
        }
        return commands;
    },
    get_toolbar_commands: function(torrents) {
        var _this = this;
        var self = this;
        var commands = {};
        torrents = torrents ? torrents : this.view.selectedRows();
        if (torrents.length > 0) {
            var hashes = _.map(torrents, function(t) { return t.hash; });

            // do some fancy checking to not allow queue up if the
            // selection contains all the highest priority
            // items... (same for queue down)
            commands.up = function() { 
                self.app.current_client().torrent.command_many( hashes, { action: 'queueup' } );
                //_.each(torrents, function(torrent) { torrent.queueup(); });
            };
            commands.down = function() { 
                // Must sort hashes based on queue order before queue-ing down. 
                // Since it is possible to un-do a group-queuedown if done in the wrong order.
                var sorted_torrents = torrents.sort(function(a,b) {
                    return b.queue_position - a.queue_position})
                var sorted_hashes = _.map(sorted_torrents, function(t) { return t.hash; });
                _.each(sorted_hashes, function(hash) {
                    self.app.current_client().torrent.command_many(hash, {action: 'queuedown' } );
                    } );
            };
            
            if (_.some( torrents, function(t) { return ! _.contains(t.status_array,'started') && ! _.contains(t.status_array,'queued') 
                || _.contains(t.status_array, 'paused'); })) {
                commands.start = function() {
                    self.app.current_client().torrent.command_many( hashes, { action: 'start' } );
                };
            }
            if (_.some( torrents, function(t) { return _.contains(t.status_array, 'started') || _.contains(t.status_array,'queued'); })) {
                commands.stop = function() {
                    self.app.current_client().torrent.command_many( hashes, { action: 'stop' } );
                };
            }
            if (_.some( torrents, function(t) { return _.contains(t.status_array, 'started') && ! _.contains(t.status_array, 'paused'); })) {
                commands.pause = function() {
                    self.app.current_client().torrent.command_many( hashes, { action: 'pause' } );
                };
            }
    
            commands.remove = function() {
				jQuery('.count', '#dlgDelete-caption').text(torrents.length);
				jQuery('.plural', '#dlgDelete-caption').toggle(torrents.length > 1);
				DialogManager.show('Delete');
        jQuery('#dlgDelete-head').text(locale('ML_DELETE_TORRENT'));
        jQuery('#dlgDelete-caption').text(locale('OV_CONFIRM_DELETEDATA_ONE'));
        jQuery('label[for="dlgDelete-no-data"]').text(locale('ML_DELETE_TORRENT'));
        jQuery('label[for="dlgDelete-data"]').text(locale('ML_DELETE_DATATORRENT'));
                // function onconfirm( options ) {
                //     _this.remove_torrents( torrents, options );
                // }
                // _this.app.torrent_delete_confirmation_dialog('Are you sure you want to remove ' + torrents.length + ' torrents?', onconfirm);
            };

            if (torrents.length == 1) {
                commands.share = function() {
                    _this.app.share();
                };
                if (torrents[0].message == "Error: Files missing from job. Please recheck.") {
                    commands.start = function() {
                        torrents[0].recheck();
                    };
                }
            }
        }
        return commands;
    },

    remove_torrents: function( torrents, options ) {
        // TODO: make use command_many
        console.warn(options);
        if (options.delete_data) {
            console.log('deleting',torrents,'and data');
            _.each( torrents, function(t) { t.removedatatorrent(); });
/*
// no client support for removing only the data
        } else if (options.keep_torrent) {
            // just delete the torrent data
            console.log('deleting',torrents,'only data');
            _.each( torrents, function(t) { t.removedataonly(); });
*/
        } else {
            // normal delete -- just delete the torrent
            console.log('deleting',torrents);
            _.each( torrents, function(t) { t.removetorrent(); });
        }
    },
    getData: function() {
        if (this.app.current_client().torrent.fetched) {
            return this.app.current_client().torrent.all();
        }
    },
    changeSelection: function(redraw) {
        this.app.toolbar.set_target(this, true);


        var self = this;
        setTimeout( function() {
            self.app.switchtab( self.app.active_tab, redraw );
        }, 1);
    },

    filterData: function(data, status) {
        return _.filter(data, function(torrent) { return torrent.matchesCategory(status); } );
    },

    applyFilter: function(filter) {
        this.loader.visible(false);
        this.view.visible(true);
        this.current_filter = filter;
        this.draw(true);
    }

});




function UTContextMenu(kwargs) {
    function getLengthInBytes(string) {
      var b = string.match(/[^\x00-\xff]/g);
      return (string.length + (!b ? 0 : b.length));
    }

    var self = this;
    this.__name__ = 'UTContextMenu';
    this.app = kwargs.app;

    //var attachTo = kwargs.attachTo.dom() || window;
    var attachTo = window;
    var items = kwargs.items;
    var event = kwargs.event;
    var font_h = 12;
    var w = font_h/2 * _.reduce( items,
                           function(curmax, item) { 
                            if (item === null) {
                              return curmax;
                            }
                               var item_width = getLengthInBytes(item.label);
                               return Math.max(curmax, item_width); 
                           }, 
                           20 );

    var padding = 6;
    var layout = { view: 'Box', visible: false, background: '#fff', style: { border: '1px solid grey' },
                   childViews: [

                   ] };

    var cur_y = padding;

    _.each(items, function(item,i) {
        if (item == null) { // divider
            var divider_h = 8;
            var itemlayout = { view: 'Label', rect: RC(padding, cur_y, w, divider_h), 
                               backgrond: '#123', visible: false
                             };
            cur_y += divider_h;
        } else {
            var callback = item.callback;
            // want to support refresh along with the action (or after
            // the action)
            var itemlayout = { view: 'Label', rect: RC(padding, cur_y, w, font_h + padding), 
                               callback: callback,
                               html: item.html || item.label  // should grab
                               // the localized string
                             };
            if (callback == null) {
                itemlayout.style = { color: '#ccc' };
            }
            cur_y += font_h + padding;
        }
        layout.childViews.push( itemlayout );
    });

    if (! event.clientX) { event.clientX = 0; event.clientY = 0; } // IE9 problem with contextmenu event, or in case browser does not give position information

    // xxx: now that the header has a z-index above us, we need to push it down
    // cur_y is the accumulated height

    if ( (event.clientY + cur_y + font_h) > jQuery(window).height() ) {
        // todo: figure out if we can lay it out nicer
        layout.rect = RC(event.clientX, dims.header_height, w + padding*2, cur_y + padding);
    } else {
        layout.rect = RC(event.clientX, event.clientY, w + padding*2, cur_y + padding);
    }

    

    var view = uki(layout);


    uki('Label', view).mouseenter( function(event) {

        event.source.style( { background: '#abc' } );

    });

    uki('Label', view).mouseleave( function(event) {

        event.source.style( { background: '' } );
    });

    uki('Label', view).click( function(event) {
        event.stopPropagation();
        event.cancelbubble = true;

        if (event.source.callback) {
            event.source.callback(); // want to stick in current
            // torrent or whatnot...
        } else {
            console.log('no action defined for context menu action');
        }
        uki.destroy( self.view );
    });

    view.attachTo(attachTo);

    this.view = view[0];
    this.app.registerContextMenu(this);

    setTimeout(function() {
        self.view.visible(true); // for some reason doing this right
        // away causes the browser context menu to appear...
    },1);
    
}

function FeedPreferences(app, feed) {
    this.feed = feed;
	utWebUI.showAddEditRSSFeed(feed.ident);
	return;
	
    //var str = JSON.stringify(this.feed); //('La dee da?!!';

    // var str = feed.get_name();
    // var self = this;
    // var w = 300;
    // var h = 200;
    // var layout = { view: 'Box', visible: false, rect: RC(jQuery(window).width()/2 - w/2, jQuery(window).height()/2 - h/2, w, h), style: { borderRadius: '10px', border: '2px solid grey' }, background: '#fff', childViews: [
    //     { view: 'Label', text: 'Feed Name', rect: RC(5, 5, 10, 10) },
    //     { view: 'TextField', rect: RC(10, 20, w-20, 40), anchors: 'top left', value: str, textSelectable: true },
    //     { view: 'Label', text: 'Feed URL', rect: RC(5, 70, 10, 10) },
    //     { view: 'TextField', rect: RC(10, 85, w-20, 60), anchors: 'top left', value: feed.get_url(), textSelectable: true },
    //     { view: 'Button', rect: RC(w-70, h-30, 60, 20), anchors: 'top right', text: 'OK' },
    //     { view: 'Button', rect: RC(w-130, h-30, 60, 20), anchors: 'top right', text: 'Cancel' }
    // ] };
    // this.view = uki(layout)[0];
    // uki(this.view).attachTo( window );
    // //jQuery(popup.dom()).fadeIn();
    // this.view.visible(true);
    // 
    // uki('TextField', this.view).keypress( function() {
    //     if (event.keyCode == 13) { // return key
    //         uki('Button[text=OK]', self.view).click();
    //     }
    // });
    // 
    // uki('Button[text=OK]', this.view).click( function() {
    //     var name = uki('TextField', self.view)[0].value();
    //     var url = uki('TextField', self.view)[1].value();
    //     
    //     console.log('save feed prefs', name, url);
    // 
    //     self.feed.update( name, url );
    // 
    //     uki.destroy(self.view);
    // });
    // uki('Button[text=Cancel]', this.view).click( function() { 
    //     console.log('canceled');
    //     uki.destroy(self.view);
    // });

}

function MediaPlayer(app) {
    this.app = app;
    this.update_freq = update_ms * 100;
    this.ready = false;
    this.states = [
        "Idle",
        "Opening",
        "Buffering",
        "Playing",
        "Paused",
        "Stopping",
        "Ended",
        "Error"
    ];
    this.counter = 0;
    this.idle = false; // when idle, make the controls disappear.
}


MediaPlayer.prototype = {

    get_state: function() {
        if (this.vlc) {
            return this.states[this.vlc.input.state];
        }
    },

    paused: function(val) {
        var cur_paused = (this.get_state() == 'Paused');
        if (val === undefined) {
            if (cur_paused) {
                return true;
            } else {
                return false;
            }
        } else {
            if (val && ! cur_paused) {
                this.vlc.playlist.togglePause();
            } else if (! val && cur_paused) {
                this.vlc.playlist.togglePause();
            }
        }
    },

    seek: function(value) {
        if (! this.last_seek || (this.last_seek && (new Date() - this.last_seek > update_ms * 2) )) { // dont seek
            // too often in case event gets fired twice... 
            console.log('seek to',value);
            this.last_seek = new Date();
            this.vlc.input.position = value;
        }
    },
    
    controlsVisible: function(visible) {
        if (visible) {
            uki('#vlc_controls_container').visible(true);
        }
    },

    update: function() {
        // updates UI elements, i.e. the time slider
        var state = this.get_state();

        //console.log('media player update with state',state, 'playlist playing:',this.vlc.playlist.isPlaying);

        if (this.updating) {
            if (! this.slider._dragging) {
                this.slider.value( this.vlc.input.position );
            }
            this.nextupdate = setTimeout( _.bind(this.update, this), this.update_freq );
        }

        if (state != 'Playing') {
            this.controlsVisible(true);
        }

        if (state == 'Playing') {

            if (! this.volume_initialized) {
                this.volume.value( this.vlc.audio.volume / 200 );
                this.volume_initialized = true;
            }

            if (new Date() - this.lastmousemove > 5000) {
                this.controls.visible(false);
            }

            this.buttons['play'].disabled( true );
            this.buttons['pause'].disabled( false );
            this.buttons['stop'].disabled( false );
        } else if (_.contains(['Stopping','Paused'], state)) {
            this.buttons['play'].disabled( false );
            this.buttons['pause'].disabled( true );
            this.buttons['stop'].disabled( true );
        } else if (state == 'Ended') {
            this.buttons['play'].disabled( false );
            this.buttons['pause'].disabled( true );
            this.buttons['stop'].disabled( true );
            this.vlc.playlist.stop();
        } else {
            this.buttons['play'].disabled( true );
            this.buttons['pause'].disabled( true );
            this.buttons['stop'].disabled( true );
        }

        this.status.text( state );
    },

    startUpdating: function() {
        this.updating = true;
        if (jQuery.browser.msie) {
            this.version = this.vlc.VersionInfo;
        } else {
            this.version = this.vlc.versionInfo();
        }
        this.update();
    },
    stopUpdating: function() {
        this.updating = false;
        if (this.nextupdate) {
            clearTimeout( this.nextupdate );
        }
    },

    forceUpdate: function() {
        var _this = this;
        clearTimeout( this.nextupdate );
        setTimeout( function() {
            _this.startUpdating();
        }, update_ms );
    },

    open: function(file) {        
        var self = this;
        var _this = this;
        this.app.stopUpdating();
        this.app.view.visible(false);
        jQuery('#uservoice-feedback').hide();
        jQuery('#header-wrap').hide();

        var h = jQuery(window).height(); // keep these variables up to date..
        var w = jQuery(window).width();

        //var plugin_w = w;
        //var plugin_h = h-40;
        var plugin_w = '100%';
        var plugin_h = (h - 40) + 'px';

        //var cw = Math.min( 600, w );
        var cw = w;

        var controls_layout = { view: 'Box', id: "vlc_controls_container", anchors:'left bottom',
              childViews: [
                  { view: 'Slider', id:"vlc_seek_slider", rect: RC(10, h-25, cw - 410, 15), anchors: 'right top left width' },
                  { view: 'Slider', id:"vlc_volume_slider", rect: RC((cw-410) + 25 + 10, h-25, 50, 15), anchors: 'right top left width' },
                  { view: 'Label', style: { color: '#fff' }, text: '(Initializing)', rect: RC(cw-310,h-25,40,15) },
                  { view: 'Button', text: 'Play', rect: RC(cw-150,h-25,40,15) },
                  { view: 'Button', text: 'Pause', rect: RC(cw-200,h-25,40,15) },
                  { view: 'Button', text: 'Stop', rect: RC(cw-250,h-25,40,15) },
                  { view: 'Button', text: 'Close', rect: RC(cw-50,h-25,40,15) }
              ], rect: RC(0, 0, cw, h) };

        var layout = { view: 'Box', childViews: [controls_layout], 
                       id: 'vlc_container', anchors: 'top left right bottom',
                       rect: RC(0,0,w,h), background: '#000' };
        
        var view = uki(layout);
        view.mousemove( function() { _this.lastmousemove = new Date(); if (! _this.controls.visible()) { _this.controls.visible(true); } } );
        this.view = view[0];
        this.status = uki('Label', view)[0];
        this.controls = uki('#vlc_controls_container', view)[0];
        this.buttons = { play: uki('Button[text=Play]', view)[0],
                         pause: uki('Button[text=Pause]', view)[0],
                         stop: uki('Button[text=Stop]', view)[0] };
        

        uki(this.buttons.play).click( function() {
            _this.vlc.playlist.play();
            _this.forceUpdate();
        });
        uki(this.buttons.pause).click( function() {
            _this.paused( true );
            _this.forceUpdate();
        });
        uki(this.buttons.stop).click( function() {
            _this.vlc.playlist.stop();
            _this.forceUpdate();
        });

        


        uki('Button[text=Close]', view).click( function() {
            if (_this.vlc && _this.vlc.playlist) {
                try {
                    _this.vlc.playlist.items.remove(0);
                } catch(e) {
                    console.log('removed item 0 from playlist returned error, but that is expected');
                }
                _this.vlc.playlist.stop();
                self.stopUpdating();
            }
            self.view.visible(false);
            self.app.view.visible(true);
            self.app.startUpdating();
            jQuery('#header-wrap').show();

            setTimeout( function() {
                uki.destroy( view[0] );
            }, 2000); // dont destroy the view right away because this
            // seems to lead to crashes...
        });

        this.slider = uki('#vlc_seek_slider', view)[0];
        this.volume = uki('#vlc_volume_slider', view)[0];

        uki(this.volume, view).change( function(event) {
            _this.vlc.audio.volume = event.value * 200;
        });


        uki(this.slider, view).change( function(event) {
            self.seek( event.value );
        });


        view.attachTo(window);



        var html5 = false;

        if (html5) {
            // 
            var html = '<video id="vlc" src='+file.get_link()+'controls preload="none"></video>';
            jQuery('#embed_container').html( html );
            return;
        } else if (jQuery.browser.msie) {
            var html = '\
<object classid="clsid:9BE31822-FDAD-461B-AD51-BE1D1C159921"\
pluginspage="http://www.videolan.org" \
codebase="'+'/static/bt_vlc_plugin.CAB" \
width="'+plugin_w+'" height="'+plugin_h+'" id="vlc_ie" events="True"> \
<param name="MRL" value="" /> \
<param name="ShowDisplay" value="True" /> \
<param name="AutoLoop" value="no" /> \
<param name="AutoPlay" value="yes" /> \
</object>';
        } else {
            var html = '<embed type="application/x-vlc-plugin" name="vlc" id="vlc" events="true" version="VideoLAN.VLCPlugin.2" \
pluginspage="http://www.videolan.org"\
width="'+plugin_w+'" height="'+plugin_h+'" />';
        }


        //var embed = jQuery(html);
        setTimeout( function() {
            _.each(_this.buttons, function(button) { button.disabled(true); });
            _this.slider.disabled(true);
            console.log('putting in embed tag');

            var div = document.createElement('div');
            div.setAttribute('id','embed_container');
            view.dom().appendChild( div );
            if (jQuery.browser.msie) {
                //div.innerHTML = html;
                jQuery('#embed_container').html( html );
                jQuery('#vlc_ie').width( plugin_w );
                jQuery('#vlc_ie').height( plugin_h );
            } else {
                jQuery('#embed_container').html( html );
            }


            setTimeout( function() {
                var ie_vlc = document.getElementById('vlc_ie');
                if (ie_vlc) {
                    document.vlc = ie_vlc;
                } 
                self.vlc = document.vlc;
                //self.attachEvents();

                var options = [
                    "--http-forward-cookies", 
                    "--autoscale",
                    "--deinterlace=1", "--deinterlace-mode=blend"
                ];
                if (config.cookies.direct_talon_stream) {
                    var url = file.get_talon_stream();
                } else if (config.utweb) {
                    var url = file.get_forward_nonssl_link();
                } else {
                    var url = file.get_webui_stream_link();
                }
                console.log('stream url is',url);
                function sanitize(filename) {
                    // IE VLC plugin crashes with filenames that have
                    // '/' character
                    return '';
                }

                // check if vlc is really working
                if (! document.vlc || ! document.vlc.playlist) {
                    return;
                }

                            if (html5) { 
                            } else
                if (jQuery.browser.msie) {
                    var index = document.vlc.playlist.add( url, file.name );
                } else {
                    var index = document.vlc.playlist.add( url, file.name, options );
                }
                console.log('adding',file,'to playlist');

                setTimeout( function() {
                    console.log('playing playlist item',index);
                    document.vlc.playlist.playItem(index);


                    // for a little while update 5x more frequently
                    var freq = _this.update_freq;
                    _this.update_freq = freq/5;
                    setTimeout( function() {
                        _this.update_freq = freq;
                    }, 10000); // it can take a while to buffer... (3
                    // seconds?) (better to wait until play state, and
                    // maybe just give up after a while
                    self.startUpdating();



                }, 1000);
            }, 2000 );
            
        }, 1000 );
        
    }
};


function Statusbar(app) {
    this.app = app;
    this.view = uki('#statusbar')[0];
    this.view_upload = uki('#statusbar_upload')[0];
    this.view_download = uki('#statusbar_download')[0];
}
Statusbar.prototype = {
    redraw: function() {
        var totals = this.app.current_client().torrent.calculate_totals();
        this.view_upload.html('U: ' + Formatters.to_rate(totals.total_up_speed) );
        this.view_download.html('D: ' + Formatters.to_rate(totals.total_down_speed) );
    }
};

function uTorrentWeb_v2(view, clients) {
    var self = this;
    this.__name__ = 'uTorrent Remote App';
    this.view = view;
    //jQuery.fx.off = true;
    this.clients = clients;
    clients.set_app(this);
    //_.each(this.clients._clients, function(c) { c.view = this; } );
    this.config = { updateInterval: 5000,
                    cpuLimit: 5,
                    report_frontend: false,
                    lang: "en"
                  };
    this.display_settings = new DisplaySettings(self);
    this.filereader = new WrappedFileReader();
}

uTorrentWeb_v2.prototype = {
    bind_stuff: function() {
	    var self = this;
	    this.toolbar = new Toolbar(self);
	    this.tabs = ['general', 'peers', 'files', 'speed'];
	    this.tables = { torrent: new TorrentTable(self),
	                    file: new FileTable(self),
	                    app: new AppPane(self),
	                    general: new GeneralPane(self),
	                    speedgraph: new SpeedGraph2(self),
	                    statusbar: new Statusbar(self),
	                    feeditem: new FeedItemTable(self),
	                    category: new CategoryPane(self),
	                    peer: new PeerTable(self) };

	    // this.bind('#statusbar_about', 'click', function(event) { 
	    //                          utweb.about();
	    //                      }
	    //                      );
	    jQuery('#show_about').live('click', function(e)
	    {
	        e.preventDefault();
        
	        utweb.about();
	    })
    
	    this.bind('#statusbar_sessions', 'click', function(event) { 
						     utweb.view_sessions();
						 }
						 );


	    this.bind('#torrent_url_add', 'click', function(event) {
	        var url = uki('#torrent_url').value();
        
	        var oncomplete = function() { 
	            console.log('got add unknown url response');
	            var url = uki('#torrent_url').value('');
	        };
	        self.current_client().add_unknown(url, oncomplete, oncomplete);
	        eventTracker.track('WebUI', 'AddTorrentOrFeedURL');
	    });

	    this.bind('#torrent_url', 'keypress', function(event) {
	        if (event.keyCode == 13) { // return key
	            uki('#torrent_url_add').click();
	            uki('#torrent_url').blur();
	        }
	    });


	    this.bind('#media_button', 'click', function() {
	        window.location = '/talon/stream';
	    });

	    uki('#home_button').click( function() {
	        window.location.reload();// = '/talon/gui';
	    });
	    uki('#media_button').click( function() {

	//        window.location = '/talon/stream';
	    });
	    jQuery('#select_client').change( function(evt) {
	                                         var val = jQuery(evt.currentTarget).val();
	                                         if (val == '__new') { 
	                                             // pop up a login window that will do srp
	                                             console.log('popup a login window');
						     window.location = 'https://'+logout_root+'/srp?noredirect=1'; // TODO: hide the url
	                                             // self.login_popup = new LoginWindow({}, true);
	                                         } else {
	                                             self.switch_client(val);
                                             
	                                         }
	                                         return true;
	                                     });


	    var root_element = document.compatMode == "CSS1Compat" && document.documentElement || document.body;
	    uki.dom.bind(root_element, 'click', function(event) {
	        // global clickity thing // why isnt this working in IE
	        if (self.contextmenus && self.contextmenus.length > 0) {
	            event.stopPropagation();
	            event.cancelbubble = true;

	            if (self.contextmenus) {
	                _.each(self.contextmenus, function(c) { uki.destroy(c.view); } );
	            }
	        }
	        self.contextmenus = [];

	    });
		
	    this.bind_tabs();

    },
    uploaded_torrent: function() {
        window.file_upload_popup.die();
        return true;
    },
    view_sessions: function() {
        if (window.window_urlparams && window_urlparams.sessions) {
            var sess_str = '?sessions=' + encodeURIComponent(window_urlparams.sessions);
        } else {
            var sess_str = '';
        }
        window.open('/talon/sessions' + sess_str);
    },
    bind_tabs: function() {
        var self = this;
        _.each(this.tabs, function(tab) {
            var evt = is_ipad ? 'touchstart' : 'mousedown';
            self.bind('#tab_' + tab, evt, function() {
                self.switchtab(tab, true);
                eventTracker.track('WebUI', 'SwitchTab', {'label': tab});
            });
        });    

    },

    upload_file: function(form) {
        debugger;
    },

    set_idle: function(val) {
        this.is_idle = val;
        if (this.is_idle) {
            this.stopUpdating();
        } else {
            this.startUpdating();
        }
        console.log('set is_idle to',val);
    },

    notify_plus_active: function() {
        // when plus activation status comes back, show the "get files" pane"
        this.tables.file.change_column_visibility('Get File',true);
    },

    activate_app: function(update_url) {
        // switch to app view 
        console.log('try to activate app',update_url);
        var app = this.current_client().app.getwith( { update_url: update_url } );
        if (app) {
            console.log('activate app',app);
            // make sure category pane apps is expanded
            this.tables.app.set_app(app);
            if (! this.tables.category.app.__opened) {
                this.tables.category.open_node( this.tables.category.apps );
            }
            var _this = this;
            setTimeout( function() {
                // set the selection to the current app
                var node = _this.tables.category.getnode( 'app', app );
                _this.tables.category.select_node( node );
            }, update_ms*2 );
        }
    },

    visible_column_settings: function() {
        var _this = this;
        var settings = {};
        _.each( [ 'torrent','file','peer','feeditem' ], function(table_name) {
            settings[table_name] = _this.tables[table_name].get_column_visibility();
        });
        return settings;
    },

    detect_vlc: function() {
        var name = "VLC";
        if (navigator.plugins && (navigator.plugins.length > 0)) {
            for(var i=0;i<navigator.plugins.length;++i) 
                if (navigator.plugins[i].name.indexOf(name) != -1) 
                    return true;
        } else if (jQuery.browser.msie) {
            try {
                new ActiveXObject("VideoLAN.VLCPlugin.2");
                return true;
            } catch (err) {}
        }
        return false;
    },

    getfreshdata: function(callback, failure_callback, optional_torrent_hashes) {
        var self = this;
        if (optional_torrent_hashes) {
            var hashes = optional_torrent_hashes;
        } else {
            var torrents = this.visibleTorrents();
            if (torrents && torrents.length > 0) {
                var hashes = _.map( torrents, function(torrent) { return torrent.hash; } );
            }
        }
        if (config.client_apps && ! this.current_client().app.fetched) {
            var params = { url: { list: 1, action: 'get-apps' } };
        } else if (self.active_tab == 'files' && hashes && hashes.length > 0) {
            var params = { url: { list: 1, action: 'getfiles', cid: this.current_client().torrent.cacheid },
                           body: { hash: hashes } };
        } else if (self.active_tab == 'peers' && hashes && hashes.length > 0) {
            var params = { url: { list: 1, action: 'getpeers', cid: this.current_client().torrent.cacheid },
                           body: { hash: hashes } };
        } else {
            var cid = this.current_client().torrent.cacheid;
            if (cid && cid != null && typeof(cid) != "undefined") {
                var params = { url: { list: 1, cid: cid },
                               body: {} };
            } else {
                var params = { url: { list: 1}, body: {}};
            }
        }

        if (self.fetch_failure_count && self.fetch_failure_count > 0) {
            params.url.retry_number = self.fetch_failure_count;
        }

        if (this.current_client().raptor.request_queue.length == 0) {
            if (! self.logged_out) {
                this.current_client().raptor.post( params.url, params.body, callback, failure_callback );
            } else {
                console.log('not fetching because logged out');
            }
        } else {
            console.log('not fetching new data because a request is already pending');
        }

    },

    onNewData: function(drawdetail, drawtorrents) {

        //console.log('debug: # uki binds/handlers', _.keys(uki.dom.bound).length,'/',_.keys(uki.dom.handlers).length);

        // called when new data has returned from the client and has
        // been parsed
        var self = this;

        if (this.view.visible()) {

            this.tables.torrent.loader.visible(false);

            var totals = self.current_client().torrent.calculate_totals();
			
            if (window.config.product != "embedded" && window.config.build != 'embedded')
            {
	            var app_name = window.config.name.replace('&micro;', 'µ');
				document.title = app_name + ' - D: ' + Formatters.to_rate(totals.total_down_speed) + ' U: ' + Formatters.to_rate(totals.total_up_speed);
		    }
			
			this.tables.speedgraph.add_data(self.current_client().torrent.all());
            this.tables.category.updateLabels();
            this.tables.category.updateFeeds();
            this.tables.category.updateApps();
            this.tables.category.updateCounts();
            this.tables.category.redraw();
            this.tables.statusbar.redraw();

            if (! this.tables.app.visible()) {
                if (drawtorrents) {
                    if (this.tables.torrent.view.visible()) {
                        this.tables.torrent.draw();
                    } else {
                        this.tables.feeditem.draw();
                    }
                }
                if (drawdetail) {
                    this.redrawDetailPane();
                }
            }
            this.toolbar.update();
            
        }
        //console.log('Draw pass took',(new Date() - s)/1000,'seconds');

    },
    detailPaneRedrawn: function() {
        // stores the time and state of a detail pane drawing (to know
        // to not render too fast upon double click events...)
        this.last_detail_draw = { time: new Date(),
                                  torrent: this.selectedTorrent(),
                                  tab: this.active_tab };
    },
    redrawDetailPane: function() {
        if (this.active_tab == 'general') {
            this.tables.general.draw();
        } else if (this.active_tab == 'files') {
            this.tables.file.draw( this.selectedTorrent());
        } else if ( this.active_tab == 'peers' ) {
            this.tables.peer.draw( this.selectedTorrent());
        } else if ( this.active_tab == 'speed' ) {
            if (! this.tables.speedgraph.initialized) {
                this.tables.speedgraph.attach("#detail_pane_speed");
                this.tables.speedgraph.initialized = true;
            }
            this.tables.speedgraph.draw();
        }
        this.detailPaneRedrawn();
    },

    startUpdating: function(now) {
        var self = this;
        if (! this.polling) {
            this.next_update_id = setTimeout( function() { self.updateTick.apply(self,[]); }, now ? 1 : self.config.updateInterval );
        }
        console.log('starting updating');
        this.polling = true;
    },
    stopUpdating: function() {
        this.polling = false;
        console.log('stopping updating');
        if (this.next_update_id) {
            clearTimeout( this.next_update_id );
        }
        // cancel all current XHR requests too?
    },
    updateTick: function(whendone, dont_reconnect_attempt) {
        // this is a very messy... needs to be rewritten
        if (window.utWebUI) { utWebUI.TOKEN = this.current_client().raptor.api.token; } // webui torrent upload code needs the token
        var self = this;
        self.next_update_id = null;
        if (! this.tables.app.visible()) {
            this.display_settings.save(); // probably dont want to call
            // this every iteration... but whatever.
        }

        var callback = function() {
            self.fetch_failure_count = undefined;
            if (self.connectivity_popup) {
                // track a reconnect event
                console.log('Reconnect Successful');
                self.connectivity_popup.die();
                self.connectivity_popup = null;
            }
            var s = new Date();
            self.onNewData(true, true);

            if (self.polling) {

                var maximum_render_load = self.config.cpuLimit/100; // fraction of a
                // second that we want to spend doing cpu intensive
                // javascript rendering

                var fraction_spent_rendering = (new Date() - s) / self.config.updateInterval;
                if ( fraction_spent_rendering  > maximum_render_load ) {
                    var poll_interval = 1/maximum_render_load * fraction_spent_rendering * self.config.updateInterval;
                } else {
                    var poll_interval = self.config.updateInterval;
                }

                //console.log('Next update in', (poll_interval/1000).round(1), 'seconds.')
                self.next_update_id = setTimeout( function() { self.updateTick.apply(self, []); } , poll_interval);
            }
            if (whendone) { whendone.apply(self,[]); }
        };

        function failure_callback(err_data) {
            if (config.verbose > 0) { console.error('failure callback in update',err_data); }
            if (err_data.code == 'webui.invalid_token') {
                // simply fetch a new token and go!
                clients.get_current_client().raptor.api.webui_get_token( function() { 
                                                self.updateTick.apply(self, [whendone]); 
                                            });
                return;
            }

            if (err_data.status == 'timeout') {
                var error_message = 'xhr timeout';
            } else {
                var error_message = 'Failed to connect.'; //JSON.stringify(err_data);
            }
            if (err_data.xhr) {
                if (err_data.status == 'timeout') {
                    var http_status = 0;
                } else {
                    var http_status = err_data.xhr.status;
                }
            } else {
                var http_status = 0;
            }

            if (http_status == 404) {
                // at this point the client may have re attached to a
                // new rapton or raptor port. we should ask talon
                // where our raptor is

                // TODO: fix for multi session

                var url = '/talon/getrapton';
                var xhr = jQuery.ajax({ type: 'GET', url: url, async: false });
                try {
                    var raptor = JSON.parse(xhr.responseText).rapton;
                    if (raptor != window.location.origin) {
                        debugger;
                        console.log('client moved to a different raptor host/port -- redirect');
                        // TODO: serialize all saved data (not just the current key)
                        window.name = clients.serialize();
                        window.location = raptor + config.path_gui;
                        // or just set window location to the
                        // frontpage and it will handle the redirect...
                    }
                } catch(e) {
                    console.warn('unable to get rapton',e);
                }


                error_message = "Unable to locate your " + config.name + " client. Some possible causes for this error are: <ul><li>Your client is not running</li><li>Your computer has entered sleep mode</li><li>&micro;Torrent remote is not enabled</li><li>Your &micro;Torrent client cannot connect to the internet</li></ul>";
            } else if (http_status == 0) {
                if (err_data.state == 'timeout') {
                    error_message = "Request timed out.";
                } else {
                    // RAPTOR may have been shut down and we want you
                    // to move to another rapton. How to detect this?

                    error_message = locale("Unable to communicate with your " + config.name + " client. This message will disappear automatically when a connection is re-established.");
                }
            } else if (http_status == 503) {
                error_message = locale('Your client is currently not available. Verify that it is connected to the internet.');
            } else if (http_status == 401 || http_status == 403) { // not authorized
                self.stopUpdating();
                if (self.connectivity_popup) {
                    self.connectivity_popup.die();
                }
                if (self.login_popup) {
                    self.login_popup.die();
                }
                self.login_popup = new LoginWindow(err_data);
                return;
                
            }

            if (self.connectivity_popup) {
                self.connectivity_popup.die();
            }
            
            if (self.fetch_failure_count === undefined) {
                self.fetch_failure_count = 1;
            } else {
                if (! dont_reconnect_attempt) {
                    self.fetch_failure_count += 1;
                }
            }
            if (! dont_reconnect_attempt) {
                if (self.fetch_failure_count > 1) {
                    // SET AS A QUICK FIX FOR JP RELEASE TO BUFFALO!!!!!
                    console.warn(locale("Unable to communicate with your " + config.name + " client. This message will disappear automatically when a connection is re-established."));
                    self.connectivity_popup = new PopupWindow( RC(jQuery(window).width()/2 - 200,jQuery(window).height()/4, 400, 140), locale("Unable to communicate with your " + config.name + " client. This message will disappear automatically when a connection is re-established."), '<h2>Connectivity Problem</h2>');
                    // only show connectivity after 2 failed retries

                }
                var backoff_mode = 'quadratic';
                if (backoff_mode == 'quadratic') {
                    var next_connection_attempt = self.config.updateInterval * Math.pow(self.fetch_failure_count, 2);
                } else {
                    var next_connection_attempt = self.config.updateInterval;
                }
                // new update attempts may come not only from reconnect
                // attempts... 

                console.log('Raptor refused our request, will attempt to reconnect in', next_connection_attempt/1000,'seconds');
                self.next_update_id = setTimeout( function() { self.updateTick.apply(self, [whendone], false); } , next_connection_attempt );
            }


        }

        this.getfreshdata( callback, failure_callback );

        
    },


    registerContextMenu: function(contextmenu) {
        // so we can make the context menu go away by left clicking
        // somewhere else
        if (this.contextmenus) {
            _.each(this.contextmenus, function(c) { uki.destroy(c.view); } );
        }
        this.contextmenus = [contextmenu];
    },

    selectedTorrent: function() {
        // can get from rss feed item table too...
        if (this.tables.feeditem.view.visible()) {
            var item = this.tables.feeditem.view.selectedRow();
            if (item && item.__name__ == 'Torrent') {
                return item;
            } else if (item) {
                var torrent = item.get_torrent();
                if (torrent) {
                    return torrent;
                }
            }
        } else {
            var torrent = this.tables.torrent.view.selectedRow();
            return torrent;
        }
    },
    visibleTorrents: function() {
        if (this.tables.peer.view.visible()) {
            if (this.tables.peer.torrents) {
                return this.tables.peer.torrents;
            }
        } else if (this.tables.file.view.visible()) {
            if (this.tables.file.torrents) {
                return this.tables.file.torrents;
            }
        }
    },
    selectedTorrents: function() {
        if (this.tables.feeditem.view.visible()) {
            var feeditems = this.tables.feeditem.view.selectedRows();
            return _.map( _.filter(feeditems, function(item) { return !! item.torrent; }),
                          function(item) { return item.torrent; } );
        } else {
            var torrents = this.tables.torrent.view.selectedRows();
            return torrents;
        }
    },
    selectedItems: function() {
        if (this.tables.category.view._hasFocus) {
            return this.tables.category.selectedNodes();
        } else if (this.tables.feeditem.view.visible()) {
            var feeditems = this.tables.feeditem.view.selectedRows();
            return feeditems;
        } else {
            return this.selectedTorrents();
        }
    },

    uservoice_should_display: function() {
        return ! config.debug && !config.webui; 
    },

    fix_layout: function() {

        _.each(this.tables, function(table) {
            var view = table.view;
            if (view) {
                var parent = view.parent();
                if (parent) {
                    parent.layout();
                }
            }
        });

    },

    load_minimal_stuff: function(opts) {
        var self = this;
        //this.tables.feeditem.view.visible(false);
        if (!config.webui) {
            this.stored_sessions();
        }
        function get_token_failure(err_data) {
            err_data.get_token = true;
            self.login_popup = new LoginWindow(err_data);
        }

        // raptor hangs here sometimes (for a LONG LONG time)... so
        // cancel the xhr and try again if it does...
        
        self.get_new_token( function() {


            function ready_to_poll() {

            self.polling = true;
            self.updateTick( function() {
                                 
                self.display_settings.restore_after_first_view_update();

                if (utweb.uservoice_should_display()) {
                    uservoiceOptions = {
                        /* required */
                        key: 'utorrentideas',
                        host: 'utorrentideas.uservoice.com', 
                        forum: '71937',
                        showTab: true,  
                        /* optional */
                        alignment: 'right',
                        background_color:rgb_hex(ut_colors.green), 
                        text_color: 'white',
                        hover_color: rgb_hex(darker(ut_colors.green,1.1)),
                        lang: jQuery.cookie("locale"),
                        params: { sso: jQuery.cookie("uservoice_sso") }
                    };

                    jQuery.getScript("//cdn.uservoice.com/javascripts/widgets/tab.js");
                }


            }, true);
            }

            if (opts && opts.getsettings) {

                client.setting.all( function() {
                                        var cookie_data = client.setting.get('webui.cookie').value;
                                        var data = null;
                                        try {
                                            data = jQuery.parseJSON(cookie_data);
                                        } catch(e) {
                                            console.error('error parsing webui.cookie');
                                        }

                                        if (data && data.lang) {
      	                                    loadLangStrings({
                                              "lang": data.lang
                                            });
                                            self.change_language(data.lang);
                                        }

                                        ready_to_poll();
                                    });
            } else {
                ready_to_poll();
            }



        },

            get_token_failure
        );

    },

    log: function(msg) {
        // put a message into the logger pane
        uki('#logger_list').addRow(0, (new Date()) + ': ' + msg);
    },

    switchtab: function(tab, redraw) {
        //console.log('Switch tab', tab);
        this.active_tab = tab;
        // basic visibility
        _.each(this.tabs, function(t) {
            if (tab == t) { 
                uki('#detail_pane_' + t).visible(true);
                var jq = jQuery(uki('#tab_'+t)[0].dom());
                jq.addClass('active_tab');

            } else { 
                uki('#detail_pane_' + t).visible(false); 
                var jq = jQuery(uki('#tab_'+t)[0].dom());
                jq.removeClass('active_tab');
            }
        });


        if (tab == 'peers') {
            this.tables.peer.view_open( this.selectedTorrents() );
        } else if (tab == 'files') {
            this.tables.file.view_open( this.selectedTorrents() );
        }

        if (redraw) {
            this.redrawDetailPane();
        }
    },
    remote_open: function(hash, index) {
		var torrent = this.current_client().torrent.get(hash);
        var file = torrent.file._data[index];

		file.sling();
    },

    media_open: function(hash, index) {
        var torrent = this.current_client().torrent.get(hash);
        var file = torrent.file._data[index];

        window.open( '/static/player.html', file.get_link() );
        return;

      eventTracker.track('WebUI', 'PlayFile');
        var self = this;
        var torrent = this.current_client().torrent.get(hash);
        var file = torrent.file._data[index];
        if (self.vlc_detected === undefined) {
            self.vlc_detected = self.detect_vlc();
        }
        if (file && self.vlc_detected) {
            self.mediaplayer = new MediaPlayer(self);
            self.mediaplayer.open( file );
        } else {

          if (config.cookies.html5video || wants_mobile_ui()) {
            //window.open( '/talon/html5video?sid=' + torrent.stream_id + '&file=' + index );
            window.open( file.get_link('inline','STREAMING') );
          } else {
            throw Error('vlc player not installed :-(');
          }

        }
    },

    attach_view: function() {
        //console.log('attaching view');
        //this.view.attachTo(document.getElementById('app_container'), jQuery(window).width() + ' ' + jQuery(window).height() );
        //this.view.attachTo(jQuery("#app_container")[0], jQuery(window).width() + ' ' + jQuery(window).height());
        this.view.attachTo(window, jQuery(window).width() + ' ' + jQuery(window).height() );
    },

    get_new_token: function(cb, fail_cb) {
        var timeout_seconds = 666; // implement me...
        if (config.utweb) {
            this.current_client().raptor.api.get_token(cb, fail_cb, timeout_seconds);
        } else {
            this.current_client().raptor.api.webui_get_token(cb, fail_cb);
        }
    },

//     torrent_delete_confirmation_dialog: function(str, onconfirm) {
//         var w = 300;
//         var h = 160;
//         var popup = uki({ view: 'Box', visible: false, rect: RC(jQuery(window).width()/2 - w/2, jQuery(window).height()/2 - h/2, w, h), style: { borderRadius: '10px', border: '2px solid grey' }, background: '#fff', childViews: [
//             { view: 'Label', rect: RC(10, 10, w-20, 40), anchors: 'top left', text: str, textSelectable: true },
// 
//             { view: 'Radio', group: 'radio1', rect: RC(10, h-100, 24, 24), checked: true, anchors: 'top left', id: 'delete_torrent' },
//             { view: 'Label', rect: RC(34, h-100, 24, 24), anchors: 'top left', text: 'Just delete torrent' },
// 
//             { view: 'Radio', group: 'radio1', rect: RC(10, h-80, 24, 24), anchors: 'top left', id: 'delete_data' },
//             { view: 'Label', rect: RC(34, h-80, 24, 24), anchors: 'top left', text: 'Also delete torrent data' },
// /*
//             { view: 'Radio', group: 'radio1', rect: RC(10, h-60, 24, 24), anchors: 'top left', id: 'keep_torrent' },
//             { view: 'Label', rect: RC(34, h-60, 24, 24), anchors: 'top left', text: 'Only delete data' },
// */
// 
//             { view: 'Button', rect: RC(w-70, h-30, 60, 20), anchors: 'top right', text: 'Cancel' },
//             { view: 'Button', rect: RC(w-140, h-30, 60, 20), anchors: 'top right', text: 'OK' }
//         ] })[0];
//         
//         uki(popup).attachTo( window );
//         //jQuery(popup.dom()).fadeIn();
//         popup.visible(true);
// 
//         uki('Button[text=OK]', popup).click( function() {
//             onconfirm( { delete_data: uki('#delete_data',popup).value(),
//                          delete_torrent: uki('#delete_torrent',popup).value(),
//                          keep_torrent: uki('#keep_torrent',popup).value()
//                        } );
//             uki.destroy(popup);
//         });
//         uki('Button[text=Cancel]', popup).click( function() { 
//             uki.destroy(popup);
//         });
//     },

    bind: function(selector, event_type, handler) {
        var self = this;
        uki(selector)[event_type]( function() { return handler.apply(self, arguments); } );
    },


    share: function() {
        var torrent = this.selectedTorrent();
        if (torrent) {
          var share_root = config.webui ? 'remote.utorrent.com' : config.logout_root;
          var torrent_file_url = torrent.get_web_seed_torrent_link();
          var web_seed_url = torrent.get_web_seed_link();
            var url = '//' + share_root + '/talon/send?btih=' + torrent.hash + '&dn=' + encodeURIComponent(torrent.name);
            if (torrent.webseed_enabled) {
                url = (url + '&sid=' + torrent.stream_id+'&cid='+torrent.manager.client.data.cid );
            }
      eventTracker.track('WebUI', 'Share');
	    return window.open(url);
            var popup = new PopupWindow(RC(jQuery(window).width()/2 - 200, jQuery(window).height()/2 - 200, 300, 200), 
                                        '<div id="share_info"></div>', 
                                        "<h2>"+locale('Share this torrent') + "</h2>");
            jQuery('#share_info').html( '<a target="_new" href="'+url+'">'+ locale('Share link') + '</a>' );
        }

    },
    open_pairing: function() {
        var _this = this;
        var pairing = new Pairing( { success: function(p) {
                                         console.log('pairing success');
                                         _this.current_client().raptor.api.pairing = p;
                                     },
                                     error: function() {
                                         console.log('pairing failed');
                                     },
                                     pairing_name: 'uTorrent Remote'
                                   } );
    },
	open_tablet: function() {
		window.location = '/tabletui/index.html';
	},
    open_local: function() {
        var _this = this;
        this.current_client().setting.all( function() {
            _this.current_client().raptor.post( { action: 'get-sessions' }, {}, function(resp) {
                var current_session = _this.current_client().session._sessions[_this.current_client().guid];
                if (current_session) {
                    if (current_session.looks_local()) {
                        var url = current_session.local_gui_url();
                        console.log('local url is', url);
                        window.location = url;
                    }
                }
            } );
        } );
    },
    transcode: function(hash, index) {
        // open transcode app with given torrent hash and index
        /*
        var torrent = client.torrent.get(hash);
        var file = torrent.file._data[index];

        */
        var app = this.current_client().app.getwith( { name: 'Transcode' } );
        var qs = '?hash='+hash+'&index='+index;
        var url = app.get_content_path() + 'index.html' + qs;
        window.open(url);
        //this.tables.app.set_app(app, { qs: qs });
        //this.tables.app.show();
    },
    redirect_logout: function(message) {
        // redirects to talon logout page and will display message on front page
      var extra_param = (config.build!='purpleization'?'&utorrent=1':'');
      window.location = '//' + config.logout_root + '/talon/logout?message=' + encodeURIComponent(message) + extra_param;
    },
    logout: function() {
      var extra_param = (config.build!='purpleization'?'&utorrent=1':'');
        this._logging_out = true;
        this.stopUpdating();
        if (this.current_client() && this.current_client().raptor.version >= 24204) {
            var popupLoadingWindow = new PopupWindow(RC(jQuery(window).width()/2 - 75,jQuery(window).height()/4, 120, 120), '<img src="/static/images/10ft/spinner.gif" alt="loading" style="width:40px; height:40px; margin-left: -8px;"/>', '<h3>Logging out</h3>', true);
            //{session: this.current_client().guid } // include this and the client crashes, it defaults to log out the current session
            this.current_client().raptor.post( {action:'logout'}, {}, 
                      function() {
                        popupLoadingWindow.die();
                        window.location = '//' + config.logout_root + '/talon/logout?source=jslogout' + extra_param;
                      },
                      function() {
                          // failed, client does not support sending logout
                        popupLoadingWindow.die();
                        window.location = '//' + config.logout_root + '/talon/logout?source=jslogout&recognized_logout=0' + extra_param;
                      }
                    ); // TODO: there is another logout button code
            // path,
        } else {
          window.location = '//' + config.logout_root + '/talon/logout?source=jslogout'+ extra_param;            
        }
        // get rid of that. TODO: what if user got no token yet? in
        // that case, don't even try to send api.post

    },
    sketch: function() {
        jQuery.getScript( '/static/js/sketch/index.js', function() {
            console.log('sketch thingie loaded?');
        });
    },
    about: function () {
        var _this = this;
        if ((config.product == "embedded") || (config.product == "server")) {
            this.current_client().setting.all(
				function() {
	                // getversion only works for embedded/utserver
	                // Need to bind _this to be seen in the callbacks as this
	                _this.current_client().raptor.post( { action: 'getversion' }, {}, _.bind(_this.about_loaded, _this), _.bind(_this.about_load_failed, _this));
				}
            );
        } else {
            DialogManager.show("About");
        }
    },
    about_load_failed: function(err_data) {
        if (err_data.xhr && err_data.xhr.status == 400) { 
            // client does not know how to report getversion... :-(
            ele = $("client_version");
            if (ele) ele.set("text", this.current_client().raptor.version);

            DialogManager.show("About");
        }
    },
    about_loaded: function(json) {
        var verdict = json["version"];
        var revision = verdict["engine_version"];
        var majorVersion = verdict["major_version"];
        var minorVersion = verdict["minor_version"];
        var peerID = verdict["peer_id"];
        var buildDate = verdict["version_date"];
        var uiRevision = verdict["ui_version"];
        var userAgent = verdict["user_agent"];
        var productCode = verdict["product_code"];
        var ele;

        // Customize depending on product
        var aboutProductName = "BitTorrent";
        if (productCode == "embedded") {
            g_winTitle = "BitTorrent";
            aboutProductName = "BitTorrent Embedded";
        }
        else if (productCode == "server") {
            g_winTitle = "\u00B5Torrent Server";
            aboutProductName = "\u00B5Torrent Server";
            ele = $("productTitle");
            if (ele) {
                ele.set("text", "Server");
            }
        }
        if (this.config.showTitleSpeed)
            document.title = str.replace(/%s/, g_winTitle);
        else
            document.title = g_winTitle;
        ele = $("product_logo");
        if (ele) {
            ele.set("alt", g_winTitle);
        }

        ele = $("client_version");
        if (ele) ele.set("text", majorVersion + "." + minorVersion);
        ele = $("client_revision");
        if (ele) ele.set("text", revision);
        ele = $("client_build_date");
        if (ele) ele.set("text", buildDate);
        ele = $("ui_revision");
        if (ele) ele.set("text", uiRevision);
        ele = $("client_peer_id");
        if (ele) ele.set("text", peerID);
        ele = $("client_user_agent");
        if (ele) ele.set("text", userAgent);
        ele = $("about_product_title");
        if (ele) ele.set("text", aboutProductName);

        ele = $("client_version_set");
        if (ele) ele.setStyle("display", "block");

        // Write these now that know that language strings exist
        var upnpExtIP = this.current_client().setting.get("upnp.external_ip").value;
        var upnpAddr = "--------";
        if (upnpExtIP != "") {
            upnpAddr = upnpExtIP + ":" + this.current_client().setting.get("upnp.external_tcp_port").value + "(TCP)/" + this.current_client().setting.get("upnp.external_udp_port").value + "(UDP)";
        }
        var upnpAddrEle = $("upnp_external_address");
        if (upnpAddrEle) {
            upnpAddrEle.set("text", upnpAddr);
        }


        DialogManager.show("About");

    },
    handle_load_cookie: function(val) {
        var data = jQuery.parseJSON(val);
        console.log('handle load lang cookie from webui repository');
    },
    update_webui_cookie_with_dict: function(d) {
        // XXX just blow away the other settings for now. they're not used anyway
/*
        var sett = this.current_client().setting.get('webui.cookie');
        var changed = false;
        jQuery.parseJSON(sett.value);
        _.each(d, function(v,k) {
                   if (sett.value[k] != v) {
                       sett.value[k] = v;
                       changed = true;
                   }
               })
        var newval = jQuery.toJSON(sett.value);
        if (changed) {
            sett.set(newval);
        }
*/
		try{
			var sett = this.current_client().setting.get('webui.cookie');
			var newval = jQuery.toJSON(d);
	        sett.set(newval);
		}catch(e){
			console.log('Error', e);
		}
    },
    change_language: function(newLang, opts) {
        console.log('change language', newLang);
		
    		if(window.jQuery && window.jQuery.cookie)
    		 	jQuery.cookie('locale', newLang, {expires: 365});
        
        this.update_webui_cookie_with_dict( { lang: newLang } );

        // needs to save setting back to the client...
        utWebUI.defConfig.lang = newLang;
        // redraw the table headers
        _.each( [this.tables.torrent, this.tables.peer, this.tables.feeditem, this.tables.file], function(tbl) {
    			tbl.redrawHeaders();
        });

        if (this.current_client().torrent.fetched) {
            this.onNewData(true, true);
        }
        loadDetailPaneStrings();
        loadAboutStrings();
        //this.tables.category.updateCounts();
        // redraw the labels 
        //this.tables.category.redraw();
        uki('#torrent_url_add').text( locale('DLG_RSSDOWNLOADER_27') ); // this changes the width of the add button..

        jQuery('#ML_LABEL').text( locale('ML_LABEL') );

        var tabs_toolbar = uki('#tabs_toolbar')[0];
        tabs_toolbar.buttons([]);
        tabs_toolbar.buttons( _.map(this.tabs, function(tab) { return tab_button(tab); } ) );
        // XXX: hidden tabs are not clickable
        this.bind_tabs();

        var paste_url = uki('#torrent_url');
        if (paste_url && paste_url[0]) {
    			paste_url[0].placeholder( locale('Paste a torrent or feed URL') );
        }

        if (uki('#statusbar_about').length == 0) {
            uki('#statusbar_about').html( locale('about').capitalize() );
        }
        if (uki('#statusbar_sessions').length == 0) {
            uki('#statusbar_sessions').html( locale('sessions').capitalize() );
        }
		
    		utweb.toolbar.update_more_actions_titles();
        utweb.toolbar.update_titles();

    },
    current_client: function() {
        return this.clients.get_current_client();
    },
    stored_sessions: function() {
        if (_.keys(clients._clients).length == 0) { console.log('no stored sessions!'); return; }
        jQuery('#select_client').html('');

        for (var k in clients._clients) {
            var client = clients._clients[k];
            var elem = document.createElement('option');
            elem.setAttribute('value',k);
            if (k == this.current_client().guid) {
                elem.setAttribute('selected', 'selected');
            }
            elem.innerHTML = client.data.bt_user;
            jQuery('#select_client')[0].appendChild( elem );
        }
        jQuery('#select_client')[0].appendChild( jQuery('<option value="__new">New</option>' )[0] );
        if (config.experimental || config.cookies.experimental) {
            jQuery('#select_client_li').show();
        }        

    },
    activate_session: function(guid) {
        utweb.stopUpdating();
        clients.set_current_client(guid);
        utweb.startUpdating(true);
    },
    switch_client: function(guid) {
        // query for which raptor...
        // jQuery('#select_client').attr('disabled','disabled');
        var opts = { expires: 14, path: '/', domain: config.cookie_domain};
        jQuery.cookie('GUID', guid, opts); // sets the default session
        this.activate_session(guid);
    },
    clear: function() {
        jQuery.jStorage.set('falconStore.sessionKeys',null);
        jQuery.jStorage.set('utweb_display_settings',null);
    }
};





function logout() {
    utweb.logout();
}

window.clients = null;
window.utweb = null;

function load_community_webui_stuff(utweb) {
    utWebUI.defConfig.lang = jQuery.cookie('locale');
    utWebUI.defConfig.showDetails=false;
    utWebUI.defConfig.showCategories=false;
    utWebUI.defConfig.showStatusBar=false;
    utWebUI.defConfig.showToolbar=false;
    utWebUI.defConfig.showSpeedGraph=false;
    ContextMenu.init("ContextMenu");
    setupCategoryUI();
    setupTorrentJobsUI();
    setupDetailInfoPaneUI();
    //setupDividers();
    //setupNonGuest();
    setupToolbar();
    setupDialogManager();
    setupAddTorrentDialog();
    setupRSSDialogs();
    setupPropertiesDialog();
	setupDeleteTorrentDialog();
    setupAddURLDialog();
    setupAddLabelDialog( (utweb ? utweb.tables.torrent.view : undefined));
    setupSettings();
    //setupStatusBar();
    //resizeUI();
/*
    setupDialogManager();
    setupPropertiesDialog();
    setupSettings();
  */

    if (false && config && config.webui) {
        // dont save utwebui settings to cookie
        setupWindowEvents();
    }
  
    loadGlobalStrings();
    loadDialogStrings();
    loadSettingStrings();
    loadDetailPaneStrings();
    loadAboutStrings();
    loadRSSStrings();
    utWebUI.init();
    utWebUI.loadSettings();
}

function home_main() {
    // landing page main function
    window.clients = new ClientManager();
    clients.sync();
    console.log('landing page woot');
    console.log('got some clients', clients);
    _.each(clients._clients, function(c) { 
               var html = '<div>' + c.data.bt_user + '</div>';
               jQuery('#clients').append( jQuery(html) );
           });

}

function setRemoteSettingsTab() {
  jQuery("#tab_title_dlgSettings-UIExtras").css("padding-left", "15px");
  jQuery("#tab_title_dlgSettings-DiskCache").css("padding-left", "15px");
  jQuery("#tab_title_dlgSettings-RunProgram").css("padding-left", "15px");
  
  clients.get_current_client().raptor.api.unbind('got_token', setRemoteSettingsTab)
  if (! clients.get_current_client().raptor.api.token) {
    clients.get_current_client().raptor.api.bind('got_token', setRemoteSettingsTab)
    return;
  }
  utweb.current_client().raptor.post( { action: 'getversion' }, {}, 
    _.bind(function(resp, xhr) {

      if((resp.version.major_version + resp.version.minor_version * 0.1) >= 3.2 && resp.version.features.remote) return;

      jQuery('#tab_dlgSettings-Remote').hide().addClass('hidden')

      
    }, utweb), 
    _.bind(function() {
     console.log('failed', this, arguments)
    }, utweb)
  );
}

function main() {
    // called after jsload    
    window.clients = new ClientManager();
    // debug toolbar autologin here
    clients.sync();



    utweb = new uTorrentWeb_v2(null, clients);
    uki_main(exports._);
    utweb.view = uki_view;
    if (clients.active_guid) {
        clients.set_current_client(clients.active_guid);
    } else {
        clients.set_current_client();
    }

    utweb.bind_stuff();
    var _this = this;
    load_community_webui_stuff(utweb);

    jQuery(document).ready(function() {

        if (false) {
            sketch.config.url = '/static/js/sketch/sketch.sampling.json';
            sketch.config.id = function() {
                // Note that this is important to get right. A naive solution would be to
                // set a cookie (or use one that you've already set).
                return utweb.current_client().bt_user;
            };
            new sketch.report('falcon');
        }

        utweb.display_settings.load();

        if (! getfiles_enabled()) {
            display_columns['file'][ display_column_lookup['file']['Get File'] ].hidden = true;
        } else {
            // force show for plus
            display_columns['file'][ display_column_lookup['file']['Get File'] ].hidden = false;
        }

        utweb.display_settings.pre_attach_restore();




        utweb.attach_view(); // how long until this finishes?

        if (utweb.filereader._native) {
          console.log('can use native file upload! yay');
          utweb.toolbar.bind_stuff();
        } else {

          swfobject.embedSWF(config.static_prefix + "/static/flash/BTUploader.swf", "upload_btn", "24", "24", "10,0,0,0", null, {}, {
              "allowScriptAccess": "always",
              "play": "true",
              "wmode": "transparent"
          }, {
              "id": "btuploader"
          });
        }

        jQuery('#cover').hide();
        if (! utweb.current_client()) {
            if (config.asserts) { debugger; }
	    return utweb.redirect_logout('No active (default) session was set. Log in again to fix this.');

            // _this.login_popup = new LoginWindow({}, true);

            // return console.error('current client not set');

        }

        utweb.load_minimal_stuff( { getsettings: false } ); // getting settings before display update allows setting language

        setRemoteSettingsTab();

    });

    (function($){
        $(document).bind("idle.idleTimer", function(){ utweb.set_idle(true); });
        $(document).bind("active.idleTimer", function(){ utweb.set_idle(false); });
        $.idleTimer( config.idle_timeout * 1000 );
    })(jQuery);

}

function webui_main() {
    window.clients = new ClientManager();
    clients.sync();
    utweb = new uTorrentWeb_v2(null, clients);
    uki_main(exports._);
    utweb.view = uki_view;
    var client = new Client();
    clients.add(client);
    clients.set_current_client();

    // fetch settings first and setup language...

    utweb.bind_stuff();

/*
let mootools take window.$
    if (window.jQuery) {
        window.fjQuery = jQuery.noConflict();
    }
*/
    load_community_webui_stuff(utweb);

    utweb.display_settings.load();
    utweb.display_settings.pre_attach_restore();
    utweb.attach_view(); // how long until this finishes?
    jQuery('#cover').hide();
    utweb.load_minimal_stuff( { getsettings: true } );

    setRemoteSettingsTab();

    (function($){
      // Fake toolbar BG hack
      jQuery('#ToolbarBG').css('background-image', jQuery('#Toolbar').children(':first').css('background-image'));

  		$(document).bind("idle.idleTimer", function(){ utweb.set_idle(true); });
  		$(document).bind("active.idleTimer", function(){ utweb.set_idle(false); });
  		$.idleTimer( 30 * 60 * 1000 );
    })(jQuery);


}

window.webui_main = webui_main;
window.main = main;
window.home_main = home_main;
window.raptor = raptor;
window.client = null; // no longer use this as a global (utweb.current_client() instead)

})(exports._);
