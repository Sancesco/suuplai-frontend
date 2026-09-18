'use client'

// Página pública del CRM de Suuplai (suuplai.com.mx/crm).
// "Lo haces tú": base de contactos + herramienta. Precio $1,000/mes o $6,000/año.
// Mismo lenguaje visual que /agente-comercial, con acento lima (la herramienta).

import { useEffect } from 'react'

const DEMO = 'https://calendar.app.google/LfAtSiFF7xAJ7YPx9'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap');
.crm{--void:#0A0A0F;--carbon:#131319;--lime:#E8FF47;--ember:#FF6B35;--bone:#FFFEF3;--ash:rgba(255,254,243,.62);--muted:rgba(255,254,243,.38);--line:rgba(255,254,243,.13);--soft:rgba(255,254,243,.06)}
.crm{background:var(--void);color:var(--bone);font-family:'DM Sans',system-ui,sans-serif;font-size:17px;line-height:1.6;-webkit-font-smoothing:antialiased;min-height:100vh}
.crm *{box-sizing:border-box;margin:0;padding:0}
.crm .wrap{max-width:1140px;margin:0 auto;padding:0 24px}
.crm section{padding:96px 0;border-bottom:1px solid var(--soft)}
.crm .kick{font-family:'Space Mono';font-weight:700;font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:var(--lime);margin-bottom:20px;display:block}
.crm h1{font-family:'Syne';font-weight:800;font-size:clamp(38px,6.4vw,72px);line-height:.99;letter-spacing:-.035em}
.crm h2{font-family:'Syne';font-weight:800;font-size:clamp(28px,4.4vw,46px);line-height:1.04;letter-spacing:-.03em}
.crm h3{font-family:'Syne';font-weight:800;font-size:20px;line-height:1.2;letter-spacing:-.012em}
.crm h1 em,.crm h2 em{font-style:normal;color:var(--lime)}
.crm p{color:var(--ash)}
.crm p strong{color:var(--bone);font-weight:500}
.crm .lead{font-size:19px;line-height:1.5;max-width:600px;margin-top:22px}
.crm .btn{display:inline-block;font-family:'DM Sans';font-weight:700;font-size:15px;padding:15px 28px;border-radius:100px;text-decoration:none;border:1.5px solid transparent}
.crm .btn-p{background:var(--lime);color:var(--void)}
.crm .btn-s{border-color:var(--line);color:var(--bone)}
.crm .btn-e{background:var(--ember);color:var(--void)}
.crm .btns{display:flex;gap:12px;flex-wrap:wrap;margin-top:34px}
.crm nav{position:sticky;top:0;z-index:60;background:rgba(10,10,15,.92);backdrop-filter:blur(8px);border-bottom:1px solid var(--soft);padding:17px 0}
.crm nav .wrap{display:flex;align-items:center;gap:18px}
.crm .logo{font-family:'Syne';font-weight:800;font-size:22px;letter-spacing:-.02em;color:var(--lime);text-decoration:none}
.crm nav .links{display:flex;gap:26px;margin-left:28px}
.crm nav .links a{color:var(--ash);text-decoration:none;font-size:15px}
.crm nav .btn{margin-left:auto;padding:11px 22px;font-size:14px}
.crm .hero{padding:96px 0 80px;position:relative;overflow:hidden}
.crm .hero:after{content:'';position:absolute;width:680px;height:680px;right:-220px;top:-260px;background:radial-gradient(circle,rgba(232,255,71,.12),transparent 66%);pointer-events:none}
.crm .hero .row{display:flex;gap:34px;flex-wrap:wrap;align-items:center;position:relative;z-index:2}
.crm .hero .col{flex:1 1 400px;min-width:min(100%,320px)}
.crm .pills{margin-top:26px;display:flex;gap:10px;flex-wrap:wrap}
.crm .pill{display:inline-flex;align-items:baseline;gap:8px;background:var(--carbon);border:1px solid var(--line);border-radius:100px;padding:10px 18px}
.crm .pill .b{font-family:'Syne';font-weight:800;font-size:22px;color:var(--lime)}
.crm .pill .s{font-family:'Space Mono';font-size:11px;color:var(--muted);letter-spacing:.06em}
.crm .heroShot{flex:1 1 440px;min-width:min(100%,320px);perspective:1400px}
.crm .heroShot img{width:100%;display:block;border-radius:8px;filter:drop-shadow(0 40px 70px rgba(0,0,0,.6));transform:rotateY(-12deg) rotateX(6deg) rotate(1deg)}
.crm .band{text-align:center;background:linear-gradient(180deg,var(--void),rgba(232,255,71,.05),var(--void))}
.crm .band .n{font-family:'Syne';font-weight:800;font-size:clamp(56px,13vw,128px);line-height:.9;letter-spacing:-.04em;color:var(--lime)}
.crm .band .l{font-family:'Space Mono';font-weight:700;font-size:12px;letter-spacing:.2em;color:var(--muted);text-transform:uppercase;margin-top:10px}
.crm .band p{max-width:56ch;margin:22px auto 0;font-size:16px}
.crm .scn{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center;margin-top:0}
.crm .scn.flip .cp{order:2}
.crm .scn .fw{perspective:1500px}
.crm .scn .frame{transform-origin:center 40%;will-change:transform,opacity}
.crm .scn .frame img{width:100%;display:block;border-radius:6px;filter:drop-shadow(0 30px 55px rgba(0,0,0,.55))}
.crm .scn .ey{font-family:'Space Mono';font-weight:700;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--lime);display:block;margin-bottom:14px}
.crm .scn.e .ey{color:var(--ember)}
.crm .scn h3{font-size:clamp(24px,3.4vw,38px);letter-spacing:-.025em;line-height:1.02}
.crm .scn p{font-size:15.5px;margin-top:14px;max-width:44ch}
.crm .scn ul{list-style:none;margin-top:18px}
.crm .scn li{padding-left:22px;position:relative;margin-bottom:10px;font-size:15px;color:var(--ash)}
.crm .scn li:before{content:'';position:absolute;left:0;top:7px;width:8px;height:8px;border-radius:2px;background:var(--lime);box-shadow:0 0 0 4px rgba(232,255,71,.12)}
.crm .scn.e li:before{background:var(--ember);box-shadow:0 0 0 4px rgba(255,107,53,.14)}
.crm .rev{opacity:0;transform:translateY(22px)}
.crm .rev.in{opacity:1;transform:none;transition:opacity .7s ease,transform .7s cubic-bezier(.2,.7,.2,1)}
.crm .plans{display:flex;gap:18px;flex-wrap:wrap;margin-top:44px;align-items:stretch;justify-content:center}
.crm .plan{flex:1;min-width:280px;max-width:400px;border:1px solid var(--line);border-radius:20px;padding:34px 30px;display:flex;flex-direction:column;background:var(--carbon)}
.crm .plan.best{border:2px solid var(--lime);background:rgba(232,255,71,.045);position:relative}
.crm .plan .tg{font-family:'Space Mono';font-weight:700;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}
.crm .plan.best .tg{color:var(--lime)}
.crm .plan .price{font-family:'Syne';font-weight:800;font-size:46px;line-height:1;letter-spacing:-.045em;margin-top:14px}
.crm .plan.best .price{color:var(--lime)}
.crm .plan .per{font-family:'Space Mono';font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-top:8px}
.crm .plan .save{display:inline-block;margin-top:12px;font-family:'Space Mono';font-size:11px;color:var(--lime);background:rgba(232,255,71,.1);border-radius:100px;padding:5px 12px;letter-spacing:.04em}
.crm .plan ul{list-style:none;margin-top:22px;flex:1}
.crm .plan li{padding-left:22px;position:relative;margin-bottom:11px;font-size:15px;color:var(--ash)}
.crm .plan li:before{content:'+';position:absolute;left:0;top:-1px;color:var(--lime);font-family:'Space Mono';font-weight:700}
.crm .plan .btn{margin-top:26px;text-align:center;width:100%}
.crm .cross{border:1px solid var(--line);border-radius:20px;padding:30px 32px;display:flex;gap:22px;align-items:center;justify-content:space-between;flex-wrap:wrap;background:linear-gradient(120deg,rgba(255,107,53,.09),rgba(232,255,71,.05))}
.crm .cross h3{font-size:clamp(20px,2.6vw,28px)}
.crm .close{text-align:center;padding:110px 0;border:none}
.crm .close .lead{margin-left:auto;margin-right:auto}
.crm .close .btns{justify-content:center}
.crm footer{padding:46px 0;text-align:center;border-top:1px solid var(--soft)}
.crm footer p{font-family:'Space Mono';font-size:12px;letter-spacing:.11em;color:var(--muted);margin-top:14px}
@media(max-width:760px){.crm nav .links{display:none}.crm .scn{grid-template-columns:1fr;gap:24px}.crm .scn.flip .cp{order:0}.crm .heroShot img{transform:rotateY(-7deg) rotateX(4deg)}}
@media(max-width:640px){.crm section{padding:68px 0}.crm .hero{padding:64px 0 56px}}
@media(prefers-reduced-motion:reduce){.crm .scn .frame{transform:none!important}.crm .rev{opacity:1;transform:none}.crm .heroShot img{transform:none}}
`

const BODY = `
<nav>
  <div class="wrap">
    <a href="/" class="logo">suuplai.</a>
    <div class="links">
      <a href="#contactos">Contactos</a>
      <a href="#herramienta">Herramienta</a>
      <a href="#precio">Precio</a>
    </div>
    <a href="${DEMO}" class="btn btn-p">Empezar</a>
  </div>
