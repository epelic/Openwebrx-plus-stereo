// Max Mountain Station - map plugins
(async () => {
  try {
    const BASE = 'https://0xaf.github.io/openwebrxplus-plugins/map';
    await Plugins.load(`${BASE}/reduce_map_legend_sections/reduce_map_legend_sections.js`);
  } catch (error) {
    console.warn('[MAX MOUNTAIN] Plugin mappa non caricato', error);
  }
})();
