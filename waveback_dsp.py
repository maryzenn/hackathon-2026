"""Waveback DSP engine.

Degradation (new -> old) is pure signal processing modeled on the physics of
each playback era. Restoration (old -> new) wraps DeepFilterNet (pretrained
inference, CPU) with a light mastering chain on top.

All functions take/return float32 arrays shaped (samples, channels) in [-1, 1].
"""

from __future__ import annotations

import numpy as np
from scipy import signal

RNG = np.random.default_rng(1955)


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------

def _butter(audio: np.ndarray, sr: int, kind: str, freq, order: int = 4) -> np.ndarray:
    sos = signal.butter(order, freq, btype=kind, fs=sr, output="sos")
    return signal.sosfilt(sos, audio, axis=0).astype(np.float32)


def _peaking(audio: np.ndarray, sr: int, f0: float, gain_db: float, q: float = 1.0) -> np.ndarray:
    """Biquad peaking EQ (RBJ cookbook)."""
    a = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * f0 / sr
    alpha = np.sin(w0) / (2 * q)
    b = np.array([1 + alpha * a, -2 * np.cos(w0), 1 - alpha * a])
    den = np.array([1 + alpha / a, -2 * np.cos(w0), 1 - alpha / a])
    return signal.lfilter(b / den[0], den / den[0], audio, axis=0).astype(np.float32)


def _to_mono(audio: np.ndarray) -> np.ndarray:
    return audio.mean(axis=1, keepdims=True).astype(np.float32)


def _match_channels(audio: np.ndarray, channels: int) -> np.ndarray:
    if audio.shape[1] == channels:
        return audio
    return np.repeat(audio[:, :1], channels, axis=1)


def _rms(audio: np.ndarray) -> float:
    return float(np.sqrt(np.mean(audio**2)) + 1e-12)


def _soft_clip(audio: np.ndarray, drive: float) -> np.ndarray:
    return (np.tanh(audio * drive) / np.tanh(drive)).astype(np.float32)


def _normalize(audio: np.ndarray, peak: float = 0.95) -> np.ndarray:
    m = np.max(np.abs(audio)) + 1e-12
    if m > peak:
        audio = audio * (peak / m)
    return audio.astype(np.float32)


def _pink_noise(n: int, channels: int) -> np.ndarray:
    """Pink-ish noise via first-order filtered white noise."""
    white = RNG.standard_normal((n, channels)).astype(np.float32)
    b, a = signal.butter(1, 0.06, btype="low")
    return signal.lfilter(b, a, white, axis=0).astype(np.float32)


# ---------------------------------------------------------------------------
# era presets
# ---------------------------------------------------------------------------

def era_1950s(audio: np.ndarray, sr: int) -> np.ndarray:
    """Vinyl 78/LP: mono, HF rolloff, surface noise, crackle, light warmth."""
    channels = audio.shape[1]
    y = _to_mono(audio)

    y = _butter(y, sr, "low", 7500, order=6)      # shellac/early LP top end
    y = _butter(y, sr, "high", 55, order=2)       # rumble filter on the cutter
    y = _peaking(y, sr, 900, 2.0, q=0.8)          # midrange-forward tone
    y = _soft_clip(y, 1.6)                        # groove saturation

    ref = _rms(y)
    n = len(y)

    # continuous surface noise
    surface = _pink_noise(n, 1) * ref * 0.28

    # sparse crackle: random ticks with exponential decay tails
    crackle = np.zeros((n, 1), dtype=np.float32)
    n_ticks = max(4, int(n / sr * 9))
    positions = RNG.integers(0, max(1, n - 400), n_ticks)
    tail = np.exp(-np.arange(400) / 40.0).astype(np.float32)
    for p in positions:
        amp = RNG.uniform(0.3, 1.0) * RNG.choice([-1, 1])
        crackle[p : p + 400, 0] += amp * tail * RNG.standard_normal(400).astype(np.float32) * 0.5
    crackle = _butter(crackle, sr, "high", 1200, order=2) * ref * 2.4

    y = y + surface + crackle
    return _match_channels(_normalize(y), channels)


def era_1960s(audio: np.ndarray, sr: int) -> np.ndarray:
    """Transistor/AM radio: narrow bandpass, mono, small-speaker honk, static."""
    channels = audio.shape[1]
    y = _to_mono(audio)

    y = _butter(y, sr, "bandpass", (280, 3800), order=4)  # AM broadcast band
    y = _peaking(y, sr, 1600, 5.0, q=1.4)                 # tiny speaker resonance
    y = _soft_clip(y, 3.5)                                # cheap amp clipping

    n = len(y)
    ref = _rms(y)

    # slow AM fade (signal-strength wobble)
    t = np.arange(n) / sr
    fade = (1.0 + 0.12 * np.sin(2 * np.pi * 0.4 * t + RNG.uniform(0, 6))).astype(np.float32)
    y = y * fade[:, None]

    # atmospheric static, band-limited like the program material
    static = RNG.standard_normal((n, 1)).astype(np.float32)
    static = _butter(static, sr, "bandpass", (300, 4500), order=2) * ref * 0.16

    y = y + static
    return _match_channels(_normalize(y), channels)