</nav>

<header class="hero" id="top">
  <div class="wrap row">
    <div class="col">
      <span class="kick">El CRM de Suuplai · para tu equipo</span>
      <h1>Miles de tiendas.<br>La herramienta<br>para <em>cerrarlas</em>.</h1>
      <p class="lead">La misma plataforma con la que operamos como agencia, ahora en tus manos. <strong>No empiezas de cero: arrancas con una base de miles de puntos de venta</strong> para prospectar, con pipeline, rutas, entregas firmadas e inventario.</p>
      <div class="pills">
        <span class="pill"><span class="b">$1,000</span><span class="s">/ mes</span></span>
        <span class="pill"><span class="b">$6,000</span><span class="s">/ año · ahorras $6,000</span></span>
      </div>
    </div>
    <div class="heroShot"><img src="/screenshots/dashboard-d.webp" alt="CRM de Suuplai" loading="lazy"></div>
  </div>
</header>

<section class="band">
  <div class="wrap">
    <div class="n">12,600+</div>
    <div class="l">Puntos de venta en la base</div>
    <p>Boutiques saludables, delis, cafés de especialidad, mercados orgánicos y más, filtrables por zona, ciudad y categoría. No prospectas a ciegas: sabes exactamente a quién tocar.</p>
  </div>
