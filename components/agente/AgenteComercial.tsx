'use client'

// Página pública de Agente Comercial (suuplai.com.mx/agente-comercial).
// Diseño autocontenido: CSS + markup inyectados, para reflejar exactamente el arte aprobado.
// Pricing por niveles (Entrada / Ruta / Exclusiva). Actualizado sep 2026.
// Sección "Velo en acción" (screenshots del CRM con parallax al scroll).

import { useEffect } from 'react'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap');
.ac{--void:#0A0A0F;--carbon:#131319;--lime:#E8FF47;--ember:#FF6B35;--bone:#FFFEF3;--ash:rgba(255,254,243,.62);--muted:rgba(255,254,243,.38);--line:rgba(255,254,243,.13);--soft:rgba(255,254,243,.06)}
.ac{background:var(--void);color:var(--bone);font-family:'DM Sans',system-ui,sans-serif;font-size:17px;line-height:1.6;-webkit-font-smoothing:antialiased;min-height:100vh}
.ac *{box-sizing:border-box;margin:0;padding:0}
.ac .wrap{max-width:1140px;margin:0 auto;padding:0 24px}
.ac section{padding:100px 0;border-bottom:1px solid var(--soft)}
.ac .kick{font-family:'Space Mono';font-weight:700;font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:var(--ember);margin-bottom:20px;display:block}
.ac h1{font-family:'Syne';font-weight:800;font-size:clamp(38px,6.4vw,70px);line-height:.99;letter-spacing:-.035em}
.ac h2{font-family:'Syne';font-weight:800;font-size:clamp(28px,4.4vw,46px);line-height:1.04;letter-spacing:-.03em}
.ac h3{font-family:'Syne';font-weight:700;font-size:20px;line-height:1.2;letter-spacing:-.012em}
.ac h1 em,.ac h2 em{font-style:normal;color:var(--lime)}
.ac p{color:var(--ash)}
.ac p strong{color:var(--bone);font-weight:500}
.ac .lead{font-size:19px;line-height:1.5;max-width:640px;margin-top:22px}
.ac .btn{display:inline-block;font-family:'DM Sans';font-weight:700;font-size:15px;padding:15px 28px;border-radius:100px;text-decoration:none;border:1.5px solid transparent}
.ac .btn-p{background:var(--lime);color:var(--void)}
.ac .btn-s{border-color:var(--line);color:var(--bone)}
.ac .btns{display:flex;gap:12px;flex-wrap:wrap;margin-top:36px}
.ac nav{position:sticky;top:0;z-index:60;background:rgba(10,10,15,.92);backdrop-filter:blur(8px);border-bottom:1px solid var(--soft);padding:17px 0}
.ac nav .wrap{display:flex;align-items:center;gap:18px}
.ac .logo{font-family:'Syne';font-weight:800;font-size:22px;letter-spacing:-.02em;color:var(--lime);text-decoration:none}
.ac nav .links{display:flex;gap:26px;margin-left:28px}
.ac nav .links a{color:var(--ash);text-decoration:none;font-size:15px}
.ac nav .btn{margin-left:auto;padding:11px 22px;font-size:14px}
.ac .hero{padding:112px 0 92px;border-bottom:1px solid var(--soft);position:relative;overflow:hidden}
.ac .hero:after{content:'';position:absolute;width:660px;height:660px;right:-200px;top:-240px;background:radial-gradient(circle,rgba(232,255,71,.11),transparent 66%);pointer-events:none}
.ac .hero .wrap{position:relative;z-index:2}
.ac .proof{display:flex;gap:14px;flex-wrap:wrap;margin-top:64px}
.ac .proof>div{flex:1;min-width:158px;border:1px solid var(--line);border-radius:14px;padding:24px 22px}
.ac .proof .n{font-family:'Syne';font-weight:800;font-size:40px;line-height:1;letter-spacing:-.04em;color:var(--lime)}
.ac .proof .l{font-family:'Space Mono';font-weight:700;font-size:10px;letter-spacing:.17em;text-transform:uppercase;color:var(--muted);margin-top:13px;line-height:1.65}
.ac .zonas{margin-top:66px;padding-top:34px;border-top:1px solid var(--line)}
.ac .zt{font-family:'Space Mono';font-weight:700;font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);display:block}
.ac .zl{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}
.ac .zl span{font-family:'Syne';font-weight:700;font-size:16px;letter-spacing:-.01em;color:var(--bone);border:1px solid var(--line);border-radius:100px;padding:8px 18px}
.ac .zf{display:block;margin-top:22px;font-size:15.5px;color:var(--ash);max-width:620px}
.ac .logos{display:flex;flex-wrap:wrap;gap:16px;margin-top:24px;align-items:stretch}
.ac .logo-chip{background:#fff;border-radius:18px;width:200px;height:124px;display:flex;align-items:center;justify-content:center;padding:12px;box-shadow:0 10px 28px rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.10);transition:transform .22s ease,box-shadow .22s ease}
.ac .logo-chip:hover{transform:translateY(-4px);box-shadow:0 16px 40px rgba(0,0,0,.58)}
.ac .logo-chip img{max-height:98px;max-width:172px;width:auto;height:auto;object-fit:contain;display:block;image-rendering:auto}
.ac .logo-more{width:200px;height:124px;border:1.5px dashed rgba(232,255,71,.45);border-radius:18px;display:flex;align-items:center;justify-content:center;text-align:center;font-family:'Syne';font-weight:800;font-size:17px;color:var(--lime);line-height:1.15;padding:0 16px;transition:background .22s ease}
.ac .logo-more:hover{background:rgba(232,255,71,.06)}
@media(max-width:640px){.ac .logo-chip,.ac .logo-more{width:calc(50% - 8px);height:112px}}
.ac .cols{display:flex;gap:20px;flex-wrap:wrap;margin-top:52px}
.ac .cols>div{flex:1;min-width:290px;border:1px solid var(--line);border-radius:18px;padding:32px}
.ac .cols .bad{opacity:.5}
.ac .cols .good{border-color:var(--lime)}
.ac .cols ul{list-style:none;margin-top:20px}
.ac .cols li{padding-left:26px;position:relative;margin-bottom:13px;color:var(--ash);font-size:15.5px;line-height:1.45}
.ac .cols li:before{position:absolute;left:0;top:0;font-family:'Space Mono';font-weight:700}
.ac .bad li:before{content:'\\2715';color:var(--muted)}
.ac .good li:before{content:'\\2713';color:var(--lime)}
.ac .steps{display:flex;gap:18px;flex-wrap:wrap;margin-top:52px}
.ac .steps>div{flex:1;min-width:232px}
.ac .steps .num{font-family:'Syne';font-weight:800;font-size:15px;color:var(--ember);border:1.5px solid var(--ember);width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:18px}
.ac .steps p{font-size:15.5px;margin-top:10px}
.ac .plans{display:flex;gap:16px;flex-wrap:wrap;margin-top:54px;align-items:stretch}
.ac .plan{flex:1;min-width:290px;border:1px solid var(--line);border-radius:20px;padding:34px 30px 32px;display:flex;flex-direction:column;background:var(--carbon)}
.ac .plan.star{border:2px solid var(--lime);position:relative;background:rgba(232,255,71,.045)}
.ac .plan.top{border:2px solid var(--ember);position:relative;background:rgba(255,107,53,.05)}
.ac .tag{position:absolute;top:-13px;left:28px;font-family:'Space Mono';font-weight:700;font-size:10px;letter-spacing:.16em;text-transform:uppercase;padding:6px 15px;border-radius:100px}
.ac .tag.l{background:var(--lime);color:var(--void)}
.ac .tag.e{background:var(--ember);color:#fff}
.ac .plan .lvl{font-family:'Space Mono';font-weight:700;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}
.ac .plan .name{font-family:'Syne';font-weight:800;font-size:27px;letter-spacing:-.025em;margin-top:8px}
.ac .plan .price{font-family:'Syne';font-weight:800;font-size:44px;line-height:1;letter-spacing:-.045em;margin-top:20px}
.ac .plan.star .price{color:var(--lime)}
.ac .plan.top .price{color:var(--ember)}
.ac .plan .per{font-family:'Space Mono';font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-top:10px}
.ac .plan .vol{margin-top:20px;padding-top:18px;border-top:1px solid var(--line);font-size:15px;color:var(--ash)}
.ac .plan .vol b{font-family:'Syne';font-weight:800;font-size:20px;color:var(--bone);letter-spacing:-.02em}
.ac .plan ul{list-style:none;margin-top:20px;flex:1}
.ac .plan li{padding-left:22px;position:relative;margin-bottom:11px;font-size:15px;line-height:1.42;color:var(--ash)}
.ac .plan li:before{content:'+';position:absolute;left:0;top:-1px;color:var(--lime);font-family:'Space Mono';font-weight:700;font-size:14px}
.ac .plan li.base:before{content:'\\2014';color:var(--muted);font-size:12px;top:0}
.ac .plan.top li:before{color:var(--ember)}
.ac .plan li strong{color:var(--bone);font-weight:600}
.ac .plan .btn{margin-top:26px;text-align:center;width:100%}
.ac .extras{margin-top:32px;border:1px solid var(--line);border-radius:16px;overflow:hidden}
.ac .extras .h{background:var(--lime);color:var(--void);display:flex;justify-content:space-between;padding:12px 26px;font-family:'Space Mono';font-weight:700;font-size:10.5px;letter-spacing:.17em;text-transform:uppercase}
.ac .extras .r{display:flex;justify-content:space-between;gap:20px;padding:15px 26px;border-top:1px solid var(--soft);font-size:15.5px;color:var(--ash)}
.ac .extras .r span:last-child{font-family:'Space Mono';font-size:14px;color:var(--bone);white-space:nowrap}
.ac .note{margin-top:24px;border:1px solid var(--ember);border-radius:16px;padding:26px 30px;background:rgba(255,107,53,.06)}
.ac .note p{font-size:15.5px}
.ac .roi{display:flex;gap:18px;flex-wrap:wrap;align-items:center;margin-top:48px}
.ac .roi>div{flex:1;min-width:180px;text-align:center;border:1px solid var(--line);border-radius:16px;padding:30px 20px}
.ac .roi .big{font-family:'Syne';font-weight:800;font-size:38px;line-height:1;letter-spacing:-.04em;color:var(--lime)}
.ac .roi .sm{font-size:14px;color:var(--muted);margin-top:12px;line-height:1.45}
.ac .roi .arrow{flex:0 0 auto;min-width:0;border:none;padding:0;color:var(--muted);font-size:22px}
.ac .faq{margin-top:48px}
.ac .faq>div{border-top:1px solid var(--line);padding:26px 0}
.ac .faq>div:last-child{border-bottom:1px solid var(--line)}
.ac .faq h3{font-size:18px}
.ac .faq p{font-size:15.5px;margin-top:9px;max-width:760px}
.ac .close{text-align:center;padding:112px 0;border:none}
.ac .close .lead{margin-left:auto;margin-right:auto}
.ac .close .btns{justify-content:center}
.ac footer{padding:46px 0;text-align:center;border-top:1px solid var(--soft)}
.ac footer p{font-family:'Space Mono';font-size:12px;letter-spacing:.11em;color:var(--muted);margin-top:14px}
.ac .showcase{background:linear-gradient(180deg,var(--void),#0b0b12 55%,var(--void))}
.ac .scn{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center;margin-top:56px}
.ac .scn.flip .cp{order:2}
.ac .scn .fw{perspective:1500px}
.ac .scn .frame{transform-origin:center 40%;will-change:transform,opacity}
.ac .scn .frame img{width:100%;display:block;border-radius:6px;filter:drop-shadow(0 30px 55px rgba(0,0,0,.55))}
.ac .scn .ey{font-family:'Space Mono';font-weight:700;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--lime);display:block;margin-bottom:14px}
.ac .scn.e .ey{color:var(--ember)}
.ac .scn h3{font-family:'Syne';font-weight:800;font-size:clamp(24px,3.4vw,38px);letter-spacing:-.025em;line-height:1.02}
.ac .scn p{font-size:15.5px;margin-top:14px;max-width:44ch}
.ac .scn ul{list-style:none;margin-top:18px}
.ac .scn li{padding-left:22px;position:relative;margin-bottom:10px;font-size:15px;color:var(--ash)}
.ac .scn li:before{content:'';position:absolute;left:0;top:7px;width:8px;height:8px;border-radius:2px;background:var(--lime);box-shadow:0 0 0 4px rgba(232,255,71,.12)}
.ac .scn.e li:before{background:var(--ember);box-shadow:0 0 0 4px rgba(255,107,53,.14)}
.ac .rev{opacity:0;transform:translateY(22px)}
.ac .rev.in{opacity:1;transform:none;transition:opacity .7s ease,transform .7s cubic-bezier(.2,.7,.2,1)}
.ac .phones{display:flex;gap:26px;justify-content:center;flex-wrap:wrap;margin-top:56px}
.ac .phones img{width:206px;max-width:44%;border-radius:6px;filter:drop-shadow(0 24px 44px rgba(0,0,0,.5))}
.ac .phcap{text-align:center;margin-top:26px;font-family:'Space Mono';font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.ac .crm-cross{border:1px solid var(--line);border-radius:20px;padding:30px 32px;display:flex;gap:22px;align-items:center;justify-content:space-between;flex-wrap:wrap;background:linear-gradient(120deg,rgba(255,107,53,.09),rgba(232,255,71,.05))}
.ac .crm-cross h3{font-family:'Syne';font-weight:800;font-size:clamp(20px,2.6vw,28px);letter-spacing:-.02em}
.ac .marquee{overflow:hidden;margin-top:22px;-webkit-mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent)}
.ac .marquee .track{display:flex;width:max-content;animation:acmar 32s linear infinite}
.ac .marquee:hover .track{animation-play-state:paused}
.ac .marquee .logo-chip,.ac .marquee .logo-more{flex:0 0 auto;margin:0 16px 0 0;width:180px;height:112px}
@keyframes acmar{to{transform:translateX(-50%)}}
.ac .dots{display:none;justify-content:center;gap:8px;margin-top:22px}
.ac .dots button{width:8px;height:8px;border-radius:50%;border:0;padding:0;background:var(--line);cursor:pointer;transition:width .25s ease,background .25s ease}
.ac .dots button.on{background:var(--lime);width:22px;border-radius:5px}
@media(max-width:760px){.ac nav .links{display:none}.ac .scn{grid-template-columns:1fr;gap:24px}.ac .scn.flip .cp{order:0}.ac .plans{flex-wrap:nowrap;overflow-x:auto;scroll-snap-type:x mandatory;gap:14px;margin:50px -24px 0;padding:22px 24px 12px;-webkit-overflow-scrolling:touch;scrollbar-width:none}.ac .plans::-webkit-scrollbar{display:none}.ac .plan{flex:0 0 86%;min-width:0;scroll-snap-align:center}.ac .dots{display:flex}}
@media(max-width:640px){.ac section{padding:70px 0}.ac .hero{padding:72px 0 60px}.ac .proof>div{min-width:calc(50% - 7px)}.ac .roi .arrow{display:none}.ac .extras .r{flex-direction:column;gap:4px}.ac .marquee .logo-chip,.ac .marquee .logo-more{width:150px;height:94px}.ac .marquee .logo-chip img{max-height:74px;max-width:126px}}
@media(max-width:760px){.ac .steps{display:block;margin-top:38px}.ac .steps>div{position:relative;padding:0 0 30px 58px;min-width:0}.ac .steps>div:not(:last-child):before{content:'';position:absolute;left:18px;top:44px;bottom:2px;width:2px;background:linear-gradient(var(--ember),rgba(255,107,53,.18))}.ac .steps .num{position:absolute;left:0;top:2px;margin-bottom:0}.ac .steps h3{padding-top:4px}.ac .steps p{margin-top:8px}}
@media(prefers-reduced-motion:reduce){.ac .scn .frame{transform:none!important}.ac .rev{opacity:1;transform:none}.ac .marquee .track{animation:none}}
`

const DEMO = 'https://calendar.app.google/LfAtSiFF7xAJ7YPx9'

const BODY = `
<nav>
  <div class="wrap">
    <a href="/" class="logo">suuplai.</a>
    <div class="links">
      <a href="#como">Cómo funciona</a>
      <a href="#enaccion">Velo en acción</a>
      <a href="#planes">Planes</a>
      <a href="#dudas">Dudas</a>
    </div>
    <a href="${DEMO}" class="btn btn-p">Reservar demo</a>
  </div>
</nav>

<header class="hero" id="top">
  <div class="wrap">
    <span class="kick">Suuplai · Agente Comercial</span>
    <h1>El equipo de ventas<br>que no tienes<br>que <em>contratar</em>.</h1>
    <p class="lead">Prospectamos, tocamos puertas y salimos a vender tu marca en tiendas físicas de México. Tú haces producto; nosotros abrimos cuentas.</p>
    <div class="btns">
      <a href="${DEMO}" class="btn btn-p">Reservar demo</a>
      <a href="#planes" class="btn btn-s">Ver planes</a>
    </div>
    <div class="zonas">
      <span class="zt">Marcas que ya confían en nosotros</span>
      <div class="marquee">
        <div class="track">
          <span class="logo-chip"><img src="/marcas/capicua.jpg" alt="Capicúa"></span>
          <span class="logo-chip"><img src="/marcas/cachito.jpg" alt="Cachito"></span>
          <span class="logo-chip"><img src="/marcas/riise.png" alt="Riise"></span>
          <span class="logo-chip"><img src="/marcas/noodo.png" alt="Noodo"></span>
          <span class="logo-more">y muchas más</span>
          <span class="logo-chip" aria-hidden="true"><img src="/marcas/capicua.jpg" alt=""></span>
          <span class="logo-chip" aria-hidden="true"><img src="/marcas/cachito.jpg" alt=""></span>
          <span class="logo-chip" aria-hidden="true"><img src="/marcas/riise.png" alt=""></span>
          <span class="logo-chip" aria-hidden="true"><img src="/marcas/noodo.png" alt=""></span>
          <span class="logo-more" aria-hidden="true">y muchas más</span>
        </div>
      </div>
      <span class="zf">Prospectando y abriendo cuentas en delis, tiendas orgánicas, minisúpers premium y carnicerías de especialidad en CDMX y Guadalajara.</span>
    </div>
  </div>
</header>

<section>
  <div class="wrap">
    <span class="kick">El problema real</span>
    <h2>Tu producto es bueno.<br>Llegar al anaquel <em>es el muro</em>.</h2>
    <p class="lead">Montar un equipo comercial cuesta sueldos, comisiones, gasolina y meses de curva. La mayoría de las marcas nunca cruza ese muro. Nosotros ya estamos del otro lado.</p>
    <div class="cols">
      <div class="bad">
        <span class="kick" style="color:var(--muted)">Solo, desde cero</span>
        <h3>Contratar un vendedor de calle</h3>
        <ul>
          <li>Sueldo, comisión y gasolina cada mes</li>
          <li>Meses hasta la primera venta</li>
          <li>Cero relaciones con compradores</li>
          <li>Tú gestionas, entrenas y persigues</li>
        </ul>
      </div>
      <div class="good">
        <span class="kick" style="color:var(--lime)">Con Suuplai</span>
        <h3>Un motor que ya está corriendo</h3>
        <ul>
          <li>Ya tocamos puertas en CDMX y Guadalajara</li>
          <li>Muestras en mano desde la semana uno</li>
          <li>Prospección, cierre y seguimiento incluidos</li>
          <li>Reporte real: quién probó, quién pidió, quién recompró</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<section id="como">
  <div class="wrap">
    <span class="kick">Cómo funciona</span>
    <h2>Cuatro pasos. De la muestra<br>al <em>anaquel</em>.</h2>
    <div class="steps">
      <div><div class="num">01</div><h3>Curamos</h3><p>Elegimos las tiendas afines a tu marca, zona por zona. No disparamos al azar: cada punto encaja con tu producto y tu cliente.</p></div>
      <div><div class="num">02</div><h3>Muestreamos</h3><p>Entregamos muestra en mano directo al comprador, con nota firmada y ubicación. La convicción la genera tu producto, no un discurso.</p></div>
      <div><div class="num">03</div><h3>Damos seguimiento</h3><p>¿Probó? ¿Le gustó? ¿Pidió precios? Empujamos cada cuenta hasta el pedido y te reportamos el avance real por tienda.</p></div>
      <div><div class="num">04</div><h3>Sostenemos</h3><p>Cerramos el primer pedido y luego cuidamos la rotación: conteo, resurtido y recompra. Abrir una tienda es fácil; que reordene es el negocio.</p></div>
    </div>
  </div>
</section>

<section class="showcase" id="enaccion">
  <div class="wrap">
    <span class="kick">Velo en acción</span>
    <h2>No te lo prometemos.<br>Te lo <em>enseñamos</em>.</h2>
    <p class="lead">Así trabajamos tu marca en la calle: cada cuenta en su etapa, la ruta en vivo y cada muestra entregada con firma. Transparencia total sobre lo que pagas.</p>
    <div class="scn">
      <div class="cp rev"><span class="ey">Pipeline en vivo</span><h3>Cada cuenta,<br>en su etapa.</h3><p>Mira en qué va cada punto de venta (contactado, con muestra, en negociación, cuenta abierta) con un link en vivo, solo tuyo. Sin reportes maquillados a fin de mes.</p><ul><li>Tablero por etapas, actualizado al momento</li><li>Nota y próximo paso por cuenta</li><li>Tu propio link, solo tus cuentas</li></ul></div>
      <div class="fw"><div class="frame"><img src="/screenshots/pipeline-d.webp" alt="Pipeline en vivo del CRM" loading="lazy"></div></div>
    </div>
    <div class="scn flip e">
      <div class="cp rev"><span class="ey">Ruta en tiempo real</span><h3>La ruta<br>de tus muestras.</h3><p>Un mapa con las paradas del día y cada entrega marcándose sola conforme se firma. Ves por dónde anda tu producto sin tener que llamar a preguntar.</p><ul><li>Mapa con paradas en orden óptimo</li><li>Entregas en tiempo real</li><li>Piezas dejadas por tienda</li></ul></div>
      <div class="fw"><div class="frame"><img src="/screenshots/ruta-d.webp" alt="Ruta de muestreo en vivo" loading="lazy"></div></div>
    </div>
    <div class="scn">
      <div class="cp rev"><span class="ey">Recibos firmados</span><h3>Cada muestra,<br>firmada.</h3><p>Comprobante con folio, firma de quien recibió, fecha y ubicación verificada. La prueba real de cada visita, no la palabra de nadie.</p><ul><li>Firma, geolocalización y sello de tiempo</li><li>Folio por marca en cada entrega</li><li>Recibo compartible al instante</li></ul></div>
      <div class="fw"><div class="frame"><img src="/screenshots/comprobante-d.webp" alt="Recibo de entrega firmado" loading="lazy"></div></div>
    </div>
    <div class="phones">
      <img class="rev" src="/screenshots/pipeline-m.webp" alt="Pipeline en móvil" loading="lazy">
      <img class="rev" src="/screenshots/ruta-m.webp" alt="Ruta en móvil" loading="lazy">
      <img class="rev" src="/screenshots/comprobante-m.webp" alt="Recibo en móvil" loading="lazy">
    </div>
    <div class="phcap">Todo lo sigues en vivo desde tu teléfono</div>
  </div>
</section>

<section id="planes">
  <div class="wrap">
    <span class="kick">Inversión</span>
    <h2>Sin comisiones.<br>Sin letra chica.</h2>
    <p class="lead">Sube de nivel y sube cuánto te resolvemos. El primero abre tiendas; el último administra tu marca completa en la ciudad.</p>
    <div class="plans">
      <div class="plan">
        <div class="lvl">Nivel 1</div>
        <div class="name">Entrada</div>
        <div class="price">$4,000</div>
        <div class="per">MXN · mes · más IVA</div>
        <div class="vol"><b>16</b> tiendas al mes · 4 por semana</div>
        <ul>
          <li class="base">Mapeo y filtrado del universo de tiendas</li>
          <li class="base">Prospección e identificación del comprador</li>
          <li class="base">Entrega física con nota firmada</li>
          <li class="base">Catálogo digital por tienda</li>
          <li class="base">Seguimiento hasta la orden de compra</li>
          <li class="base">Pipeline en vivo, 24/7</li>
        </ul>
        <a href="${DEMO}" class="btn btn-s">Reservar demo</a>
      </div>
      <div class="plan star">
        <span class="tag l">El estándar</span>
        <div class="lvl">Nivel 2</div>
        <div class="name">Ruta</div>
        <div class="price">$5,500</div>
        <div class="per">MXN · mes · más IVA</div>
        <div class="vol"><b>20</b> tiendas al mes · 5 por semana</div>
        <ul>
          <li class="base">Todo lo de Entrada</li>
          <li><strong>2 aperturas garantizadas al mes</strong></li>
          <li><strong>Gestión de las cuentas ya abiertas</strong></li>
          <li>Corte quincenal de consignación</li>
          <li>Seguimiento de resurtido</li>
          <li>Apoyo en cobranza ante la tienda</li>
          <li>Reporte de rotación por producto</li>
          <li>Reunión quincenal</li>
        </ul>
        <a href="${DEMO}" class="btn btn-p">Reservar demo</a>
      </div>
      <div class="plan top">
        <span class="tag e">Uno por categoría</span>
        <div class="lvl">Nivel 3</div>
        <div class="name">Exclusiva</div>
        <div class="price">$8,500</div>
        <div class="per">MXN · mes · más IVA</div>
        <div class="vol"><b>30</b> tiendas al mes · 7 por semana</div>
        <ul>
          <li class="base">Todo lo de Ruta</li>
          <li><strong>Exclusividad total de tu categoría</strong></li>
          <li>Tu marca se presenta primero en cada tienda</li>
          <li>Prioridad de ruta en cada salida</li>
          <li>1 activación en punto de venta al mes</li>
          <li>Inteligencia de anaquel de tu categoría</li>
          <li>Reunión semanal</li>
        </ul>
        <a href="${DEMO}" class="btn btn-s">Consultar disponibilidad</a>
      </div>
    </div>
    <div class="dots" aria-label="Planes"></div>
    <p style="text-align:center;margin:10px auto 0;max-width:620px;font-size:15px;color:var(--ash)">Tu plan es <strong>una sola tarifa fija al mes</strong>, sin comisiones sobre tus ventas. Lo de abajo es <strong>opcional</strong>, solo si lo pides.</p>
    <div class="extras">
      <div class="h"><span>Opcionales · aparte de tu plan</span><span>Precio</span></div>
      <div class="r"><span>Comisión por cada punto de venta que cerramos de más</span><span>$500 c/u</span></div>
      <div class="r"><span>Activación en punto de venta · fin de semana</span><span>$2,500 por evento</span></div>
      <div class="r"><span>Modo remoto · ciudad sin ruta física</span><span>-$2,000 sobre el nivel</span></div>
    </div>
    <div class="note">
      <p><strong>Sobre la exclusividad.</strong> Por categoría solo existe un lugar. Si tu competencia lo toma, entra a las mismas tiendas por el mismo mostrador que tú, y ese lugar no se libera durante la vigencia del contrato. Pregúntanos si tu categoría sigue abierta.</p>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <span class="kick">El retorno</span>
    <h2>Dos tiendas que recompran<br>y el servicio <em>se paga solo</em>.</h2>
    <p class="lead">Basta con que un par de tiendas empiecen a pedirte de forma recurrente para que el margen de esas cuentas cubra el costo del mes. De ahí en adelante, cada punto nuevo es crecimiento neto.</p>
    <div class="roi">
      <div><div class="big">2</div><div class="sm">tiendas que te<br>recompran cada mes</div></div>
      <div class="arrow">&#8594;</div>
      <div><div class="big">$5,500</div><div class="sm">+ IVA · el costo<br>mensual del servicio</div></div>
      <div class="arrow">&#8594;</div>
      <div><div class="big" style="color:var(--ember)">Neto</div><div class="sm">todo lo que<br>sigue sumando</div></div>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="crm-cross">
      <div>
        <span class="kick" style="margin-bottom:10px">¿Prefieres hacerlo tú?</span>
        <h3>La misma herramienta, en tus manos.</h3>
        <p style="margin-top:8px;max-width:54ch">Si quieres operar tu propia prospección, el CRM de Suuplai te da la base de miles de contactos y todo lo que ves aquí desde $1,000 al mes.</p>
      </div>
      <a href="/crm" class="btn btn-s">Conocer el CRM &#8594;</a>
    </div>
  </div>
</section>

<section id="dudas">
  <div class="wrap">
    <span class="kick">Dudas frecuentes</span>
    <h2>Lo que <em>siempre</em> nos preguntan</h2>
    <div class="faq">
      <div><h3>¿Son distribuidores?</h3><p>No. No compramos inventario ni nos quedamos con margen de tu producto. Somos tu equipo de ventas externo: la orden de compra, la factura y la entrega son directo entre tú y la tienda.</p></div>
      <div><h3>¿Cobran comisión sobre lo que se venda?</h3><p>No. Una tarifa fija al mes y nada más. Cada peso que rota en tienda es tuyo.</p></div>
      <div><h3>¿Hay contrato forzoso?</h3><p>El compromiso es trimestral porque una cuenta tarda cerca de tres meses en madurar. Después de eso, cancelas cuando quieras avisando con un mes.</p></div>
      <div><h3>¿Qué pasa si no abren las tiendas prometidas?</h3><p>Las aperturas garantizadas están por escrito en el contrato. Si en un mes no se cumplen, el siguiente va sin costo.</p></div>
      <div><h3>¿Quién entrega el producto?</h3><p>Nosotros llevamos las muestras y el primer pedido en mano, con nota firmada, hora y ubicación. Los resurtidos los coordinamos contigo según tu logística.</p></div>
      <div><h3>¿Cómo sé qué está pasando?</h3><p>Tienes un tablero en vivo con link fijo: cada tienda, en qué va y cuál es el siguiente paso. Más reporte semanal de qué avanzó y qué está detenido.</p></div>
      <div><h3>Mi marca es nueva y no tiene ventas todavía. ¿Aplica?</h3><p>Sí, siempre que tengas producto listo para vender: etiquetado en regla, código de barras y capacidad de surtir. Si aún no llegas ahí, te decimos qué falta antes de cobrarte un peso.</p></div>
    </div>
  </div>
</section>

<section class="close">
  <div class="wrap">
    <h2>Tu marca ya está lista.<br>Falta <em>el anaquel</em>.</h2>
    <p class="lead">Reserva una demo de 20 minutos y te decimos en qué tiendas encaja tu producto, aunque no trabajes con nosotros.</p>
    <div class="btns">
      <a href="${DEMO}" class="btn btn-p">Reservar demo</a>
      <a href="#planes" class="btn btn-s">Ver planes</a>
    </div>
  </div>
</section>

<footer>
  <div class="wrap">
    <a href="#top" class="logo">suuplai.</a>
    <p>55 8549 6699 &middot; hola@suups.com.mx &middot; suuplai.com.mx</p>
    <p style="color:var(--ember)">Inteligencia comercial &middot; Retail B2B</p>
  </div>
</footer>
`

export function AgenteComercial() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }),
      { threshold: 0.16, rootMargin: '0px 0px -8% 0px' },
    )
    document.querySelectorAll('.ac .rev').forEach((el) => io.observe(el))

    const frames = Array.from(document.querySelectorAll<HTMLElement>('.ac .scn .frame'))
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

    // Carrusel de planes con bolitas (en móvil los planes se deslizan)
    const plans = document.querySelector<HTMLElement>('.ac .plans')
    const dotsWrap = document.querySelector<HTMLElement>('.ac .dots')
    let onPlans: (() => void) | null = null
    if (plans && dotsWrap) {
      dotsWrap.innerHTML = ''
      const cards = Array.from(plans.children) as HTMLElement[]
      cards.forEach((c, i) => {
        const b = document.createElement('button')
        b.type = 'button'
        b.setAttribute('aria-label', 'Plan ' + (i + 1))
        if (i === 0) b.className = 'on'
        b.addEventListener('click', () => plans.scrollTo({ left: c.offsetLeft - (plans.clientWidth - c.offsetWidth) / 2, behavior: 'smooth' }))
        dotsWrap.appendChild(b)
      })
      const dots = Array.from(dotsWrap.children) as HTMLElement[]
      let praf = 0
      onPlans = () => {
        if (praf) return
        praf = requestAnimationFrame(() => {
          praf = 0
          const cx = plans.scrollLeft + plans.clientWidth / 2
          let bi = 0, bd = Infinity
          cards.forEach((c, i) => { const cc = c.offsetLeft + c.offsetWidth / 2; const d = Math.abs(cc - cx); if (d < bd) { bd = d; bi = i } })
          dots.forEach((d, i) => d.classList.toggle('on', i === bi))
        })
      }
      plans.addEventListener('scroll', onPlans, { passive: true })
    }

    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (onPlans && plans) plans.removeEventListener('scroll', onPlans)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="ac">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div dangerouslySetInnerHTML={{ __html: BODY }} />
    </div>
  )
}
