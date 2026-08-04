// Max Mountain Station - Military SDR plugin pack v2
// Plugins are loaded from the official community collection.
// Hardware-control plugins are intentionally disabled by default.

Plugins._enable_debug = false;

// Fine tuning buttons suitable for broadcast, airband and amateur radio.
Plugins.tune_precise_steps = [100000, 12500, 6250, 1000, 100, 10];

const BASE = 'https://0xaf.github.io/openwebrxplus-plugins/receiver';

const PluginsToLoad = [
  'colorful_spectrum',
  'compact_analog_modes',
  'connect_notify',
  'freq_scanner',
  'frequency_far_jump',
  'magic_key',
  'minimap',
  'mouse_freq',
  'screenshot',
  'search_bookmarks',
  'show_band_plan',
  'smeter',
  'sort_profiles',
  'toggle_scannable',
  'tune_checkbox',
];

(async () => {
  try {
    await Plugins.load(`${BASE}/utils/utils.js`);
    await Plugins.load(`${BASE}/notify/notify.js`);

    for (const pluginName of PluginsToLoad) {
      try {
        await Plugins.load(`${BASE}/${pluginName}/${pluginName}.js`);
      } catch (error) {
        console.warn(`[MAX MOUNTAIN] Plugin ${pluginName} non caricato`, error);
      }
    }
  } catch (error) {
    console.error('[MAX MOUNTAIN] Impossibile inizializzare i plugin', error);
  }
})();