</section>

<section class="alt" id="contactos">
  <div class="wrap">
    <div class="scn e">
      <div class="cp rev"><span class="ey">Contactos</span><h3>No prospectas<br>a ciegas.</h3><p>Un directorio real de puntos de venta con teléfono, rating y reseñas a la vista. Filtra por colonia, ciudad, tipo o cercanía, guarda tus búsquedas y llama o manda WhatsApp desde la misma tabla.</p><ul><li>Miles de PDV listos para prospectar</li><li>Filtros por zona, ciudad y categoría</li><li>Teléfono, rating y reseñas por tienda</li></ul></div>
      <div class="fw"><div class="frame"><img src="/screenshots/tiendas-d.webp" alt="Directorio de contactos" loading="lazy"></div></div>
    </div>
  </div>
</section>

<section id="herramienta">
  <div class="wrap">
    <div class="scn flip">
      <div class="cp rev"><span class="ey">Pipeline</span><h3>Cada cuenta,<br>en su etapa.</h3><p>De "sin contactar" a "cuenta abierta" en un tablero que se lee de un vistazo. Arrastra una tarjeta y la cuenta avanza. Lo vencido se pinta de naranja para que nada se te enfríe.</p><ul><li>Tablero por etapas, arrastrable</li><li>Próximo paso y días atorado</li><li>Llamar, WhatsApp y registrar sin salir</li></ul></div>
      <div class="fw"><div class="frame"><img src="/screenshots/pipeline-d.webp" alt="Pipeline por etapas" loading="lazy"></div></div>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="scn e">
      <div class="cp rev"><span class="ey">Rutas y entregas</span><h3>Rutas de muestreo,<br>y la prueba firmada.</h3><p>Arma la ruta del día, optimízala sola desde tu salida y comparte el link en vivo. Cada muestra se entrega con firma, fecha y ubicación verificada: prueba real de cada visita.</p><ul><li>Ruta optimizada y link en vivo</li><li>Comprobante con firma y geolocalización</li><li>Inventario a repartir por parada</li></ul></div>
      <div class="fw"><div class="frame"><img src="/screenshots/ruta-d.webp" alt="Ruta y entregas" loading="lazy"></div></div>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="scn flip">
      <div class="cp rev"><span class="ey">Muestras y catálogos</span><h3>Tu inventario<br>y tus precios,<br>en orden.</h3><p>Controla existencia por SKU con alertas de bajo stock, y arma catálogos con el precio que le toca a cada tienda (mayoreo o consignación) listos para mandar como cotización.</p><ul><li>Inventario de muestras con alertas</li><li>Catálogo con precio por tienda</li><li>Link con analíticas de apertura</li></ul></div>
      <div class="fw"><div class="frame"><img src="/screenshots/catalogo-d.webp" alt="Inventario y catálogos" loading="lazy"></div></div>
    </div>
  </div>
