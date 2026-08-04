function Bandplan(el) {
    this.el      = el;
    this.bands   = [];
    this.ctx     = null;
    this.enabled = false;

    // Make sure canvas fills the container
    el.style.width  = '100%';
    el.style.height = '100%';

    // Redraw bandplan once it fully shows up
    var me = this;
    el.parentElement.addEventListener("transitionend", function(ev) {
        me.draw();
    });

    // Colors used for band types
    this.colors = {
        'hamradio' : '#006000',
        'broadcast': '#000080',
        'public'   : '#400040',
        'service'  : '#800000'
    };
};

Bandplan.prototype.getColor = function(type) {
    // Default color is gray
    return type in this.colors? this.colors[type] : '#808080';
};

Bandplan.prototype.update = function(bands) {
    // Sort by low_bound for accurate rendering of overlapping bands
    this.bands = bands.sort(function (a, b) {
        return a.low_bound - b.low_bound;
    });

    // Draw new bands
    this.draw();
};

Bandplan.prototype.draw = function() {
    // Must be enabled to draw
    if (!this.enabled) return;

    var width  = this.el.offsetWidth;
    var height = this.el.offsetHeight;

    // If new dimensions are available...
    if ((height>0) && (width>0)) {
        // If canvas got resized or no context yet...
        if (!this.ctx || width!=this.el.width || height!=this.el.height) {
            this.el.width  = width;
            this.el.height = height;

            this.ctx = this.el.getContext('2d');
            this.ctx.lineWidth = height - 2;
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.textAlign = 'center';
            this.ctx.font = 'bold 11px sans-serif';
            this.ctx.textBaseline = 'middle';
        }
    }

    // Use whatever dimensions we have at the moment
    width  = this.el.width;
    height = this.el.height;

    // Must have context and dimensions here
    if (!this.ctx || !height || !width) return;

    // Clear canvas to transparency
    this.ctx.clearRect(0, 0, width, height);

    // Do not draw anything if there is nothing to draw
    var range = get_visible_freq_range();
    if (!range || !this.bands.length) return;

    // Center of the ribbon
    var center = (height - 2) / 2;

    //console.log("Drawing range of " + range.start + " - " + range.end);

    this.bands.forEach((x) => {
        if (x.low_bound < range.end && x.high_bound > range.start) {
            var start = Math.max(scale_px_from_freq(x.low_bound, range), 0);
            var end = Math.min(scale_px_from_freq(x.high_bound, range), width);
            var tag = x.tags.length > 0? x.tags[0] : '';

            //console.log("Drawing " + x.name + "(" + tag + ", " + x.low_bound
            //    + ", " + x.high_bound + ") => " + start + " - " + end);

            this.ctx.strokeStyle = this.getColor(tag);

            this.ctx.beginPath();
            this.ctx.moveTo(start, center);
            this.ctx.lineTo(end, center);
            this.ctx.stroke();

            var label = x.name;
            for (var j = 0 ; j >= 0 ; )
            {
                var w = this.ctx.measureText(label).width;
                if (w + height * 2 <= end - start) {
                    this.ctx.fillText(label, (start + end) / 2, center);
                    break;
                }

                j = label.lastIndexOf(' ');
                if (j >= 0) {
                    label = label.substring(0, j);
                }
            }
        }
    });
};

Bandplan.prototype.toggle = function(on) {
    // If no argument given, toggle bandplan
    if (typeof(on) === 'undefined') on = !this.enabled;

    if (on != this.enabled) {
        this.enabled = on;
        if (on) {
            this.el.parentElement.classList.add('expanded');
            // Try drawing right away, since we may know dimensions
            this.draw();
        } else {
            this.el.parentElement.classList.remove('expanded');
        }
    }
};
