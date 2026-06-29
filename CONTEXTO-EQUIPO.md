# Suuplai — Estado actual de la landing

**Fecha:** 2026-05-11
**Para:** equipo Suuplai
**Versión del doc:** v2 (reemplaza v1 del 2026-05-11 temprano)

---

## 1. Qué es esto

Landing page de **Suuplai** — marketplace que conecta **tiendas independientes** (monetizan su espacio en tienda) con **marcas/productores** (que necesitan presencia física sin entrar a Walmart, Liverpool o Chedraui).

Dos audiencias diferenciadas por color:
- **Tiendas** → amarillo eléctrico `#E8FF47`
- **Marcas/productores** → naranja `#FF6B35`

---

## 2. Cómo ver la página

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000). Recarga automática al guardar.

**Build de producción:** `npm run build && npm run start`

> Si Claude vuelve a estar trabajando y necesitas `build`, primero detiene el dev server (`Ctrl+C`). Si corres ambos a la vez se pelean por el folder `.next/` y rompen el CSS.

---

## 3. Stack técnico

| Pieza | Tecnología |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Lenguaje | TypeScript (sin `any`) |
| Estilos | Tailwind CSS |
| Animaciones | Framer Motion 11 |
| Componentes base | shadcn/ui + Radix |
| Mapa | Leaflet (CDMX interactivo) |
| PDF | jsPDF (Carta de Intención de tienda) |
| Fuentes | Syne, DM Sans, Space Mono (Google) |

Sin backend propio aún — formularios guardan en `localStorage`. OTP simulado.

---

## 4. Identidad visual

### Paleta
- `#0A0A0F` — fondo principal
- `#13131A` — superficies / cards
- `#F0EFE8` — texto sobre fondos oscuros
- `#E8FF47` — acento **tiendas** (amarillo eléctrico)
- `#FF6B35` — acento **marcas** (naranja)
- `#F5C518` — "ai" del logo (amarillo dorado)

**Regla crítica:** amarillo solo para tiendas, naranja solo para marcas. Nunca cruzados.

### Tipografía
- **Syne Bold** — títulos, hero, headings
- **DM Sans Light/Medium** — cuerpo, UI
- **Space Mono** — métricas y números

### Logo nuevo — "Slot Mark"
- Isotipo: rectángulo redondeado con dos barras verticales adentro
  - Barra blanca = la tienda
  - Barra dorada = la marca que entra
- Wordmark: `suupl` blanco + `ai` en dorado `#F5C518`
- Componente: [components/shared/Logo.tsx](components/shared/Logo.tsx) con 4 variantes: `dark`, `light`, `mono-white`, `mono-black`
- Assets SVG en [public/logos/](public/logos/)
- Favicon: [app/icon.svg](app/icon.svg) (Next.js 14 lo detecta automáticamente)
- OG image dinámica para previews de redes: [app/opengraph-image.tsx](app/opengraph-image.tsx) — 1200×630, fondo `#0A0A0F`

> ⚠️ El brandbook PDF en `comp_files/` tiene el logo anterior (S con camión). El logo oficial vigente es el slot mark. Pendiente actualizar el brandbook con un diseñador.

---

## 5. Estructura de la home

Orden actual en [app/page.tsx](app/page.tsx):

