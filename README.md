# OpenWebRX+ Stereo

Customization of OpenWebRX+ for Max Mountain Station.

Features:

- responsive receiver interface;
- mode controls synchronized with native controls;
- integrated S-meter and audio spectrum;
- green-line RF spectrum and adaptive waterfall;
- extended DAB data panel;
- DAB+ stereo playback with dynamic support for 32 and 48 kHz;
- mitigation of brief DAB audio stream dropouts.

The csdr modification required for the DAB pipeline is located in
backend/csdr/module/toolbox.py.

The repository does not include receiver configurations,
credentials, or installation-specific data.

Check it here: http://maxmountainstation.ddns.net:8073/

## Automatic installation on Raspberry Pi

This installer is intended for an existing, working Debian/Raspberry Pi OS
installation of OpenWebRX+. It creates a timestamped backup before changing
files, preserves receiver configuration and credentials, installs the web
interface and the DAB stereo csdr module, then restarts OpenWebRX.

```bash
curl -fsSL https://raw.githubusercontent.com/epelic/Openwebrx-plus-stereo/main/install.sh | sudo bash -s -- --yes
```

Run a detection-only test first:

```bash
curl -fsSL https://raw.githubusercontent.com/epelic/Openwebrx-plus-stereo/main/install.sh | sudo bash -s -- --dry-run
```

For the interface only, without modifying the DAB pipeline:

```bash
curl -fsSL https://raw.githubusercontent.com/epelic/Openwebrx-plus-stereo/main/install.sh | sudo bash -s -- --no-backend --yes
```

The backup path is printed at the end of the installation. This customization
tracks the OpenWebRX+ package layout used by the Max Mountain Station; review
the diff and keep a system backup when installing on a different release.

# OpenWebRX+ Stereo

Personalizzazione di OpenWebRX+ per Max Mountain Station.

Contiene:

- interfaccia ricevitore responsive;
- controlli modo sincronizzati con i controlli nativi;
- S-meter e spettro audio integrati;
- RF spectrum a linea verde e waterfall adattiva;
- pannello dati DAB esteso;
- riproduzione DAB+ stereo con supporto dinamico a 32 e 48 kHz;
- mitigazione delle interruzioni brevi del flusso audio DAB.

La modifica csdr necessaria alla pipeline DAB si trova in
`backend/csdr/module/toolbox.py`.

Il repository non include configurazioni del ricevitore, credenziali o dati
specifici dell'installazione.

Qui in funzione: http://maxmountainstation.ddns.net:8073/

## Installazione automatica su Raspberry Pi

Lo script è destinato a un'installazione OpenWebRX+ già funzionante su
Debian/Raspberry Pi OS. Prima di modificare i file crea un backup con data e
ora, conserva configurazioni e credenziali, installa l'interfaccia e il modulo
csdr per il DAB stereo, quindi riavvia OpenWebRX.

```bash
curl -fsSL https://raw.githubusercontent.com/epelic/Openwebrx-plus-stereo/main/install.sh | sudo bash -s -- --yes
```

Per controllare i percorsi senza modificare nulla:

```bash
curl -fsSL https://raw.githubusercontent.com/epelic/Openwebrx-plus-stereo/main/install.sh | sudo bash -s -- --dry-run
```

Per installare soltanto l'interfaccia, senza modificare la pipeline DAB:

```bash
curl -fsSL https://raw.githubusercontent.com/epelic/Openwebrx-plus-stereo/main/install.sh | sudo bash -s -- --no-backend --yes
```

Al termine viene mostrato il percorso del backup. La personalizzazione segue
la struttura del pacchetto OpenWebRX+ usato da Max Mountain Station: su una
release differente è consigliabile controllare il diff e conservare anche un
backup completo del sistema.
