/*
 * generic logging and error handling for jquery
 * Copyright (c) 2010 BitTorrent Inc.
 *
 * Date: %date%
 * Revision: %revision%
 */

jQuery.fn.log = function (msg) {
  if (window.console && window.console.log)
    console.log("%s: %o", msg, this);
  return this;
};

(function($) {

  var stamp = function() { return new Date().toString('HH:MM:ss') };

  $.extend({
    log: {
      error: function(err) {
        if (window.console && window.console.error)
          console.error('%s-%o', stamp(), err);
      },
      debug: function(msg) {
        if (window.console && window.console.debug)
            console.log('%s-%o', stamp(), msg);
      }
    },
    debug: function(msg) { $.log.debug(msg); }
  });
})(jQuery);
