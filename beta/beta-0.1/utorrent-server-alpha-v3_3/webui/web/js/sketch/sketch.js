/**
 * @author: Thomas Rampelberg <thomas@saunter.org>
 *
 * Copyright(c) 2011 BitTorrent Inc.
 */

(function($,_) {

  var sketch = {};

  sketch.config = {
    url: '/404',
    container_class: '.sketch-container',
    id: function() { return 'default' }
  };

  sketch.report = function(app) {
    _.bindAll(this, 'init', 'process', 'send');
    // XXX - Should the app name go in the json file?
    this.app = app;
    $.ajax({
      url: sketch.config.url,
      success: this.init,
      dataType: 'json'
    });
  };

  sketch.report.prototype = {
    init: function(_config) {
      this.config = _.extend({}, sketch.config, _config);
      if (Math.random() < this.config.rate)
        $("body").bind("mousedown", this.process);
    },
    process: function(e) {
      var container = $(e.srcElement).closest(
        this.config.container_class);
      if (!container || container.length == 0)
        container = $("body");
      var data = {
        app: this.app,
        x: e.clientX,
        y: e.clientY,
        offset_x: container[0].scrollLeft,
        offset_y: container[0].scrollTop,
        width: container.width(),
        height: container.height(),
        name: container.attr("id"),
        count: 1,
        id: sketch.config.id()
      }

      this.send(data);
    },
    send: function(data) {
      $.ajax({
        url: this.config.report,
        dataType: 'jsonp',
        data: data,
        success: function() { $("head script").last().remove(); }
      });
    }
  };

  window.sketch = sketch;

  $.fn.rectangle = function() {
    if (this.length == 0) return
    return this.get(0).getClientRects()[0];
  };

})(jQuery, exports._);
