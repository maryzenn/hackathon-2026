"""Waveback server: upload a track, move it through time.

POST /api/upload            -> {"id", "duration", "sr"}
GET  /api/audio/{id}/{era}  -> processed WAV (era: 1950s|1960s|1970s|original|modern)
GET  /api/status            -> {"deepfilternet": bool}
"""

from __future__ import annotations

import io
import threading
import uuid
from pathlib import Path

import numpy as np
import soundfile as sf
from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles

import waveback_analysis as analysis
import waveback_dsp as dsp

MAX_SECONDS = 120  # keep demo processing snappy
STATIC_DIR = Path(__file__).resolve().parent / "static"

app = FastAPI(title="Waveback")

# Expo dev server / Expo Go run on a different origin than this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_tracks: dict[str, tuple[np.ndarray, int]] = {}
_cache: dict[tuple[str, str], bytes] = {}
_analysis_cache: dict[str, dict] = {}
_lock = threading.Lock()


def _wav_bytes(audio: np.ndarray, sr: int) -> bytes:
    buf = io.BytesIO()
    sf.write(buf, audio, sr, format="WAV", subtype="PCM_16")
    return buf.getvalue()


@app.on_event("startup")
def preload_model():
    if dsp.deepfilternet_available():
        threading.Thread(target=dsp._load_deepfilternet, daemon=True).start()


@app.get("/api/status")
def status():
    return {
        "deepfilternet": dsp.deepfilternet_available(),
        "analysis": analysis.librosa_available(),
    }


@app.get("/api/analyze/{track_id}")
def analyze_track(track_id: str):
    with _lock:
        if track_id not in _tracks:
            raise HTTPException(404, "Unknown track id — upload again.")
        cached = _analysis_cache.get(track_id)
    if cached is not None:
        return cached
    if not analysis.librosa_available():
        raise HTTPException(503, "librosa is not installed on the server.")
    audio, sr = _tracks[track_id]
    result = analysis.analyze(audio, sr)
    with _lock:
        _analysis_cache[track_id] = result
    return result


def _register(audio: np.ndarray, sr: int) -> dict:
    audio = audio[: sr * MAX_SECONDS]
    track_id = uuid.uuid4().hex[:12]
    with _lock:
        _tracks[track_id] = (audio, sr)
    return {"id": track_id, "duration": len(audio) / sr, "sr": sr}


@app.post("/api/upload")
async def upload(file: UploadFile):
    raw = await file.read()
    try:
        audio, sr = sf.read(io.BytesIO(raw), dtype="float32", always_2d=True)
    except Exception:
        raise HTTPException(
            415,
            "Could not decode this file. Use WAV, FLAC, OGG, or MP3.",
        )
    if len(audio) == 0:
        raise HTTPException(400, "File contains no audio.")
    return _register(audio, sr)


@app.post("/api/demo")
def demo():
    demo_path = Path(__file__).resolve().parent / "samples" / "voice.wav"
    if not demo_path.exists():
        raise HTTPException(404, "No demo clip on this server.")
    audio, sr = sf.read(demo_path, dtype="float32", always_2d=True)
    return _register(audio, sr)


@app.get("/api/audio/{track_id}/{era}")
def get_audio(track_id: str, era: str):
    with _lock:
        if track_id not in _tracks:
            raise HTTPException(404, "Unknown track id — upload again.")
        cached = _cache.get((track_id, era))
    if cached is not None:
        return Response(cached, media_type="audio/wav")

    audio, sr = _tracks[track_id]
    if era == "original":
        out, out_sr = audio, sr
    elif era == "modern":
        if not dsp.deepfilternet_available():
            raise HTTPException(503, "DeepFilterNet is not installed on the server.")
        out, out_sr = dsp.restore(audio, sr)
    elif era in dsp.ERAS:
        out, out_sr = dsp.ERAS[era](audio, sr), sr
    else:
        raise HTTPException(400, f"Unknown era '{era}'.")

    wav = _wav_bytes(out, out_sr)
    with _lock:
        _cache[(track_id, era)] = wav
    return Response(wav, media_type="audio/wav")


@app.get("/")
def index():
    return FileResponse(STATIC_DIR / "index.html")


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


if __name__ == "__main__":
    import argparse
    import uvicorn

    parser = argparse.ArgumentParser(description="Run the Waveback API server.")
    parser.add_argument(
        "--host",
        default="127.0.0.1",
        help="Host address to bind to. Use 0.0.0.0 for LAN access.",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Port to run the server on.",
    )
    args = parser.parse_args()

    uvicorn.run(app, host=args.host, port=args.port)
