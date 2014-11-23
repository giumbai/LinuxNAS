/**
This class is used to track events simultaneously to Mixpanel and to Google Analytics.
Usage: eventTracker.track('Login', 'SendUser', {'label': 'TestLabel', 'value': 0, 'weapon': 'sword', 'class': 'knight'});
*/

function EventTracker(){
  
  this.track = function(category, action, properties) {
    if (config.dev_mode || ! config.track_events || config.webui) { return; }
    if (category === 'ErrorEvent') { this.trackErrorEvents(category, action, properties); return; }
    this.trackGoogleAnalytics(category, action, properties);
  };
  
  this.trackGoogleAnalytics = function(category, action, properties) {
    var label, value;
    if (properties) {
      label = properties['label'];
      value = properties['value'];
    }
    if (label && value) {
      _gaq.push(['_trackEvent', category, action, label, value]);
    }
    else if (label) {
      _gaq.push(['_trackEvent', category, action, label]);      
    }
    else
      _gaq.push(['_trackEvent', category, action]);          
  };

  this.trackErrorEvents = function(category, action, properties) {
    var label, value;
    if (properties) {
      label = action + ' - ' + properties['client_agent'];
    }
    if (label) {
      _gaq.push(['_trackEvent', category, action, label]);
    } else {
      _gaq.push(['_trackEvent', category, action]);
    }
  };
  
  this.trackMixpanel = function(category, action, properties) {
      // when an error occurs here, execution context goes away. why?
    mixPanelEventName = category + '/' + action;
      if (!properties || typeof(properties.label) == 'string' || typeof(properties.label) == 'number') {
          mpq.push(["track", mixPanelEventName, properties]); // WARNING:::
      // somehow we lose execution context if the properties.label is
      // not a string
      } else {
		if (window.console && console.log)
          console.error('Error tracking mixpanel stat',category,action,properties,'properties.label is not a string');
      }
  };
}

var eventTracker = new EventTracker();
