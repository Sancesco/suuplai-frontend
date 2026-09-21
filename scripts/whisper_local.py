# Transcribe local (gratis, privado) con faster-whisper. No manda nada a internet
# salvo la descarga del modelo la primera vez. Uso:
#   python whisper_local.py <manifest.json> <salida.json>
# manifest.json = ["ruta1.webm", "ruta2.webm", ...]
# salida.json   = {"ruta1.webm": "texto...", ...}
import sys, json, os
from faster_whisper import WhisperModel

MODEL = os.environ.get("WHISPER_MODEL", "small")  # tiny/base/small/medium

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
            segments, _ = model.transcribe(p, language="es", vad_filter=True, beam_size=5)
            res[p] = " ".join(s.text.strip() for s in segments).strip()
        except Exception as e:
            res[p] = ""
            print(f"[whisper] ERROR en {p}: {e}", flush=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(res, f, ensure_ascii=False)
    print(f"[whisper] listo: {len(res)} transcritos", flush=True)

if __name__ == "__main__":
    main()
