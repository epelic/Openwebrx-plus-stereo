function Spectrum(el, msec) {
    this.el    = el;
    this.msec  = msec;
    this.ctx   = null;
    this.min   = 0;
    this.max   = 0;
    this.timer = 0;
    this.data  = [];

    // Make sure canvas fills the container
    el.style.width  = '100%';
    el.style.height = '100%';

    // Start with hidden spectrum display
    this.close();
};

Spectrum.prototype.update = function(data) {
    // Do not update if no redraw timer or no canvas
    if (!this.timer || (this.el.clientHeight == 0)) return;

    var i = this.data.length < data.length? this.data.length : data.length;

    // Truncate stored data length, add and fill missing data
    if (this.data.length > i) {
        this.data.length = i;
    } else if(this.data.length < data.length) {
        this.data.length = data.length;
        for(var j=i; j<data.length; ++j) this.data[j] = data[j];
    }

    // Average level over time
    for(var j=0; j<i; ++j) {
        this.data[j] = data[j]>this.data[j]?
            data[j] : this.data[j] + (data[j] - this.data[j]) / 10.0;
    }

//    this.min = Math.min(...data);
//    this.max = Math.max(...data);
    var wf_range = Waterfall.getRange();
    this.min = wf_range.min - 5;
    this.max = wf_range.max + 5;
};

Spectrum.prototype.draw = function() {
    // Do not draw if no redraw timer or no canvas
    if (!this.timer || (this.el.clientHeight == 0)) return;

    var vis_freq    = get_visible_freq_range();
    var vis_center  = vis_freq.center;
    var vis_start   = 0.5 - (center_freq - vis_freq.start) / bandwidth;
    var vis_end     = 0.5 - (center_freq - vis_freq.end) / bandwidth;

    var data_start  = Math.round(fft_size * vis_start);
    var data_end    = Math.round(fft_size * vis_end);
    var data_width  = data_end - data_start;
    var data_height = Math.abs(this.max - this.min);
    var spec_width  = this.el.offsetWidth;
    var spec_height = this.el.offsetHeight;

    // If canvas got resized, or no context yet...
    if (!this.ctx || spec_width!=this.el.width || spec_height!=this.el.height) {
        this.el.width  = spec_width;
        this.el.height = spec_height;
        this.ctx = this.el.getContext("2d");
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        this.ctx.strokeStyle = "rgba(255, 255, 0, 1.0)";
        this.ctx.lineWidth = 1;
    }

    // Clear canvas to transparency
    this.ctx.clearRect(0, 0, spec_width, spec_height);

    // Mark currently tuned frequences
//    var demodulators = getDemodulators();
//    for (var i=0; i<demodulators.length; i++) {
//        var f = demodulators[i].get_offset_frequency() + center_freq;
//        var x = scale_px_from_freq(f, range);
//        this.ctx.beginPath();
//        this.ctx.moveTo(x, 0);
//        this.ctx.lineTo(x, spec_height);
//        this.ctx.stroke();
//    }

    // Draw spectrum
    if(spec_width <= data_width) {
        var x_ratio = data_width / spec_width;
        var y_ratio = spec_height / data_height;
        for(var x=0; x<spec_width; x++) {
            var y = (this.data[data_start + ((x * x_ratio) | 0)] - this.min) * y_ratio;
            this.ctx.fillRect(x, spec_height, 1, -y);
        }
    } else {
        var x_ratio = spec_width / data_width;
        var y_ratio = spec_height / data_height;
        var x_pos   = 0;
        for(var x=0; x<data_width; x++) {
            var y = (this.data[data_start + x] - this.min) * y_ratio;
            var k = ((x + 1) * x_ratio) | 0;
            this.ctx.fillRect(x_pos, spec_height, k - x_pos, -y);
            x_pos = k;
        }
    }
};

Spectrum.prototype.close = function() {
    // Hide container
    this.el.parentElement.classList.remove('expanded');

    // Stop redraw timer
    if (this.timer) {
        clearInterval(this.timer);
        this.timer = 0;
    }

    // Clear spectrum data
    this.data = [];
};

Spectrum.prototype.open = function() {
    // Show container
    this.el.parentElement.classList.add('expanded');

    // Start redraw timer
    if (!this.timer) {
        var me = this;
        this.timer = setInterval(function() { me.draw(); }, this.msec);
    }
};

Spectrum.prototype.toggle = function(on) {
    // If no argument given, toggle spectrum
    if (typeof(on) === 'undefined') on = !this.timer;

    // Toggle based on the current redraw timer state
    if (this.timer && !on) {
        this.close();
    } else if (!this.timer && on) {
        this.open();
    }
};
