'use client'

// Página pública de vacantes (suuplai.com.mx/unete). Carta, no una vacante.
// Diseño autocontenido (tema claro), form que abre WhatsApp con las respuestas.

import { useEffect } from 'react'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=Space+Mono:wght@400;700&family=Caveat:wght@600;700&display=swap');
.unete{--bone:#FFFEF3;--paper:#F4F2E4;--ink:#0A0A0F;--soft:#56554D;--line:#D9D7C4;--lime:#E8FF47;--ember:#FF6B35;--sky:#7FD4FF;--violet:#C9A6FF;--display:"Syne","Arial Black",system-ui,sans-serif;--body:"DM Sans",system-ui,-apple-system,"Segoe UI",sans-serif;--mono:"Space Mono",ui-monospace,Menlo,monospace;--hand:"Caveat","Segoe Print","Bradley Hand",cursive}
.unete{background:var(--bone);color:var(--ink);font-family:var(--body);min-height:100vh;overflow-x:hidden}
.unete *{box-sizing:border-box}
.unete a{color:inherit}
.unete :focus-visible{outline:3px solid var(--ember);outline-offset:3px;border-radius:6px}
.unete .page{max-width:1080px;margin:0 auto;padding-inline:clamp(16px,5vw,48px);padding-block:24px 56px}
.unete header{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}
.unete .logo{font-family:var(--display);font-weight:800;font-size:26px;letter-spacing:-.02em}
.unete .logo span{color:var(--ember)}
.unete .stamp{font-family:var(--mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;border:1.5px solid var(--ink);padding:7px 12px;border-radius:4px;transform:rotate(-2deg)}
.unete .letter{display:grid;grid-template-columns:minmax(0,1fr) 220px;column-gap:48px;margin-top:clamp(40px,7vw,80px)}
.unete .meta{grid-column:1;font-family:var(--mono);font-size:13px;color:var(--soft);letter-spacing:.04em;margin:0 0 28px}
.unete .hola{grid-column:1;font-family:var(--display);font-weight:800;font-size:clamp(64px,13vw,150px);line-height:.85;letter-spacing:-.045em;margin:0 0 clamp(28px,4vw,44px)}
.unete .hola span{color:var(--ember)}
.unete .row{display:contents}
.unete .row p{grid-column:1;margin:0 0 26px;font-size:clamp(19px,2.2vw,23px);line-height:1.55;max-width:34em;text-wrap:pretty}
.unete .row p.lead{font-size:clamp(22px,2.8vw,30px);line-height:1.35;font-weight:500;letter-spacing:-.01em}
.unete .row aside{grid-column:2;align-self:start;font-family:var(--hand);font-weight:600;font-size:24px;line-height:1.1;color:var(--ember);padding-top:4px;position:relative;transform:rotate(-2deg)}
.unete .row aside::before{content:"←";margin-right:6px;font-family:var(--body);font-weight:700;font-size:18px}
.unete mark{background:linear-gradient(transparent 58%, var(--lime) 58%, var(--lime) 92%, transparent 92%);color:inherit;padding:0 .08em}
.unete .brand{display:inline-block;font-family:var(--display);font-weight:700;font-size:.82em;letter-spacing:-.01em;padding:.08em .5em .12em;border:1.5px solid var(--ink);border-radius:999px;margin:.1em .05em;line-height:1.3;white-space:nowrap}
.unete .brand:nth-of-type(5n+1){background:var(--lime)}
.unete .brand:nth-of-type(5n+2){background:var(--sky)}
.unete .brand:nth-of-type(5n+3){background:var(--violet)}
.unete .brand:nth-of-type(5n+4){background:var(--bone)}
.unete .brand:nth-of-type(5n){background:#FFD2BF}
.unete .sign{grid-column:1;margin:18px 0 0;display:flex;align-items:flex-end;gap:20px;flex-wrap:wrap}
.unete .sig{font-family:var(--hand);font-weight:700;font-size:clamp(56px,8vw,80px);line-height:.8;transform:rotate(-4deg);transform-origin:left bottom}
.unete .who{font-family:var(--mono);font-size:13px;color:var(--soft);letter-spacing:.04em;padding-bottom:6px}
.unete .pd{margin-top:clamp(56px,8vw,96px);border-top:2px dashed var(--ink);padding-top:clamp(32px,5vw,48px);display:grid;grid-template-columns:minmax(0,1fr) 220px;column-gap:48px}
.unete .pd h2{grid-column:1;font-family:var(--display);font-weight:800;font-size:clamp(34px,5.4vw,58px);line-height:1;letter-spacing:-.03em;margin:0 0 12px}
.unete .pd h2 em{font-style:normal;color:var(--ember)}
.unete .pd .intro{grid-column:1;font-size:19px;color:var(--soft);margin:0 0 28px;max-width:34em}
.unete .pd aside{grid-column:2;grid-row:1 / span 2;align-self:center;font-family:var(--hand);font-weight:600;font-size:24px;line-height:1.1;color:var(--ember);transform:rotate(3deg)}
.unete form{grid-column:1;display:grid;gap:30px;max-width:36em}
.unete .f label{display:block;font-size:clamp(18px,2vw,21px);font-weight:500;line-height:1.35;margin-bottom:8px;text-wrap:balance}
.unete .f label b{font-family:var(--mono);font-size:13px;font-weight:700;color:var(--ember);margin-right:8px;letter-spacing:.06em}
.unete .f input,.unete .f textarea{width:100%;font:inherit;font-size:19px;color:var(--ink);background:transparent;border:0;border-bottom:2px solid var(--ink);padding:8px 2px;resize:vertical;border-radius:0}
.unete .f textarea{background-image:repeating-linear-gradient(transparent 0 37px, var(--line) 37px 38px);line-height:38px;padding-top:0;border-bottom-width:2px}
.unete .f input::placeholder,.unete .f textarea::placeholder{color:#9A998C}
.unete .f input:focus,.unete .f textarea:focus{outline:none;border-bottom-color:var(--ember)}
.unete .send{display:flex;flex-wrap:wrap;align-items:center;gap:18px;margin-top:6px}
.unete .btn{display:inline-flex;align-items:center;gap:10px;font:inherit;font-weight:700;font-size:18px;cursor:pointer;padding:17px 26px;border-radius:999px;background:var(--ink);color:var(--lime);border:2px solid var(--ink);transition:transform .15s ease, box-shadow .15s ease}
.unete .btn:hover{transform:translate(-2px,-2px);box-shadow:4px 4px 0 var(--ember)}
.unete .note{font-family:var(--mono);font-size:12px;color:var(--soft);letter-spacing:.04em;max-width:30ch}
.unete .err{color:var(--ember);font-weight:500;margin:0}
.unete footer{margin-top:64px;padding-top:18px;border-top:1px solid var(--line);display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;font-family:var(--mono);font-size:12px;letter-spacing:.06em;color:var(--soft)}
@media (max-width:820px){.unete .letter,.unete .pd{grid-template-columns:1fr}.unete .row aside,.unete .pd aside{grid-column:1;grid-row:auto;margin:-10px 0 26px 0;font-size:22px}.unete .pd aside{margin:0 0 24px}}
@media (prefers-reduced-motion:reduce){.unete .btn{transition:none}.unete .btn:hover{transform:none}}
`

const BODY = `
<div class="page">
  <header>
    <a href="/" class="logo">suuplai<span>.</span></a>
    <div class="stamp">Una carta, no una vacante</div>
  </header>

  <article class="letter">
    <p class="meta">Ciudad de México · septiembre 2026</p>
    <h1 class="hola">Hola<span>,</span></h1>

    <div class="row">
      <p class="lead">No te voy a describir un puesto. Te quiero contar qué estoy construyendo, y si te da curiosidad, <mark>platicamos.</mark></p>
    </div>

    <div class="row">
      <p>Se llama Suuplai. Hay marcas mexicanas increíbles, como <span class="brand">Flavourit</span> <span class="brand">Noodo</span> <span class="brand">Looms</span> <span class="brand">Capicúa</span>, entre otras, y tiendas independientes que buscan justo eso. Nosotros las juntamos, en la Ciudad de México y en Guadalajara, con tecnología que construimos nosotros mismos.</p>
      <aside>algunas de las marcas con las que ya trabajamos</aside>
    </div>

    <div class="row">
      <p>Somos un equipo chico y vamos rápido. Tan rápido que lo que necesito hoy no es lo que voy a necesitar en seis meses. Por eso no hay descripción de puesto: <mark>prefiero encontrar a la persona correcta y armar el rol con ella.</mark></p>
      <aside>sí, en serio, no hay descripción</aside>
    </div>

    <div class="row">
      <p>No me importa qué estudiaste, de dónde vienes o si esta es tu primera chamba. Me importa que seas de palabra, que te guste la gente y que tengas ganas de aprender. Lo demás lo aprendemos juntos.</p>
    </div>

    <div class="row">
      <p>Lo que sí te puedo prometer: vas a aprender de todo, lo que hagas se va a notar y, si empujas, subes. <mark>Quien entra ahora, entra desde el principio.</mark></p>
      <aside>esto es lo importante</aside>
    </div>

    <div class="row">
      <p>Si llegaste hasta aquí, algo te llamó. Escríbeme.</p>
    </div>

    <div class="sign">
      <div class="sig">Santiago</div>
      <div class="who">Fundador · Suuplai</div>
    </div>
  </article>

  <section class="pd" id="aplica">
    <h2>P.D. <em>Contéstame tres cosas.</em></h2>
    <p class="intro">Sin CV. Contesta como hablarías. Al mandarlo se abre WhatsApp con tus respuestas y te contesto yo.</p>
    <aside>dos minutos, lo prometo</aside>

    <form id="q" novalidate>
      <div class="f">
        <label for="q-name"><b>00</b>¿Cómo te llamas?</label>
        <input id="q-name" name="name" type="text" autocomplete="name" placeholder="Tu nombre">
      </div>
      <div class="f">
        <label for="q-1"><b>01</b>Cuéntame algo que hiciste porque tú quisiste, no porque te lo pidieron.</label>
        <textarea id="q-1" name="q1" rows="3" placeholder="Un proyecto, un negocio, un viaje, lo que sea"></textarea>
      </div>
      <div class="f">
        <label for="q-2"><b>02</b>¿Qué te dio curiosidad de esta carta?</label>
        <textarea id="q-2" name="q2" rows="2" placeholder="Sé honesto"></textarea>
      </div>
      <div class="f">
        <label for="q-3"><b>03</b>¿Qué días y horarios tienes libres?</label>
        <input id="q-3" name="q3" type="text" placeholder="Ej. martes y jueves en la mañana">
      </div>
      <p class="err" id="q-err" hidden>Contesta las cuatro para poder mandarlo.</p>
      <div class="send">
        <button class="btn" type="submit">Mandar por WhatsApp →</button>
        <span class="note">Si hace clic, platicamos 20 minutos y luego pasas un día con nosotros.</span>
      </div>
    </form>
  </section>

  <footer>
    <span>suuplai. · CDMX · GDL</span>
    <span>suuplai.com.mx</span>
  </footer>
</div>
`

export function UneteSuuplai() {
  useEffect(() => {
    const f = document.getElementById('q') as HTMLFormElement | null
    const err = document.getElementById('q-err') as HTMLElement | null
    if (!f) return
    const onSubmit = (e: Event) => {
      e.preventDefault()
      const v = (id: string) => (document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null)?.value.trim() || ''
      const n = v('q-name'), a = v('q-1'), b = v('q-2'), c = v('q-3')
      if (!n || !a || !b || !c) { if (err) err.hidden = false; return }
      if (err) err.hidden = true
      const msg = `Hola Santiago, soy ${n}. Leí tu carta de Suuplai.\n\n` +
        `*Algo que hice porque quise:*\n${a}\n\n` +
        `*Lo que me dio curiosidad:*\n${b}\n\n` +
        `*Días y horarios libres:*\n${c}`
      window.open('https://wa.me/525585496699?text=' + encodeURIComponent(msg), '_blank', 'noopener')
    }
    f.addEventListener('submit', onSubmit)
    return () => f.removeEventListener('submit', onSubmit)
  }, [])

  return (
    <div className="unete">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div dangerouslySetInnerHTML={{ __html: BODY }} />
    </div>
  )
}
