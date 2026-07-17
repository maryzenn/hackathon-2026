"""Optional librosa analysis of user-uploaded clips.

Only ever runs on tracks the user uploaded through /api/upload or the built-in
demo clip — royalty-free / own recordings per the project rules. Keep it that
way: never point this at streamed commercial audio.
"""

from __future__ import annotations

import numpy as np

ANALYSIS_SR = 22050
PITCH_CLASSES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def analyze(audio: np.ndarray, sr: int) -> dict:
    import librosa

    mono = audio.mean(axis=1).astype(np.float32)
    y = librosa.resample(mono, orig_sr=sr, target_sr=ANALYSIS_SR)

    tempo, _ = librosa.beat.beat_track(y=y, sr=ANALYSIS_SR)
    tempo = float(np.atleast_1d(tempo)[0])

    rms = float(librosa.feature.rms(y=y).mean())
    centroid = float(librosa.feature.spectral_centroid(y=y, sr=ANALYSIS_SR).mean())
    chroma = librosa.feature.chroma_cqt(y=y, sr=ANALYSIS_SR).mean(axis=1)
    key_guess = PITCH_CLASSES[int(chroma.argmax())]

    energy = "low" if rms < 0.04 else "medium" if rms < 0.12 else "high"
    fast = tempo >= 110
    loud = energy != "low"
    mood = (
        "energetic" if fast and loud
        else "upbeat" if fast
        else "intense" if loud
        else "mellow"
    )

    return {
        "duration_s": round(len(mono) / sr, 2),
        "tempo_bpm": round(tempo, 1),
        "energy": energy,
        "rms": round(rms, 4),
        "brightness_hz": round(centroid),
        "key_guess": key_guess,
        "mood": mood,
        "note": "Mood/key are rough heuristics from tempo, loudness, and chroma.",
    }


def librosa_available() -> bool:
    try:
        import librosa  # noqa: F401

        return True
    except Exception:
        return False
