# Transcribe local (gratis, privado) con faster-whisper, con timestamps por palabra.
# Uso: python whisper_local.py <manifest.json> <salida.json>
# manifest = ["ruta1.webm", ...]
# salida   = {"ruta1.webm": {"text":"...","words":[{"w":"..","start":0.0,"end":0.1}],"duration":12.3}, ...}
import sys, json, os
from faster_whisper import WhisperModel

MODEL = os.environ.get("WHISPER_MODEL", "small")

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
            res[p] = {"text": " ".join(text_parts).strip(), "words": words, "duration": duration}
        except Exception as e:
            res[p] = {"text": "", "words": [], "duration": 0}
            print(f"[whisper] ERROR en {p}: {e}", flush=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(res, f, ensure_ascii=False)
    print(f"[whisper] listo: {len(res)} transcritos", flush=True)

if __name__ == "__main__":
    main()
