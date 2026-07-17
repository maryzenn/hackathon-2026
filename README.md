# Waveback — audio time machine

One slider moves a track between authentic-sounding past playback eras and a
modern, AI-restored master.

**Back (degradation) is signal processing, not AI** — preset era buckets built
on the physics of old playback formats:

| Era | Playback | Processing |
| --- | --- | --- |
| 1950s | Vinyl | mono, 7.5 kHz rolloff, rumble filter, groove saturation, surface noise + crackle ticks |
| 1960s | AM / transistor radio | 280–3800 Hz bandpass, mono, small-speaker resonance, clipping, signal-strength fade, static |
| 1970s | Compact cassette | wow & flutter (modulated resampling), 11 kHz rolloff, head-bump EQ, tape compression, hiss |

**Forward (restoration) is AI, pretrained inference only** — DeepFilterNet3
denoising on CPU (no GPU needed), followed by a light modern-master chain
(air-band EQ, presence, loudness normalization). AudioSR bandwidth extension
is a stretch goal, not wired in.

## Run

### macOS / Linux

```sh
python3.11 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python server.py       # http://127.0.0.1:8000
```

### Windows (PowerShell)

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe server.py       # http://127.0.0.1:8000
```

To let the Expo app on a phone reach the API over your local network, start the
server like this instead:

```powershell
.\.venv\Scripts\python.exe -m uvicorn server:app --host 0.0.0.0 --port 8000
```

First restoration run downloads DeepFilterNet3 weights to its platform-specific
cache directory automatically; the server preloads the model at startup.

Note: `waveback_dsp._torchaudio_shim()` papers over DeepFilterNet 0.5.6
importing `torchaudio.backend.common`, which torchaudio ≥ 2.2 removed. If
DeepFilterNet is ever upgraded, try deleting the shim.

## Demo

- "…or try the built-in demo clip" loads `samples/voice.wav` (synthesized
  speech — no copyright risk on stage).
- Spectrograms render client-side for every era so the change is visible,
  not just audible.
- Suggested arc: original → 1950s → 1960s → 1970s → Master, then A/B the
  1960s vs Master spectrograms.

## Mobile app (React Native + Expo + TypeScript)

`mobile/` is an Expo app with the same era timeline, playback via
`expo-audio`, native share sheet for the processed WAV, and an optional
librosa analysis card.

```sh
cd mobile
npm install
npx expo start          # scan the QR with Expo Go; --web for a browser tab
```

The phone reaches the API over LAN: `server.py` must run with
`--host 0.0.0.0`, and `mobile/config.ts` must hold the Mac's current IP
(`ipconfig getifaddr en0`). Node is installed via nvm
(`~/.nvm/versions/node/v24.18.0/bin` — not on PATH by default).

## Audio analysis (optional, librosa)

`GET /api/analyze/{track_id}` returns tempo, energy, brightness, a rough
key guess, and a mood heuristic. It only runs on tracks uploaded through
the app (user-owned / royalty-free clips) — don't point it at streamed
commercial audio.

## Architecture

- `server.py` — FastAPI: upload once (`/api/upload`, `/api/demo`), then
  `/api/audio/{id}/{era}` renders and caches each era as WAV;
  `/api/analyze/{id}` for librosa features. CORS is open for the Expo dev
  origins.
- `waveback_dsp.py` — era presets (scipy/numpy) + DeepFilterNet wrapper.
- `waveback_analysis.py` — librosa feature extraction.
- `static/index.html` — self-contained web UI: era timeline with snap stops,
  drag-and-drop upload, before/after players, JS FFT spectrograms
  (log-frequency, -90…-15 dB range).
- `mobile/` — Expo app (`App.tsx`, `config.ts`).

Uploads are limited to the first 2 minutes; accepted formats are whatever
libsndfile decodes (WAV, FLAC, OGG, MP3).