| # | Sección | Componente | Resumen |
|---|---------|-----------|---------|
| 1 | Nav fijo | [Nav.tsx](components/landing/Nav.tsx) | Logo nuevo, links, dropdown "Únete" desktop, hamburger mobile (touch 44×44) |
| 2 | Hero | [Hero.tsx](components/landing/Hero.tsx) | Animación intro tipo "All of the Lights" (2.2s, paleta brand). Headline final: "Tu marca en tiendas físicas de CDMX. **En 14 días,** no en 6 meses." Subtítulo: "Renta espacio en tienda. **Pago mensual**, **sin meses de espera**." 4 stat cards rotando |
| 3 | Carrusel tiendas | [CarruselTiendas.tsx](components/landing/CarruselTiendas.tsx) | Logos de 6 tiendas socias en marquee infinito (40s loop). Headline: "+40 puntos de venta en CDMX y creciendo" |
| 4 | Mapa CDMX | [MapaCDMX.tsx](components/landing/MapaCDMX.tsx) | Mapa Leaflet con zonas activas (Condesa, Roma, Polanco, Coyoacán, Santa Fe, Narvarte, Doctores) + filtros |
| 5 | Marquee | [MarqueeBanner.tsx](components/landing/MarqueeBanner.tsx) | Banner naranja en loop con propuesta de valor |
| 6 | Pain Points | [PainPoints.tsx](components/landing/PainPoints.tsx) | 4 dolores del productor (plazos, factoraje, visibilidad, logística) |
| 7 | Audience Split | [AudienceSplit.tsx](components/landing/AudienceSplit.tsx) | Tienda vs productor: dos paneles desktop, tabs mobile, listas ANTES/DESPUÉS |
| 8 | Slot Visual | [SlotVisual.tsx](components/landing/SlotVisual.tsx) | Mockup de anaquel con 4 lugares. **Animado en scroll:** uno se llena con "TU MARCA AQUÍ" + counter de ingreso hace count-up de $0 a $2,000 MXN |
| 9 | Onboarding Rápido | [OnboardingRapido.tsx](components/landing/OnboardingRapido.tsx) | Timeline de 4 hitos (Día 01/03/07/14) con íconos Lucide |
| 10 | Calculadora | [Calculator.tsx](components/landing/Calculator.tsx) | Sliders interactivos tienda/productor. Calcula ingreso o ROI vs cadena grande |
| 11 | Pricing | [Pricing.tsx](components/landing/Pricing.tsx) | Tabla comparativa cadena tradicional vs Suuplai. Stack en mobile |
| 12 | Cómo funciona | [HowItWorks.tsx](components/landing/HowItWorks.tsx) | 4 pasos del proceso, tabs tienda/productor |
| 13 | FAQ | [FAQ.tsx](components/landing/FAQ.tsx) | Acordeón con 7 preguntas (rotación, daños, comisiones, contrato, etc.) |
| 14 | Footer | [Footer.tsx](components/landing/Footer.tsx) | Logo, links, redes, registros, legales |

### Floats globales (fuera del flujo)
- [WhatsAppFloat.tsx](components/landing/WhatsAppFloat.tsx) — botón verde fijo bottom-right. Bounce a los 3s. Link a `wa.me/525585496699` con mensaje precargado para Santiago
- [StickyMobileCTA.tsx](components/landing/StickyMobileCTA.tsx) — barra inferior mobile con dos CTAs (Tengo tienda / Tengo marca). Aparece > 600px de scroll. Slide-up animado

### Secciones eliminadas (de versiones previas)
- ~~ComandoCase~~ — eliminado, Comando Studios sigue presente como una más en el carrusel de tiendas
- ~~ManifestoCTA~~ — eliminado, FAQ es ahora la última sección antes del Footer
- ~~HeroSocialProof~~ — eliminado, los logos del carrusel ya cumplen ese rol arriba del fold

---

## 6. Páginas de registro

### `/registro-tienda` ([app/registro-tienda/page.tsx](app/registro-tienda/page.tsx))
- 3 pasos: contacto + tienda → fiscal + términos → OTP
- Genera **PDF de Carta de Intención** descargable (header con logo slot mark dibujado nativo en jsPDF)
- Muestra calendario de Google al completar
- Fondo claro, acento amarillo

### `/registro-productor` ([app/registro-productor/page.tsx](app/registro-productor/page.tsx))
- Formulario de una sola página
- Sin OTP ni PDF — guarda en `localStorage`
- Strip lateral con métricas comparativas
- Fondo oscuro, acento naranja

### Legales
- [/privacidad](app/privacidad/page.tsx)
- [/terminos](app/terminos/page.tsx)

---

## 7. Animaciones destacadas

