// Transcribe local las respuestas de audio que aún no tienen texto y guarda el
// resultado en interview_answers.transcript. Corre en tu compu, gratis y privado.
//   node scripts/transcribir-entrevistas.mjs          (solo las que faltan)
//   node scripts/transcribir-entrevistas.mjs --todas  (re-transcribe todo)
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const env = {}
for (const l of readFileSync(join(ROOT, '.env.local'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const BUCKET = 'interview-audio'
const todas = process.argv.includes('--todas')
const PY = process.platform === 'win32' ? 'py' : 'python3'

function extFromPath(p) { const e = p.split('.').pop(); return e && e.length <= 4 ? e : 'webm' }

// Muletillas (lista editable). Se cuentan sobre el texto en minúsculas.
const FILLERS = [
  ['pues', /\bpues\b/g], ['o sea', /\bo\s*sea\b/g], ['este', /\beste\b/g],
  ['obviamente', /\bobviamente\b/g], ['bueno', /\bbueno\b/g], ['¿no?', /\bno\s*\?/g],
]

// Métricas de habla a partir de palabras con timestamps (sin biometría de voz).
function speechMetrics(item, maxSeconds) {
  const words = item.words || []
  const duration = item.duration || (words.length ? words[words.length - 1].end : 0)
  const wordCount = words.length
  const minutes = duration > 0 ? duration / 60 : 0
  const wpm = minutes > 0 ? Math.round(wordCount / minutes) : 0
  const text = (item.text || '').toLowerCase()
  const fillerCounts = {}; let fillersTotal = 0
  for (const [key, re] of FILLERS) { const c = (text.match(re) || []).length; if (c) { fillerCounts[key] = c; fillersTotal += c } }
  const fillersPerMin = minutes > 0 ? +(fillersTotal / minutes).toFixed(1) : 0
  const initialPauseSec = words.length ? +Number(words[0].start).toFixed(1) : 0
  let longPauses = 0
  for (let i = 1; i < words.length; i++) if (words[i].start - words[i - 1].end > 2) longPauses++
  const pctMax = maxSeconds ? Math.round((duration / maxSeconds) * 100) : null
  // Ritmo: palabras por minuto por tercio (inicio / medio / final).
  const t = duration / 3
  const thirds = [0, 0, 0]
  for (const w of words) { const idx = t > 0 ? Math.min(2, Math.floor(w.start / t)) : 0; thirds[idx]++ }
  const wpmThirds = t > 0 ? thirds.map((c) => Math.round(c / (t / 60))) : [0, 0, 0]
  return { durationSec: Math.round(duration), pctMax, words: wordCount, wpm, wpmThirds, fillersPerMin, fillersTotal, fillerCounts, initialPauseSec, longPauses }
}

async function main() {
  const { data: rows } = await sb.from('interview_answers').select('invite_id,question_order,audio_path,transcript,metrics').not('audio_path', 'is', null)
  const pend = (rows || []).filter((r) => todas || !r.transcript)
  if (!pend.length) { console.log('Nada por transcribir. (usa --todas para rehacer)'); return }
  console.log(`Por transcribir: ${pend.length} audios`)

  const dir = mkdtempSync(join(tmpdir(), 'suu-tr-'))
  const map = [] // {file, invite_id, question_order}
  for (const r of pend) {
    const { data: blob, error } = await sb.storage.from(BUCKET).download(r.audio_path)
    if (error || !blob) { console.log('  no se pudo bajar', r.audio_path); continue }
    const file = join(dir, `${r.invite_id}__${r.question_order}.${extFromPath(r.audio_path)}`)
    writeFileSync(file, Buffer.from(await blob.arrayBuffer()))
    map.push({ file, invite_id: r.invite_id, question_order: r.question_order, acoustic: r.metrics?.acoustic ?? null })
  }
  if (!map.length) { console.log('No se bajó ningún audio.'); rmSync(dir, { recursive: true, force: true }); return }

  // maxSeconds por (invitación, pregunta) para calcular % del tiempo usado.
  const inviteIds = [...new Set(map.map((m) => m.invite_id))]
  const { data: invs } = await sb.from('interview_invites').select('id,template_id').in('id', inviteIds)
  const invTpl = new Map((invs || []).map((i) => [i.id, i.template_id]))
  const { data: tpls } = await sb.from('interview_templates').select('id,questions').in('id', [...new Set((invs || []).map((i) => i.template_id))])
  const tplById = new Map((tpls || []).map((t) => [t.id, t]))
  const maxSecondsFor = (inviteId, order) => { const t = tplById.get(invTpl.get(inviteId)); const q = (t?.questions || []).find((x) => x.order === order); return q?.maxSeconds || 90 }

  const manifest = join(dir, '_manifest.json'); const out = join(dir, '_out.json')
  writeFileSync(manifest, JSON.stringify(map.map((m) => m.file)))
  execFileSync(PY, [join(ROOT, 'scripts', 'whisper_local.py'), manifest, out], { stdio: 'inherit' })

  const res = JSON.parse(readFileSync(out, 'utf8'))
  let ok = 0
  for (const m of map) {
    const item = res[m.file]
    const text = (item && item.text) || ''
    if (!text) continue
    // Acústica: prioriza la del navegador (nuevas); si no hay, usa la calculada aquí del audio (backfill).
    const metrics = { ...speechMetrics(item, maxSecondsFor(m.invite_id, m.question_order)), acoustic: m.acoustic ?? item.acoustic ?? null }
    // Intenta guardar transcript + metrics; si la columna metrics aún no existe, guarda solo transcript.
    let { error } = await sb.from('interview_answers').update({ transcript: text, metrics }).eq('invite_id', m.invite_id).eq('question_order', m.question_order)
    if (error) { const r2 = await sb.from('interview_answers').update({ transcript: text }).eq('invite_id', m.invite_id).eq('question_order', m.question_order); error = r2.error }
    if (!error) ok++
  }
  rmSync(dir, { recursive: true, force: true })
  console.log(`Guardados en la base: ${ok}/${map.length}`)
}
main().catch((e) => { console.error(e); process.exit(1) })
