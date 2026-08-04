// Inizializzazione dei plugin per OpenWebRX+
// Copia questo codice in htdocs/plugins/receiver/init.js

// Abilita il debug nella console del browser in caso di problemi (opzionale)
// Plugins._enable_debug = true;

// Elenco dei plugin della community da attivare
const PluginsToLoad = [
    'colorful_spectrum',        // Colori dello spettro migliorati e più definiti
    'compact_analog_modes',     // Ottimizzazione dei modi analogici (AM/FM/SSB)
    'show_band_plan',           // Mostra la barra delle bande frequenze di default
    'mouse_freq',               // Mostra la frequenza esatta sotto il puntatore del mouse
    'screenshot'                // Aggiunge la funzione per catturare lo spettro
];

(async () => {
    // Caricamento delle dipendenze condivise obbligatorie
    await Plugins.load('https://0xaf.github.io/openwebrxplus-plugins/receiver/utils/utils.js');
    await Plugins.load('https://0xaf.github.io/openwebrxplus-plugins/receiver/notify/notify.js');

    // Caricamento sequenziale dei plugin definiti nella lista
    for (const pluginName of PluginsToLoad) {
        await Plugins.load(`https://0xaf.github.io/openwebrxplus-plugins/receiver/${pluginName}/${pluginName}.js`);
    }
})();

// vim: ft=javascript
