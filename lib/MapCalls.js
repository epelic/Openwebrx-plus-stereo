//
// Map Calls Management
//

CallManager.strokeOpacity = 0.5;

function CallManager() {
    // Current calls
    this.calls     = [];
    this.colorMode = 'band';
    this.filterBy  = null;
}

CallManager.prototype.add = function(call) {
    // Remove excessive calls
    while (this.calls.length > 0 && this.calls.length >= max_calls) {
        var old = this.calls.shift();
        old.setMap();
    }

    // Do not try adding if calls display disabled
    if (max_calls <= 0) return false;

    // Add new call
    call.reColor(this.colorMode, this.filterBy);
    this.calls.push(call);
    return true;
};

CallManager.prototype.ageAll = function() {
    var now = new Date().getTime();
    var out = [];
    this.calls.forEach((x) => { if (x.age(now)) out.push(x) });
    this.calls = out;
};

CallManager.prototype.clear = function() {
    // Remove all calls from the map
    this.calls.forEach((x) => { x.setMap(); });
    // Delete all calls
    this.calls = [];
};

CallManager.prototype.setFilter = function(filterBy = null) {
    this.filterBy = filterBy;
    this.reColor();
};

CallManager.prototype.setColorMode = function(colorMode) {
    // Clearing filter when color mode is changed
    this.colorMode = colorMode;
    this.setFilter();
};

CallManager.prototype.reColor = function() {
    this.calls.forEach((x) => { x.reColor(this.colorMode, this.filterBy); });
};

//
// Generic Map Call
//     Derived classes have to implement:
//     setMap(), setEnds(), setColor(), setOpacity()
//

function Call() {}

Call.prototype.create = function(data, map) {
    // Update call information
    this.caller   = data.caller;
    this.callee   = data.callee;
    this.src      = data.src;
    this.dst      = data.dst;
    this.band     = data.band;
    this.mode     = data.mode;
    this.lastseen = data.lastseen;

    // Make a call between two maidenhead squares
    var src = Utils.loc2latlng(this.src.locator);
    var dst = Utils.loc2latlng(this.dst.locator);
    this.setEnds(src[0], src[1], dst[0], dst[1]);

    // Place on the map
    this.setMap(map);

    // Age call
    this.age(new Date().getTime());
}

Call.prototype.reColor = function(colorMode, filterBy = null) {
    this.setOpacity(
        colorMode==='off'? 0
      : filterBy==null?    CallManager.strokeOpacity
      : colorMode==='band' && this.band==filterBy? CallManager.strokeOpacity
      : colorMode==='mode' && this.mode==filterBy? CallManager.strokeOpacity
      : 0
    );
};

Call.prototype.age = function(now) {
    if (now - this.lastseen > call_retention_time) {
        this.setMap();
        return false;
    }

    return true;
};