</section>

<section id="precio">
  <div class="wrap" style="text-align:center">
    <span class="kick" style="display:inline-block">Precio simple</span>
    <h2>Toda la herramienta y los contactos.</h2>
    <div class="plans">
      <div class="plan">
        <div class="tg">Mensual</div>
        <div class="price">$1,000</div>
        <div class="per">MXN / mes</div>
        <ul>
          <li>Base de 12,600+ puntos de venta</li>
          <li>Pipeline, rutas y entregas firmadas</li>
          <li>Inventario y catálogos con precios</li>
          <li>Cancela cuando quieras</li>
        </ul>
        <a href="${DEMO}" class="btn btn-s">Empezar</a>
      </div>
      <div class="plan best">
        <div class="tg">Anual · el mejor trato</div>
        <div class="price">$6,000</div>
        <div class="per">MXN / año</div>
        <span class="save">Ahorras $6,000 (medio año gratis)</span>
        <ul>
          <li>Todo lo del plan mensual</li>
          <li>Un solo pago, sin mensualidades</li>
          <li>Prioridad en soporte y nuevas funciones</li>
        </ul>
        <a href="${DEMO}" class="btn btn-p">Empezar al año</a>
      </div>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="cross">
      <div>
        <span class="kick" style="margin-bottom:10px">¿No quieres operarlo tú?</span>
        <h3>Deja que tu marca la trabaje nuestro equipo.</h3>
        <p style="margin-top:8px;max-width:52ch">Con el Agente Comercial nosotros prospectamos, muestreamos y cerramos por ti. Tú ves todo en vivo, desde $4,000 al mes.</p>
      </div>
      <a href="/agente-comercial" class="btn btn-e">Ver Agente Comercial &#8594;</a>
    </div>
  </div>
</section>

<section class="close">
  <div class="wrap">
    <h2>Los contactos ya están.<br>Solo falta que <em>los cierres</em>.</h2>
    <p class="lead">Arranca con miles de puntos de venta y la herramienta completa para convertirlos en anaquel.</p>
    <div class="btns">
      <a href="${DEMO}" class="btn btn-p">Empezar por $1,000/mes</a>
      <a href="/agente-comercial" class="btn btn-s">Ver Agente Comercial</a>
    </div>
  </div>
</section>

<footer>
  <div class="wrap">
    <a href="#top" class="logo">suuplai.</a>
    <p>55 8549 6699 &middot; hola@suups.com.mx &middot; suuplai.com.mx</p>
    <p style="color:var(--lime)">Inteligencia comercial &middot; Retail B2B</p>
  </div>
</footer>
`

export function CrmComercial() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }),
      { threshold: 0.16, rootMargin: '0px 0px -8% 0px' },
    )
    document.querySelectorAll('.crm .rev').forEach((el) => io.observe(el))

    const frames = Array.from(document.querySelectorAll<HTMLElement>('.crm .scn .frame'))
    let raf = 0
    const update = () => {
      raf = 0
      const vh = window.innerHeight
      for (const f of frames) {
        const r = f.getBoundingClientRect()
        const c = r.top + r.height / 2
        let t = (vh - c) / (vh * 0.62)
        t = t < 0 ? 0 : t > 1 ? 1 : t
        f.style.transform = `translateY(${((1 - t) * 58).toFixed(1)}px) rotateX(${((1 - t) * 6).toFixed(2)}deg) scale(${(0.96 + t * 0.04).toFixed(3)})`
        f.style.opacity = (0.45 + t * 0.55).toFixed(3)
      }
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    if (!reduce && frames.length) {
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('resize', onScroll, { passive: true })
      update()
    }
    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="crm">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div dangerouslySetInnerHTML={{ __html: BODY }} />
    </div>
  )
}
