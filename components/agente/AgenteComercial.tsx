// Página pública de Agente Comercial (suuplai.com.mx/agente-comercial).
// Diseño autocontenido: CSS + markup inyectados, para reflejar exactamente el arte aprobado.
// Pricing por niveles (Entrada / Ruta / Exclusiva). Actualizado sep 2026.

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
.ac .logos{display:flex;flex-wrap:wrap;gap:12px;margin-top:20px;align-items:center}
.ac .logo-chip{background:#fff;border-radius:12px;padding:10px 16px;display:flex;align-items:center;justify-content:center;height:56px}
.ac .logo-chip img{max-height:34px;max-width:120px;width:auto;object-fit:contain;display:block}
.ac .logo-more{font-family:'Syne';font-weight:800;font-size:15px;color:var(--bone);border:1px dashed var(--line);border-radius:12px;padding:0 20px;height:56px;display:flex;align-items:center}
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
@media(max-width:760px){.ac nav .links{display:none}}
@media(max-width:640px){.ac section{padding:70px 0}.ac .hero{padding:72px 0 60px}.ac .proof>div{min-width:calc(50% - 7px)}.ac .roi .arrow{display:none}.ac .extras .r{flex-direction:column;gap:4px}}
`

const DEMO = 'https://calendar.app.google/LfAtSiFF7xAJ7YPx9'

const BODY = `
<nav>
  <div class="wrap">
    <a href="#top" class="logo">suuplai.</a>
    <div class="links">
      <a href="#como">Cómo funciona</a>
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
      <div class="logos">
        <span class="logo-chip"><img src="/marcas/looms.jpg" alt="Looms"></span>
        <span class="logo-chip"><img src="/marcas/capicua.jpg" alt="Capicúa"></span>
        <span class="logo-chip"><img src="/marcas/cachito.jpg" alt="Cachito"></span>
        <span class="logo-chip"><img src="/marcas/riise.jpg" alt="Riise"></span>
        <span class="logo-chip"><img src="/marcas/noodo.png" alt="Noodo"></span>
        <span class="logo-more">y muchas más</span>
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
          <li class="base"><strong>2 aperturas garantizadas al mes</strong></li>
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
    <div class="extras">
      <div class="h"><span>Extras fuera de paquete</span><span>Precio</span></div>
      <div class="r"><span>Comisión por cada punto de venta que cerramos de más (arriba de tu paquete)</span><span>$500 c/u</span></div>
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
  return (
    <div className="ac">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div dangerouslySetInnerHTML={{ __html: BODY }} />
    </div>
  )
}
