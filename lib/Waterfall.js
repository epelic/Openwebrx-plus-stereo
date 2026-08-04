//
// Waterfall colors
//

function Waterfall() {}

Waterfall.colors       = chroma.scale([0x000000, 0xFFFFFF]).colors(256, 'rgb');
Waterfall.levels       = { min: -150, max: 0 };
Waterfall.fixed_levels = { min: -150, max: 0 };
Waterfall.auto_levels  = { min: -150, max: 0 };
Waterfall.cont_levels  = { min: -150, max: 0 };
Waterfall.auto_min_range = 0;
Waterfall.measure_minmax_now = false;
Waterfall.measure_minmax_continuous = false;

// Get current waterfall min/max levels range.
Waterfall.getRange = function() {
    return this.levels;
};

// Set waterfall color theme, passed as an array of
// integer RGB values.
Waterfall.setTheme = function(theme) {
    this.colors = chroma.scale(theme).colors(256, 'rgb');
};

// Configure waterfall parameters from the attributes
// sent by the server.
Waterfall.configure = function(config) {
    if ('waterfall_levels' in config)
        this.fixed_levels = config['waterfall_levels'];
    if ('waterfall_auto_levels' in config)
        this.auto_levels = config['waterfall_auto_levels'];
    if ('waterfall_auto_min_range' in config)
        this.auto_min_range = config['waterfall_auto_min_range'];
    if ('waterfall_auto_level_default_mode' in config)
        this.toggleContinuousRange(config['waterfall_auto_level_default_mode']);
};

// Use one-time automatic min/max level update.
Waterfall.setAutoRange = function() {
    this.measure_minmax_now = true;
};

// Use default min/max levels.
Waterfall.setDefaultRange = function() {
    this.levels.min = this.fixed_levels.min;
    this.levels.max = this.fixed_levels.max;
    this.updateSliders();
    this.resetContinuousColors();
};

// Enable continuous min/max level updates.
Waterfall.toggleContinuousRange = function(on) {
    // If no argument given, toggle continuous mode
    on = typeof(on) === 'undefined'? !this.measure_minmax_continuous : on;

    this.measure_minmax_continuous = on;

    var autoButton = $('#openwebrx-waterfall-colors-auto');
    autoButton[on ? 'addClass' : 'removeClass']('highlighted');
    $('#openwebrx-waterfall-color-min, #openwebrx-waterfall-color-max').prop('disabled', on);
};

// Update waterfall min/max levels from sliders.
Waterfall.updateColors = function(which) {
    var $wfmax = $("#openwebrx-waterfall-color-max");
    var $wfmin = $("#openwebrx-waterfall-color-min");

    this.levels.max = parseInt($wfmax.val());
    this.levels.min = parseInt($wfmin.val());

    if (this.levels.min >= this.levels.max) {
        if (!which) {
            this.levels.min = this.levels.max -1;
        } else {
            this.levels.max = this.levels.min + 1;
        }
    }

    this.updateSliders();
};

// Update waterfall level sliders from min/max levels.
Waterfall.updateSliders = function() {
    $('#openwebrx-waterfall-color-max')
        .val(this.levels.max)
        .attr('title', 'Waterfall maximum level (' + Math.round(this.levels.max) + ' dB)');
    $('#openwebrx-waterfall-color-min')
        .val(this.levels.min)
        .attr('title', 'Waterfall minimum level (' + Math.round(this.levels.min) + ' dB)');
};

// Update automatic min/max levels.
Waterfall.updateAutoColors = function(levels) {
    var min_level = levels.min - this.auto_levels.min;
    var max_level = levels.max + this.auto_levels.max;

    max_level = Math.max(min_level + (this.auto_min_range || 0), max_level);

    this.levels.min = min_level;
    this.levels.max = max_level;
    this.updateSliders();
};

// Reset continuous min/max levels.
Waterfall.resetContinuousColors = function() {
    this.cont_levels.min = this.levels.min;
    this.cont_levels.max = this.levels.max;
};

// Update continous min/max levels.
Waterfall.updateContinuousColors = function(levels) {
    if (levels.max > this.cont_levels.max + 1) {
        this.cont_levels.max += 1;
    } else if (levels.max < this.cont_levels.max - 1) {
        this.cont_levels.max -= 0.1;
    }

    if (levels.min < this.cont_levels.min - 1) {
        this.cont_levels.min -= 1;
    } else if (levels.min > this.cont_levels.min + 1) {
        this.cont_levels.min += 0.1;
    }

    this.updateAutoColors(this.cont_levels);
};

// Measure min/max levels from the incoming data, if necessary.
Waterfall.measureRange = function(data) {
    // Drop out unless we actually need to measure levels
    if (!this.measure_minmax_now && !this.measure_minmax_continuous) return;

    // Get visible range of frequencies
    var range = get_visible_freq_range();
    var start = center_freq - bandwidth / 2;

    // This is based on an oversampling factor of about 1.25
    range.start = Math.max(0.1, (range.start - start) / bandwidth);
    range.end   = Math.min(0.9, (range.end - start) / bandwidth);

    // Align to the range edges, do not let things flip over
    if (range.start >= 0.9)
        range.start = range.end - range.bw / bandwidth;
    else if (range.end <= 0.1)
        range.end = range.start + range.bw / bandwidth;

    // Find min/max levels within the range
    data = data.slice(range.start * data.length, range.end * data.length);
    var levels = {
        min: Math.min.apply(Math, data),
        max: Math.max.apply(Math, data)
    };

    if (this.measure_minmax_now) {
        this.measure_minmax_now = false;
        this.updateAutoColors(levels);
        this.resetContinuousColors();
    }

    if (this.measure_minmax_continuous) {
        this.updateContinuousColors(levels);
    }
};

// Create a color based on the dB value and current color theme.
Waterfall.makeColor = function(db) {
    var v = (db - this.levels.min) / (this.levels.max - this.levels.min);
    v = Math.max(0, Math.min(1, v)) * (this.colors.length - 1);
    var i = Math.floor(v);
    v = v - i;

    if (v == 0) {
        return this.colors[i];
    } else {
        var c0 = this.colors[i];
        var c1 = this.colors[i+1];
        return [
            c0[0] + v * (c1[0] - c0[0]),
            c0[1] + v * (c1[1] - c0[1]),
            c0[2] + v * (c1[2] - c0[2])
        ];
    }
};

// Draw a single line of waterfall pixels based on the input data.
Waterfall.drawLine = function(out, data, offset = 0) {
    var y = 0;
    for (var x = 0; x < data.length; x++) {
        var color = this.makeColor(data[x] + offset);
        out[y++] = color[0];
        out[y++] = color[1];
        out[y++] = color[2];
        out[y++] = 255;
    }
};
