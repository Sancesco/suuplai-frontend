# Transcribe local (gratis, privado) con faster-whisper, con timestamps por palabra.
# Uso: python whisper_local.py <manifest.json> <salida.json>
# manifest = ["ruta1.webm", ...]
# salida   = {"ruta1.webm": {"text":"...","words":[{"w":"..","start":0.0,"end":0.1}],"duration":12.3}, ...}
import sys, json, os
import numpy as np
from faster_whisper import WhisperModel
from faster_whisper.audio import decode_audio

MODEL = os.environ.get("WHISPER_MODEL", "small")

# Métricas acústicas del audio (solo números, sin perfiles de voz ni emociones).
def acoustic_metrics(path):
    try:
        audio = decode_audio(path, sampling_rate=16000)
    except Exception:
        return None
    sr = 16000
    audio = np.asarray(audio, dtype=np.float32)
    if audio.size < sr * 0.3:
        return None
    win, hop = 640, 320
    n = (len(audio) - win) // hop
    if n < 3:
        return None
    rms = np.empty(n, dtype=np.float32)
    pitch = np.zeros(n, dtype=np.float32)
    minlag, maxlag = int(sr / 400), int(sr / 70)
    for i in range(n):
        fr = audio[i * hop:i * hop + win]
        r = float(np.sqrt(np.mean(fr * fr)))
        rms[i] = r
        if r > 0.02:
            ac = np.correlate(fr, fr, "full")[win - 1:]
            seg = ac[minlag:maxlag + 1]
            if seg.size:
                lag = minlag + int(np.argmax(seg))
                pitch[i] = sr / lag if lag > 0 else 0
    mean = float(rms.mean()); std = float(rms.std())
    floor = float(np.percentile(rms, 10))
    scale = lambda v: int(max(0, min(100, round(v * 400))))
    third = max(1, n // 3)
    thr = max(0.03, floor * 2.5)
    onset_idx = int(np.argmax(rms > thr)) if np.any(rms > thr) else 0
    frame_sec = (len(audio) / sr) / n
    ps = sorted(float(p) for p in pitch if 70 <= p <= 400)
    pr = 0.0
    if len(ps) >= 5:
        lo, hi = ps[int(len(ps) * 0.1)], ps[int(len(ps) * 0.9)]
        if lo > 0:
            pr = round(12 * float(np.log2(hi / lo)), 1)
    return {
        "energy0100": scale(mean), "energyVar0100": scale(std),
        "energyThirds": [scale(rms[:third].mean()), scale(rms[third:2 * third].mean()), scale(rms[2 * third:].mean())],
        "noise0100": scale(floor), "noisy": bool(floor / mean > 0.5) if mean > 0 else False,
        "onsetSec": round(onset_idx * frame_sec, 1), "pitchSemitoneRange": pr,
    }

def main():
    manifest, out = sys.argv[1], sys.argv[2]
    with open(manifest, "r", encoding="utf-8") as f:
        paths = json.load(f)
    print(f"[whisper] cargando modelo '{MODEL}' (la 1a vez lo descarga)...", flush=True)
    model = WhisperModel(MODEL, device="cpu", compute_type="int8")
    res = {}
    for p in paths:
        print(f"[whisper] {os.path.basename(p)} ...", flush=True)
        try:
            segments, info = model.transcribe(p, language="es", vad_filter=True, beam_size=5, word_timestamps=True)
            text_parts, words = [], []
            for s in segments:
                text_parts.append(s.text.strip())
                for w in (s.words or []):
                    words.append({"w": (w.word or "").strip(), "start": round(w.start, 3), "end": round(w.end, 3)})
            duration = round(getattr(info, "duration", 0) or (words[-1]["end"] if words else 0), 3)
            res[p] = {"text": " ".join(text_parts).strip(), "words": words, "duration": duration, "acoustic": acoustic_metrics(p)}
        except Exception as e:
            res[p] = {"text": "", "words": [], "duration": 0}
            print(f"[whisper] ERROR en {p}: {e}", flush=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(res, f, ensure_ascii=False)
    print(f"[whisper] listo: {len(res)} transcritos", flush=True)

if __name__ == "__main__":
    main()
