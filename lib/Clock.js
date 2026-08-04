function Clock(el) {
    // Save HTML element to update
    this.el = el;
    // Update for the first time
    this.update();
}

Clock.prototype.update = function() {
    const now = new Date();
    const me = this;

    // Next update at the next minute change
    setTimeout(function() { me.update(); }, 1000 * (60 - now.getUTCSeconds()));

    // Display UTC clock
    if (this.el) {
        const hours = ("00" + now.getUTCHours()).slice(-2);
        const minutes = ("00" + now.getUTCMinutes()).slice(-2);
        this.el.html(`${hours}:${minutes} UTC`);
    }
}
