'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=Space+Mono:wght@400;700&display=swap');
.ent{--bone:#FFFEF3;--paper:#F4F2E4;--ink:#0A0A0F;--soft:#56554D;--line:#D9D7C4;--lime:#E8FF47;--ember:#FF6B35;--display:"Syne",system-ui,sans-serif;--body:"DM Sans",system-ui,-apple-system,sans-serif;--mono:"Space Mono",ui-monospace,monospace}
.ent{background:var(--bone);color:var(--ink);font-family:var(--body);min-height:100dvh;display:flex;flex-direction:column}
.ent *{box-sizing:border-box}
.ent .bar{display:flex;justify-content:space-between;align-items:center;padding:18px 22px 8px;max-width:520px;margin:0 auto;width:100%}
.ent .logo{font-family:var(--display);font-weight:800;font-size:20px;letter-spacing:-.02em}
.ent .logo span{color:var(--ember)}
.ent .prog{font-family:var(--mono);font-size:12px;color:var(--soft)}
.ent .track{height:4px;background:var(--line);margin:4px auto 0;border-radius:4px;overflow:hidden;max-width:520px;width:calc(100% - 44px)}
.ent .track i{display:block;height:100%;background:var(--ink);transition:width .3s ease}
.ent .body{flex:1;display:flex;flex-direction:column;padding:26px 22px 30px;max-width:520px;margin:0 auto;width:100%}
.ent .eyebrow{font-family:var(--mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--ember);margin:0 0 12px}
.ent .h{font-family:var(--display);font-weight:800;font-size:clamp(28px,8vw,34px);line-height:1.02;letter-spacing:-.03em;margin:0 0 14px;text-wrap:balance}
.ent .q{font-family:var(--display);font-weight:700;font-size:clamp(21px,5.5vw,25px);line-height:1.18;letter-spacing:-.02em;margin:0;text-wrap:balance}
.ent .p{font-size:16px;line-height:1.5;color:var(--soft);margin:0 0 12px}
.ent .chips{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 18px}
.ent .chip{font-family:var(--mono);font-size:12px;padding:6px 10px;border:1.5px solid var(--ink);border-radius:999px}
.ent .consent{display:flex;gap:12px;align-items:flex-start;background:var(--paper);border-radius:14px;padding:14px;font-size:14px;line-height:1.45;color:var(--soft);margin-top:auto}
.ent .consent input{width:20px;height:20px;accent-color:var(--ink);margin-top:1px;flex:none}
.ent .cta{margin-top:16px;width:100%;padding:17px;border-radius:999px;border:2px solid var(--ink);background:var(--ink);color:var(--lime);font-weight:700;font-size:17px;font-family:var(--body);cursor:pointer}
.ent .cta:disabled{opacity:.35;cursor:not-allowed}
.ent .ghost{background:transparent;color:var(--ink)}
.ent .row2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}
.ent .row2 .cta{margin-top:0}
.ent .field{margin-bottom:18px}
.ent .field label{display:block;font-size:15px;font-weight:500;margin-bottom:8px;line-height:1.3}
.ent .field label b{color:var(--ember)}
.ent .field input,.ent .field select{width:100%;font:inherit;font-size:16px;color:var(--ink);background:var(--bone);border:1.5px solid var(--ink);border-radius:12px;padding:12px 14px}
.ent .field input:focus,.ent .field select:focus{outline:none;border-color:var(--ember)}
.ent .rec{margin:auto 0 0;display:grid;justify-items:center;gap:14px;padding-top:24px}
.ent .mic{width:112px;height:112px;border-radius:50%;border:3px solid var(--ink);background:var(--lime);display:grid;place-items:center;position:relative;transition:transform .15s;cursor:pointer}
.ent .mic:active{transform:scale(.97)}
.ent .mic svg{width:42px;height:42px}
.ent .mic.on{background:var(--ember)}
.ent .mic.on::after{content:"";position:absolute;inset:-12px;border-radius:50%;border:3px solid var(--ember);opacity:.5;animation:entpulse 1.3s ease-out infinite}
@keyframes entpulse{from{transform:scale(.9);opacity:.6}to{transform:scale(1.25);opacity:0}}
.ent .time{font-family:var(--mono);font-size:22px;font-variant-numeric:tabular-nums}
.ent .time small{font-size:13px;color:var(--soft)}
.ent .hint{font-size:14px;color:var(--soft);text-align:center}
.ent audio{width:100%;margin-top:6px}
.ent .done{margin:auto 0;display:grid;gap:14px;justify-items:start}
.ent .check{width:64px;height:64px;border-radius:50%;background:var(--lime);border:3px solid var(--ink);display:grid;place-items:center;font-size:30px;font-weight:800}
.ent .err{color:#B4451A;font-size:14px;margin:8px 0 0}
`

type QField = { key: string; label: string; type: 'number' | 'text' | 'select'; options?: string[]; required?: boolean }
type Q = { order: number; text: string; maxSeconds: number }
type State = { candidate_name: string; status: string; consentDone: boolean; quickAnswers: Record<string, string>; answered: number[]; template: { title: string; intro: string | null; quick_fields: QField[]; questions: Q[] } }

const MIC = <svg viewBox="0 0 24 24" fill="none" stroke="#0A0A0F" strokeWidth="2.2" strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
const STOP = <svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" fill="#0A0A0F" /></svg>
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

function pickMime(): string {
  const cands = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac', 'audio/ogg']
  for (const c of cands) { try { if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) return c } catch { /* noop */ } }
  return ''
}

// ── Análisis acústico (solo números, sin perfiles de voz ni emociones) ──
const acAvg = (xs: number[]) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0
// Pitch por autocorrelación acotada al rango de voz (70–400 Hz). 0 si no hay voz.
function acPitch(buf: Float32Array, sr: number): number {
  const minLag = Math.floor(sr / 400), maxLag = Math.floor(sr / 70)
  let best = -1, bestLag = -1
  for (let lag = minLag; lag <= maxLag; lag++) {
    let s = 0; for (let i = 0; i < buf.length - lag; i++) s += buf[i] * buf[i + lag]
    if (s > best) { best = s; bestLag = lag }
  }
  return bestLag > 0 ? sr / bestLag : 0
}
type Acoustic = { energy0100: number; energyVar0100: number; energyThirds: number[]; noise0100: number; noisy: boolean; onsetSec: number; pitchSemitoneRange: number }
function computeAcoustic(rmsAll: number[], pitchAll: number[], durationSec: number): Acoustic | null {
  const rms = rmsAll.filter((x) => x != null)
  if (rms.length < 3) return null
  const mean = acAvg(rms)
  const std = Math.sqrt(acAvg(rms.map((x) => (x - mean) ** 2)))
  const sorted = [...rms].sort((a, b) => a - b)
  const floor = sorted[Math.floor(sorted.length * 0.1)]
  const scale = (v: number) => Math.max(0, Math.min(100, Math.round(v * 400)))
  const third = Math.max(1, Math.floor(rms.length / 3))
  const thr = Math.max(0.03, floor * 2.5)
  let onsetIdx = rmsAll.findIndex((x) => x > thr); if (onsetIdx < 0) onsetIdx = 0
  const frameSec = durationSec > 0 ? durationSec / rmsAll.length : 0.12
  const pitches = pitchAll.filter((p) => p >= 70 && p <= 400)
  let pitchSemitoneRange = 0
  if (pitches.length >= 5) { const ps = [...pitches].sort((a, b) => a - b); const lo = ps[Math.floor(ps.length * 0.1)], hi = ps[Math.floor(ps.length * 0.9)]; if (lo > 0) pitchSemitoneRange = +(12 * Math.log2(hi / lo)).toFixed(1) }
  return {
    energy0100: scale(mean), energyVar0100: scale(std),
    energyThirds: [scale(acAvg(rms.slice(0, third))), scale(acAvg(rms.slice(third, 2 * third))), scale(acAvg(rms.slice(2 * third)))],
    noise0100: scale(floor), noisy: mean > 0 ? floor / mean > 0.5 : false,
    onsetSec: +(onsetIdx * frameSec).toFixed(1), pitchSemitoneRange,
  }
}

export function Candidato({ token }: { token: string }) {
  const [phase, setPhase] = useState<'loading' | 'error' | 'done' | 'welcome' | 'quick' | 'audio' | 'thanks'>('loading')
  const [st, setSt] = useState<State | null>(null)
  const [okConsent, setOkConsent] = useState(false)
  const [quick, setQuick] = useState<Record<string, string>>({})
  const [qIdx, setQIdx] = useState(0)
  const [answered, setAnswered] = useState<Set<number>>(new Set())
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  // grabación
  const [rec, setRec] = useState<'idle' | 'recording' | 'review'>('idle')
  const [secs, setSecs] = useState(0)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const mr = useRef<MediaRecorder | null>(null)
  const chunks = useRef<BlobPart[]>([])
  const stream = useRef<MediaStream | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const retakes = useRef(0) // grabaciones descartadas de la pregunta actual
  const audioCtx = useRef<AudioContext | null>(null)
  const acSampler = useRef<ReturnType<typeof setInterval> | null>(null)
  const acRms = useRef<number[]>([]); const acPitchArr = useRef<number[]>([])
  const acResult = useRef<Acoustic | null>(null)

  const api = useCallback((body: unknown) => fetch(`/api/entrevista/${token}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), [token])

  // Decide en qué pantalla arrancar según el estado del servidor.
  const route = useCallback((s: State) => {
    const done = new Set(s.answered); setAnswered(done)
    if (s.status === 'completed') { setPhase('done'); return }
    if (!s.consentDone) { setPhase('welcome'); return }
    const reqMissing = s.template.quick_fields.some((f) => f.required && !String(s.quickAnswers[f.key] ?? '').trim())
    if (reqMissing) { setQuick(s.quickAnswers || {}); setPhase('quick'); return }
    const nextI = s.template.questions.findIndex((q) => !done.has(q.order))
    if (nextI === -1) { setPhase('thanks'); return }
    setQIdx(nextI); setRec('idle'); setPhase('audio')
  }, [])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const r = await fetch(`/api/entrevista/${token}`); const j = await r.json()
        if (!alive) return
        if (!r.ok || !j.ok) { setPhase('error'); return }
        setSt(j as State); setQuick((j as State).quickAnswers || {}); route(j as State)
      } catch { if (alive) setPhase('error') }
    })()
    return () => { alive = false }
  }, [token, route])

  // limpieza de recursos de grabación
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); stream.current?.getTracks().forEach((t) => t.stop()) }, [])

  const resetRec = () => { setBlob(null); if (url) URL.revokeObjectURL(url); setUrl(null); setSecs(0); setRec('idle') }

  async function startRec(maxSec: number) {
    setErr('')
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) { setErr('Tu navegador no permite grabar audio. Abre el link en Chrome (Android) o Safari (iPhone).'); return }
    let s: MediaStream
    try { s = await navigator.mediaDevices.getUserMedia({ audio: true }) } catch { setErr('No pudimos usar tu micrófono. Dale permiso y vuelve a intentar.'); return }
    stream.current = s; chunks.current = []
    // Muestreo acústico en vivo (energía + pitch). Si algo falla, seguimos sin acústica.
    acRms.current = []; acPitchArr.current = []; acResult.current = null
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new Ctx(); audioCtx.current = ctx
      const an = ctx.createAnalyser(); an.fftSize = 2048
      ctx.createMediaStreamSource(s).connect(an)
      const tbuf = new Float32Array(an.fftSize)
      acSampler.current = setInterval(() => {
        an.getFloatTimeDomainData(tbuf)
        let sum = 0; for (let i = 0; i < tbuf.length; i++) sum += tbuf[i] * tbuf[i]
        const rms = Math.sqrt(sum / tbuf.length)
        acRms.current.push(rms)
        acPitchArr.current.push(rms > 0.02 ? acPitch(tbuf, ctx.sampleRate) : 0)
      }, 120)
    } catch { /* navegador sin Web Audio: sin acústica */ }
    const mime = pickMime()
    const r = mime ? new MediaRecorder(s, { mimeType: mime }) : new MediaRecorder(s)
    mr.current = r
    r.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data) }
    r.onstop = () => {
      const b = new Blob(chunks.current, { type: r.mimeType || 'audio/webm' })
      setBlob(b); setUrl(URL.createObjectURL(b)); setRec('review')
      stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null
    }
    r.start(); setSecs(0); setRec('recording')
    timer.current = setInterval(() => setSecs((x) => { const n = x + 1; if (n >= maxSec) stopRec(); return n }), 1000)
  }
  function stopRec() {
    if (timer.current) { clearInterval(timer.current); timer.current = null }
    if (acSampler.current) { clearInterval(acSampler.current); acSampler.current = null }
    acResult.current = computeAcoustic(acRms.current, acPitchArr.current, acRms.current.length * 0.12)
    if (audioCtx.current) { try { audioCtx.current.close() } catch { /* noop */ } audioCtx.current = null }
    if (mr.current && mr.current.state === 'recording') mr.current.stop()
  }

  async function sendAnswer(q: Q) {
    if (!blob || busy) return
    setBusy(true); setErr('')
    try {
      const fd = new FormData()
      fd.append('audio', blob, `q${q.order}`); fd.append('order', String(q.order)); fd.append('duration', String(secs)); fd.append('retakes', String(retakes.current))
      const r = await fetch(`/api/entrevista/${token}/answer`, { method: 'POST', body: fd })
      const j = await r.json().catch(() => null)
      if (!r.ok || !j?.ok) { setErr('No se pudo enviar. Revisa tu internet y reintenta.'); return }
      const done = new Set(answered); done.add(q.order); setAnswered(done)
      retakes.current = 0; resetRec()
      const nextI = st!.template.questions.findIndex((x) => !done.has(x.order))
      if (nextI === -1) { await api({ action: 'complete' }); setPhase('thanks') }
      else setQIdx(nextI)
    } finally { setBusy(false) }
  }

  // ── Render ──
  if (phase === 'loading') return <Shell><div className="body"><p className="p" style={{ margin: 'auto' }}>Cargando…</p></div></Shell>
  if (phase === 'error') return <Shell><div className="body"><div style={{ margin: 'auto', textAlign: 'center' }}><p className="h">Link incompleto</p><p className="p">Este link parece haberse cortado al copiarlo (les pasa a veces en WhatsApp). Los links no caducan: pide que te reenvíen el link completo y ábrelo tal cual.</p></div></div></Shell>
  if (phase === 'done') return <Shell><div className="body"><div className="done" style={{ margin: 'auto' }}><div className="check">✓</div><p className="h">Ya la completaste</p><p className="p">Recibimos tus respuestas. Te contactamos pronto.</p></div></div></Shell>
  if (!st) return null

  const total = st.template.questions.length
  const progress = phase === 'audio' ? (answered.size / total) * 100 : phase === 'thanks' ? 100 : 0

  return (
    <Shell prog={phase === 'audio' ? `${qIdx + 1} de ${total}` : ''} track={progress}>
      <div className="body">
        {phase === 'welcome' && (
          <>
            <p className="eyebrow">Entrevista en audio</p>
            <h1 className="h">Hola, {st.candidate_name}.</h1>
            <p className="p">{st.template.intro}</p>
            <div className="chips"><span className="chip">{total} preguntas</span><span className="chip">~10 min</span><span className="chip">Sin cuenta</span></div>
            <p className="p">Primero unos datos rápidos y luego las preguntas. Puedes escucharte y regrabar antes de enviar.</p>
            <label className="consent"><input type="checkbox" checked={okConsent} onChange={(e) => setOkConsent(e.target.checked)} /><span>Acepto que mis respuestas se graben y transcriban únicamente para este proceso de selección. Analizamos la duración y el contenido de tus respuestas para preparar la entrevista; no guardamos perfiles de voz. Se eliminan al concluir el proceso.</span></label>
            <button className="cta" disabled={!okConsent || busy} onClick={async () => { setBusy(true); await api({ action: 'consent' }); setBusy(false); const reqMissing = st.template.quick_fields.some((f) => f.required && !String(quick[f.key] ?? '').trim()); setPhase(reqMissing ? 'quick' : 'audio') }}>Empezar</button>
          </>
        )}

        {phase === 'quick' && (
          <>
            <p className="eyebrow">Datos rápidos</p>
            <h1 className="h" style={{ fontSize: 26 }}>Cuéntanos lo básico.</h1>
            <div style={{ marginTop: 8 }}>
              {st.template.quick_fields.map((f) => (
                <div className="field" key={f.key}>
                  <label htmlFor={`f-${f.key}`}>{f.label} {f.required && <b>*</b>}</label>
                  {f.type === 'select' ? (
                    <select id={`f-${f.key}`} value={quick[f.key] ?? ''} onChange={(e) => setQuick({ ...quick, [f.key]: e.target.value })}>
                      <option value="">Elige…</option>
                      {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input id={`f-${f.key}`} type={f.type === 'number' ? 'number' : 'text'} inputMode={f.type === 'number' ? 'numeric' : undefined} value={quick[f.key] ?? ''} onChange={(e) => setQuick({ ...quick, [f.key]: e.target.value })} />
                  )}
                </div>
              ))}
            </div>
            {err && <p className="err">{err}</p>}
            <button className="cta" disabled={busy} onClick={async () => {
              const miss = st.template.quick_fields.some((f) => f.required && !String(quick[f.key] ?? '').trim())
              if (miss) { setErr('Contesta los campos con *.'); return }
              setBusy(true); const r = await api({ action: 'quick', answers: quick }); setBusy(false)
              if (r.ok) { setErr(''); setPhase('audio') } else setErr('No se pudo guardar, reintenta.')
            }}>Continuar</button>
          </>
        )}

        {phase === 'audio' && (() => {
          const q = st.template.questions[qIdx]
          return (
            <>
              <p className="eyebrow">Pregunta {qIdx + 1}</p>
              <p className="q">{q.text}</p>
              <div className="rec">
                {rec === 'idle' && (<>
                  <button className="mic" aria-label="Grabar" onClick={() => startRec(q.maxSeconds)}>{MIC}</button>
                  <div className="time">0:00 <small>/ {fmt(q.maxSeconds)}</small></div>
                  <div className="hint">Toca para grabar (hasta {Math.round(q.maxSeconds / 60)} min)</div>
                </>)}
                {rec === 'recording' && (<>
                  <button className="mic on" aria-label="Detener" onClick={stopRec}>{STOP}</button>
                  <div className="time">{fmt(secs)} <small>/ {fmt(q.maxSeconds)}</small></div>
                  <div className="hint">Grabando… toca para terminar</div>
                </>)}
                {rec === 'review' && (<>
                  <div className="time">{fmt(secs)}</div>
                  {url && <audio controls src={url} />}
                  <div className="row2" style={{ width: '100%' }}>
                    <button className="cta ghost" disabled={busy} onClick={() => { retakes.current += 1; resetRec() }}>Regrabar</button>
                    <button className="cta" disabled={busy} onClick={() => sendAnswer(q)}>{busy ? 'Enviando…' : qIdx === total - 1 ? 'Enviar y terminar' : 'Enviar'}</button>
                  </div>
                </>)}
              </div>
              {err && <p className="err" style={{ textAlign: 'center' }}>{err}</p>}
            </>
          )
        })()}

        {phase === 'thanks' && (
          <div className="done" style={{ margin: 'auto 0' }}>
            <div className="check">✓</div>
            <h1 className="h">¡Listo, {st.candidate_name}!</h1>
            <p className="p">Recibimos tus {total} respuestas. Te escribimos pronto para agendar una llamada.</p>
          </div>
        )}
      </div>
    </Shell>
  )
}

function Shell({ children, prog, track }: { children: React.ReactNode; prog?: string; track?: number }) {
  return (
    <div className="ent">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="bar"><div className="logo">suuplai<span>.</span></div><div className="prog">{prog}</div></div>
      <div className="track"><i style={{ width: `${track ?? 0}%` }} /></div>
      {children}
    </div>
  )
}