| Sección | Qué hace |
|---------|----------|
| Hero headline | Flashes "All of the Lights" tipo Kanye West (2.2s, paleta brand, una sola vez al cargar) |
| Hero stats | 4 cards rotando entre 12 estadísticas, una sola al click en dots |
| Carrusel tiendas | Marquee infinito 40s, pausa al hover |
| MarqueeBanner | Loop infinito 20s |
| SlotVisual | Count-up $0 → $2,000 + slot fill animado al entrar al viewport |
| OnboardingRapido | Stagger reveal de los 4 hitos al scroll-in |
| WhatsApp button | Bounce sutil una vez a los 3s del page load |
| Sticky mobile CTA | Slide-up cuando scroll > 600px |

Todas respetan `prefers-reduced-motion` — saltan al estado final si el usuario tiene esa preferencia.

---

## 8. Stats reales (no proyecciones)

Lo que aparece en el Hero rotando:
- **+40** puntos de venta activos en CDMX y creciendo
- **<14 días** onboarding promedio
- **6** cadenas socias (Alchef, Casa Bruna, Moramora, SuperCope, Comando, Numu)
- **0%** comisión sobre ventas para la tienda
- **$2,000 MXN/mes** costo de entrada por marca
- **94%** menos costo vs Walmart/Liverpool/Chedraui
- **48h** para confirmar fit entre marca y tienda

---

## 9. Voz y tono

**Sí:** directo, números reales, empático, confiado, humano mexicano.
**No:** corporativo, "revolucionamos", "ecosistema", "sinergia", "el futuro es hoy".

Lenguaje crítico:
- "anaquel" → "espacio en tienda" / "presencia física"
- "slot" (en copy visible) → "espacio disponible" / "lugar"
- "slotting allowance" → "costo de entrada"

---

## 10. Estructura de archivos

```
app/
  layout.tsx               metadata SEO + fuentes + favicon auto
  page.tsx                 home (orden de las 14 secciones)
  icon.svg                 favicon (Next 14 lo detecta solo)
  opengraph-image.tsx      OG dinámica 1200x630 para redes
  registro-tienda/         3-paso + PDF
  registro-productor/      single-page
  privacidad/  terminos/   legales

components/
  landing/                 14 secciones + 2 floats
  registro/                forms + calendar embed + nav
  shared/Logo.tsx          4 variantes (dark/light/mono-white/mono-black)

lib/
  constants.ts             WHATSAPP_NUMBER, WHATSAPP_MESSAGE, WHATSAPP_URL
  utils.ts

public/
  logos/                   slot mark SVGs (5 variantes)
  logos-tiendas/           6 logos de tiendas socias

comp_files/
  suuplai-brandbook.pdf    brandbook (logo viejo — desactualizado)

.claude/CLAUDE.md          instrucciones de proyecto para Claude
```

---

## 11. Qué falta / próximos pasos

> Esta sección es para alineación, no está implementada.

- **Backend real** para los formularios (hoy `localStorage`)
- **Verificación OTP real** (hoy simulada en flujo tienda)
- **Email/CRM** para los leads de waitlist
- **Analytics** (sin tracking instalado)
- **Sitemap.xml + robots.txt + structured data** (SEO técnico)
- **Datos reales del mapa CDMX** — hoy son 7 zonas hardcoded con ~20 puntos. La narrativa dice "+40 puntos", la data necesita catch-up
- **Logo de Numu Market sin fondo naranja** si quieren consistencia visual con las otras cards blancas del carrusel
- **Brandbook actualizado** con el logo slot mark (hoy el PDF en `comp_files/` tiene el logo viejo S+camión)
- **Setear `NEXT_PUBLIC_SITE_URL=https://suuplai.com`** en producción para que la OG image resuelva URLs absolutas

---

## 12. Para el equipo de diseño

- Paleta + tipografía → [tailwind.config.ts](tailwind.config.ts)
- Logo nuevo y sus variantes → [public/logos/](public/logos/) + [components/shared/Logo.tsx](components/shared/Logo.tsx)
- Copy de cada sección → directo en [components/landing/](components/landing/)
- WhatsApp contact → [lib/constants.ts](lib/constants.ts)

Si encuentras inconsistencia entre lo que ves en el sitio y el brandbook PDF, **gana el sitio** (el brandbook todavía no está actualizado con el nuevo logo).