def era_1970s(audio: np.ndarray, sr: int) -> np.ndarray:
    """Compact cassette: wow & flutter, tape hiss, darker EQ, soft saturation."""
    channels = audio.shape[1]
    y = audio.astype(np.float32)

    # wow & flutter: modulated read-position with linear interpolation
    n = len(y)
    t = np.arange(n) / sr
    wow = 0.0016 * np.sin(2 * np.pi * 0.9 * t + RNG.uniform(0, 6))
    flutter = 0.0004 * np.sin(2 * np.pi * 7.3 * t + RNG.uniform(0, 6))
    idx = np.clip(np.arange(n) + (wow + flutter) * sr, 0, n - 1)
    i0 = idx.astype(np.int64)
    i1 = np.minimum(i0 + 1, n - 1)
    frac = (idx - i0).astype(np.float32)[:, None]
    y = (y[i0] * (1 - frac) + y[i1] * frac).astype(np.float32)

    y = _butter(y, sr, "low", 11000, order=4)   # tape top-end loss
    y = _peaking(y, sr, 80, 2.0, q=0.9)         # head-bump warmth
    y = _peaking(y, sr, 4500, -2.0, q=0.7)      # slightly dull presence
    y = _soft_clip(y, 1.8)                      # tape compression

    # hiss: high-frequency weighted noise
    hiss = RNG.standard_normal((n, y.shape[1])).astype(np.float32)
    hiss = _butter(hiss, sr, "high", 3000, order=2) * _rms(y) * 0.13

    y = y + hiss
    return _match_channels(_normalize(y), channels)


ERAS = {
    "1950s": era_1950s,
    "1960s": era_1960s,
    "1970s": era_1970s,
}


# ---------------------------------------------------------------------------
# restoration (old -> new)
# ---------------------------------------------------------------------------

_DF_MODEL = None
_DF_STATE = None


def _torchaudio_shim() -> None:
    """DeepFilterNet 0.5.6 imports torchaudio.backend.common, removed in
    torchaudio 2.2+. Re-create that module path pointing at the new location."""
    import sys
    import types

    if "torchaudio.backend.common" in sys.modules:
        return

    class AudioMetaData:  # placeholder: df only uses this in load_audio, which we bypass
        pass

    backend = sys.modules.get("torchaudio.backend") or types.ModuleType("torchaudio.backend")
    common = types.ModuleType("torchaudio.backend.common")
    common.AudioMetaData = AudioMetaData
    backend.common = common
    sys.modules["torchaudio.backend"] = backend
    sys.modules["torchaudio.backend.common"] = common


def _load_deepfilternet():
    global _DF_MODEL, _DF_STATE
    if _DF_MODEL is None:
        _torchaudio_shim()
        from df.enhance import init_df

        _DF_MODEL, _DF_STATE, _ = init_df()
    return _DF_MODEL, _DF_STATE


def restore(audio: np.ndarray, sr: int) -> tuple[np.ndarray, int]:
    """DeepFilterNet denoise + light modern-master chain. Returns (audio, sr)."""
    import torch

    _torchaudio_shim()
    from df.enhance import enhance

    model, df_state = _load_deepfilternet()
    df_sr = df_state.sr()

    work = audio
    if sr != df_sr:
        gcd = np.gcd(sr, df_sr)
        work = signal.resample_poly(work, df_sr // gcd, sr // gcd, axis=0).astype(np.float32)

    # DeepFilterNet expects (channels, samples) torch tensor
    tensor = torch.from_numpy(work.T.copy())
    with torch.no_grad():
        cleaned = enhance(model, df_state, tensor)
    y = cleaned.cpu().numpy().T.astype(np.float32)

    # modern-master polish: gentle air-band lift, presence, loudness normalize
    y = _peaking(y, df_sr, 12000, 2.5, q=0.7)
    y = _peaking(y, df_sr, 3000, 1.2, q=1.0)
    target = 0.12  # ~-18 dBFS RMS, then peak-limit
    y = y * (target / _rms(y))
    y = _soft_clip(y, 1.2)
    return _normalize(y, 0.97), df_sr


def deepfilternet_available() -> bool:
    try:
        _torchaudio_shim()
        import df.enhance  # noqa: F401

        return True
    except Exception:
        return False
