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

async function main() {
  const { data: rows } = await sb.from('interview_answers').select('invite_id,question_order,audio_path,transcript').not('audio_path', 'is', null)
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
    map.push({ file, invite_id: r.invite_id, question_order: r.question_order })
  }
  if (!map.length) { console.log('No se bajó ningún audio.'); rmSync(dir, { recursive: true, force: true }); return }

  const manifest = join(dir, '_manifest.json'); const out = join(dir, '_out.json')
  writeFileSync(manifest, JSON.stringify(map.map((m) => m.file)))
  execFileSync(PY, [join(ROOT, 'scripts', 'whisper_local.py'), manifest, out], { stdio: 'inherit' })

  const res = JSON.parse(readFileSync(out, 'utf8'))
  let ok = 0
  for (const m of map) {
    const text = res[m.file] ?? ''
    if (!text) continue
    const { error } = await sb.from('interview_answers').update({ transcript: text }).eq('invite_id', m.invite_id).eq('question_order', m.question_order)
    if (!error) ok++
  }
  rmSync(dir, { recursive: true, force: true })
  console.log(`Guardados en la base: ${ok}/${map.length}`)
}
main().catch((e) => { console.error(e); process.exit(1) })
