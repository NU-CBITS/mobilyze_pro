// CheckConnectivity.js

//  Create an object to keep track of Connectivity
//  and respond when Connectivity state changes.
//  Creates a global boolean, INTERNET_CONNECTIVITY
//  by which any other code can check the current state of connectivity.
//  

// A Global object which can 
// check the state of connectivity to a particular server
// and take action on Loss or Revival of that connectivity.
// Works on:
// - a standard browser
// - a phonegap-built native web-view (hopefully);
// In order to have it work in those two scenarios,
// set the 'onMobileDevice' attribute accordingly
SERVER_CONNECTIVITY = { 
  currentTimeoutID: null,
  el: null,
  is: false,
  was: false, // (localStorage.getItem("Connectivity") == "true"),
  pollPeriodically: false,
  min_period: 5000, //i.e. check no more often than every 5s
  max_online_period: 30*1000, //i.e. once online, increase period to no more than 30s
  max_offline_period: 5*60*1000, // Once offline, check no less often than every 5 minutes
  period: 5000,
  serverURL: null,

  after_initialize:function() {
    if (!this.el) { 
      console.warn("No element defined for Connectivity object");
      this.$el = $("<div></div>");
    }
    else {
      this.$el = $(this.el);
    };
  },

  initialize: function() {
    _.bindAll(SERVER_CONNECTIVITY);
    this.after_initialize();
  },

  exists: function() { return (this.is == true) },

  // If you wish to use this on a mobile device,
  // w/ cordova/phonegap,  
  // you must call this method once cordova is loaded.
  onMobileDeviceReady: function() {
    // now that Cordova is loaded and 
    // it is safe to make calls to Cordova methods
    // re-write the 'shouldAttemptAjaxCall' to use Cordova:
    SERVER_CONNECTIVITY.shouldAttemptAjaxCall = function() {
      var current_connectivity = navigator.network.connection.type;
      return (  current_connectivity == Connection.WIFI || 
                current_connectivity == Connection.CELL_4G ||
                current_connectivity == Connection.CELL_3G ||
                current_connectivity == Connection.ETHERNET
              );
    };
    SERVER_CONNECTIVITY.initialize();
  },

  onLoss: function() {
    console.log("In onLoss");
    $(this.el).text("offline");
    this.onLossCallback();
  },  
  onLossCallback: function() {},

  onRevive: function() {
    var self = this;
    console.log("In onRevive");
    this.$el.text("online");
    setTimeout(function() { 
      self.$el.empty(); 
      self = null;
    }, 3000);
    self.onReviveCallback();
  },
  onReviveCallback: function() {},

  check: function() {
    var self = this;

    //Checking now, eliminate any planned future check.
    if (self.currentTimeoutID) {
      clearTimeout(self.currentTimeoutID);
      self.currentTimeoutID = null;
    }

    if (self.shouldAttemptAjaxCall()) {

      //is this try/catch necessary anymore?
      try {
        $.get(this.serverURL)
          .success(function() {
            console.log('Connectivity: online');
            self.setConnectivityAs(true);
          })
          .error(function() {
            console.log('Connectivity: offline');
            self.setConnectivityAs(false);
          })

      }
      catch (error) {
        console.warn("Error trying to issue get request to TriremeURL ??", error);
        self.setConnectivityAs(false);
      };

    }
    else {
      self.setConnectivityAs(false);
    }

    if (this.pollPeriodically) { this.setNextPoll(); }

  },

  shouldAttemptAjaxCall: function() {
    // if on the phone, then this method will be overwritten once 
    // Cordova is loaded and 'onMobileDeviceReady' is called.

    // if we're not on the phone, then assume we're in the browser
    // and in that case, this should return true
    // as the subsequently executed ajax call 
    // can fail without complete app failure.
    return true;
  },

  setConnectivityAs: function(connectivity_state) {
    localStorage.setItem("Connectivity", ""+(connectivity_state == true))
    if (connectivity_state == false) {
      this.was = this.is;
      this.is = false;
      if (this.was == true) {
        this.onLoss();
      };
      return;
    };
    if (connectivity_state == true) {
      this.was = this.is;
      this.is = true;
      if (this.was == false) {
        this.onRevive();
      };
      return;
    };
  },

  setNextPoll: function() {
    var self = this;
    if (this.currentTimeoutID) {  clearTimeout(this.currentTimeoutID) };
    console.log('Next poll in '+(self.period/1000)+'s');
    this.currentTimeoutID = setTimeout(self.check, self.period);
  }

 };

 console.log("Server Connectivity Starts As:", SERVER_CONNECTIVITY.was)