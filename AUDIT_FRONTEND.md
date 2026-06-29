# Reporte de Auditoría — Frontend Suuplai
> Generado el 2026-05-13 sobre `c:\dev\slotty\frontend\slotty`

---

## A — Inventario de componentes y rutas

### Rutas en `app/`

| Ruta | Archivo | Funcional | Contenido |
|------|---------|-----------|-----------|
| `/` | [app/page.tsx](app/page.tsx) | ✅ Sí | Landing — todo real, algunos números marketing hardcodeados ("+40 puntos", "<14 días", "6 cadenas socias") |
| `/registro-tienda` | [app/registro-tienda/page.tsx](app/registro-tienda/page.tsx) | ⚠️ Funcional pero MOCK — guarda en `localStorage` y OTP es generado en browser | Real |
| `/registro-productor` | [app/registro-productor/page.tsx](app/registro-productor/page.tsx) | ⚠️ Funcional pero MOCK — `localStorage` | Real |
| `/terminos` | [app/terminos/page.tsx](app/terminos/page.tsx) | ✅ Sí | Estática, contenido real |
| `/privacidad` | [app/privacidad/page.tsx](app/privacidad/page.tsx) | ✅ Sí | Estática, contenido real |
| `/_not-found` | [app/not-found.tsx](app/not-found.tsx) | ✅ Sí | 404 personalizada con animación de colores y CTAs (inicio + WhatsApp) |
| `/opengraph-image` | [app/opengraph-image.tsx](app/opengraph-image.tsx) | ✅ Sí | OG dinámica edge runtime, 1200×630 |
| `/icon.svg` | [app/icon.svg](app/icon.svg) | ✅ Sí | Favicon SVG estático |

Plus: [app/template.tsx](app/template.tsx) — wrapper de transición animada entre rutas.

### Componentes en `components/landing/` (17)

| Componente | Descripción |
|------------|-------------|
| [Nav.tsx](components/landing/Nav.tsx) | Nav fija con blur, links scroll, dropdown "Únete" desktop, hamburger mobile |
| [Hero.tsx](components/landing/Hero.tsx) | Hero con animación tipo "All of the Lights" word-by-word + carrusel de 12 stats en 4 cards |
| [CarruselTiendas.tsx](components/landing/CarruselTiendas.tsx) | Marquee infinito de logos de tiendas socias, lee de [lib/tiendas.ts](lib/tiendas.ts) |
| [MapaCDMX.tsx](components/landing/MapaCDMX.tsx) | Sección del mapa con filtros zona/categoría + lazy-load del Leaflet via IntersectionObserver |
| [MapaLeaflet.tsx](components/landing/MapaLeaflet.tsx) | Implementación Leaflet vanilla (7 puntos hardcodeados, tiles CartoDB Dark) |
| [MarqueeBanner.tsx](components/landing/MarqueeBanner.tsx) | Banner naranja con texto en loop |
| [PainPoints.tsx](components/landing/PainPoints.tsx) | 4 cards de pain points del retail tradicional |
| [AudienceSplit.tsx](components/landing/AudienceSplit.tsx) | Split tiendas/productores (desktop dos columnas, mobile tabs) |
| [SlotVisual.tsx](components/landing/SlotVisual.tsx) | Visualización del anaquel con 4 slots + count-up animado |
| [OnboardingRapido.tsx](components/landing/OnboardingRapido.tsx) | Timeline de 4 hitos (días 01/03/07/14) |
| [Calculator.tsx](components/landing/Calculator.tsx) | Calculadora interactiva con tabs tienda/productor + sliders |
| [Pricing.tsx](components/landing/Pricing.tsx) | Tabla comparativa cadena grande vs Suuplai (5 filas) |
| [HowItWorks.tsx](components/landing/HowItWorks.tsx) | 4 pasos con tabs tienda/productor + conector animado |
| [FAQ.tsx](components/landing/FAQ.tsx) | Acordeón de 7 preguntas |
| [Footer.tsx](components/landing/Footer.tsx) | Footer con logo, links, social (IG/LinkedIn), copyright |
| [WhatsAppFloat.tsx](components/landing/WhatsAppFloat.tsx) | Botón flotante WA con bounce a los 3s |
| [StickyMobileCTA.tsx](components/landing/StickyMobileCTA.tsx) | Bottom bar móvil con 2 CTAs (aparece después de 600px scroll) |

### Componentes en `components/registro/` (8)

| Componente | Descripción |
|------------|-------------|
| [NavRegistro.tsx](components/registro/NavRegistro.tsx) | Nav simple con logo + "Volver al inicio" |
| [HeroStripTienda.tsx](components/registro/HeroStripTienda.tsx) | Hero del registro de tienda + 4 stats |
| [HeroStripProductor.tsx](components/registro/HeroStripProductor.tsx) | Hero del registro de productor + 4 stats |
| [FormTienda.tsx](components/registro/FormTienda.tsx) | Form 3 pasos (882 líneas), genera PDF jsPDF, OTP mock |
| [FormProductor.tsx](components/registro/FormProductor.tsx) | Form waitlist (545 líneas) |
| [InfoSideTienda.tsx](components/registro/InfoSideTienda.tsx) | Cards laterales informativas (tienda) |
| [InfoSideProductor.tsx](components/registro/InfoSideProductor.tsx) | Cards laterales informativas (productor) |
| [CalendarEmbed.tsx](components/registro/CalendarEmbed.tsx) | Iframe de Google Calendar appointments |

### Componentes en `components/shared/` (1)
- [Logo.tsx](components/shared/Logo.tsx) — Logo reutilizable, 4 variantes (dark/light/mono-white/mono-black)

### Componentes huérfanos
**Ninguno.** Todos los componentes están importados en alguna página o en otro componente. Verificado contra `app/page.tsx`, `app/registro-*/page.tsx`, `app/not-found.tsx`.

### Archivos huérfanos
- ⚠️ [lib/utils.ts](lib/utils.ts) — exporta `cn()` (helper clsx+tailwind-merge) que **no se importa en ningún lado**.

---

## B — Formularios y captura de datos

### Total: 2 formularios.

### Form 1 — `FormTienda` ([components/registro/FormTienda.tsx](components/registro/FormTienda.tsx))

**3 pasos. 18 campos:**

| Campo | Tipo | Required |
|-------|------|----------|
| nombre, apellido | text | ✅ |
| email | email | ✅ |
| whatsapp | tel | ✅ |
| nombreTienda | text | ✅ |
| tipoTienda | select (10 opciones) | ✅ |
| colonia, alcaldia | text | ✅ |
| metrosLineales, trafico, tipoEspacio, categorias | select (rangos) | ❌ |
| notas | textarea | ❌ |
| tipoPersona | select (Física/Moral) | ✅ |
| razonSocial | text | ✅ |
| rfc | text (max 13) | ❌ |
| direccionFiscal | text | ❌ |
| aceptaComision, aceptaTerminos | checkbox | ✅ |
| OTP (6 dígitos) | text numérico | ✅ |

**Validaciones implementadas:**
- HTML5 `required` + `type="email"`/`tel"` (validación nativa del browser)
- Step 1 valida 8 campos requeridos antes de avanzar
- Step 2 valida 4 campos requeridos
- OTP valida exactamente 6 dígitos numéricos (regex `\D` strip)
- ❌ NO hay validación custom de formato email, RFC mexicano, ni teléfono mexicano

**Destino de la data:**
- `localStorage.setItem('suuplai_registros', ...)` — [FormTienda.tsx:376-380](components/registro/FormTienda.tsx#L376-L380)
- PDF generado en cliente con `jsPDF` (carta de intención)
- ❌ NO hay `fetch` a backend

**Loading/error/success:**
- ✅ State machine: `'idle' | 'loading' | 'success' | 'error'` con `SubmitState`
- ✅ Banner de error con `AlertCircle` + botón "Reintentar"
- ✅ Spinner `Loader2` en el botón mientras carga
- ✅ Botón cambia a verde con `Check` en éxito
- ✅ Pantalla de éxito con confirmación
- ✅ `aria-busy` y `role="alert"` para accesibilidad

**OTP — INSEGURO (modo demo):**
- Generado en browser con `Math.random()` ([FormTienda.tsx:348-358](components/registro/FormTienda.tsx#L348-L358))
- El código se muestra en pantalla en un banner amarillo "Demo: El código es 123456"

### Form 2 — `FormProductor` ([components/registro/FormProductor.tsx](components/registro/FormProductor.tsx))

**Una sola página. 13 campos:**

| Campo | Tipo | Required |
|-------|------|----------|
| nombre, apellido, email, whatsapp | text/email/tel | ✅ |
| nombreMarca | text | ✅ |
| categoria | select (10 opciones) | ✅ |
| skus, ticket | select (rangos) | ❌ |
| canalesVenta | array multi-select (6 toggles) | ❌ |
| frustracion, numTiendas, zona | select | ❌ |
| descripcion | textarea | ✅ |
| instagram | url | ❌ |

**Validaciones:**
- HTML5 `required` + `type` validation
- ❌ Sin validación custom

**Destino:**
- `localStorage.setItem('suuplai_registros', ...)` — [FormProductor.tsx:139-143](components/registro/FormProductor.tsx#L139-L143)

**Loading/error/success:** ✅ Mismo patrón que FormTienda (state machine completo).

### Variables de entorno declaradas
- ✅ `NEXT_PUBLIC_SITE_URL` — declarada en [app/layout.tsx:26](app/layout.tsx#L26) con fallback a `https://suuplai.com`
- ❌ **NO existe `NEXT_PUBLIC_API_URL`** ni similar — el frontend no espera ningún backend todavía

---

## C — Integración con backend

| Item | Estado |
|------|--------|
| `fetch()`, `axios`, `useSWR`, `useQuery`, `useMutation` | ❌ **0 ocurrencias** en código de producción |
| Carpeta `app/api/` | ❌ No existe |
| Archivos `.env*` | ❌ No existe ninguno |

**URLs externas hardcodeadas (no son backend, son servicios externos):**

| URL | Dónde | Propósito |
|-----|-------|-----------|
| `https://wa.me/525585496699?text=...` | [lib/constants.ts](lib/constants.ts) | WhatsApp de Santiago |
| `https://calendar.google.com/calendar/appointments/schedules/...` | [CalendarEmbed.tsx:9-10](components/registro/CalendarEmbed.tsx#L9-L10) | Iframe Google Calendar |
| `https://{s}.basemaps.cartocdn.com/dark_all/...` | [MapaLeaflet.tsx:71](components/landing/MapaLeaflet.tsx#L71) | Tiles del mapa |
| `https://unpkg.com/leaflet@1.9.4/dist/images/*` | [MapaLeaflet.tsx:54-56](components/landing/MapaLeaflet.tsx#L54-L56) | Iconos Leaflet |
| `https://instagram.com/suuplai`, `https://linkedin.com/company/suuplai` | [Footer.tsx](components/landing/Footer.tsx) | Social |

---

## D — Production-ready checklist

| Item | Estado | Notas |
|------|--------|-------|
| Metadata SEO en `app/layout.tsx` | ✅ | title, description, keywords, openGraph, twitter, metadataBase, lang="es" |
| `app/opengraph-image.tsx` | ✅ | Imagen OG dinámica 1200×630, edge runtime |
| Favicon | ✅ | `app/icon.svg` |
| `app/not-found.tsx` | ✅ | 404 personalizada con animación de colores |
| `npm run build` | ✅ | Build exitoso, 9 páginas estáticas, 0 errores |
| Warnings de build | ⚠️ 1 esperado | "Using edge runtime on a page currently disables static generation" — esperado para opengraph-image |
| `console.log` olvidados | ✅ | 0 en código de producción |
| `TODO`/`FIXME`/`HACK` | ✅ | 0 |
| "Lorem ipsum" / texto de prueba | ✅ | 0 |
| Componentes huérfanos | ✅ | 0 |
| Archivos huérfanos | ⚠️ | [lib/utils.ts](lib/utils.ts) exporta `cn()` y nadie lo importa |
| Imports sin usar | ✅ | Verificado en formularios — todos los lucide icons (`Loader2`, `Check`, `AlertCircle`) se usan |
| Dependencias muertas en `package.json` | ⚠️ **7** | Ver abajo |

**Dependencias instaladas pero NO importadas en ningún archivo:**
- `@emailjs/browser` (^4.3.3)
- `@radix-ui/react-accordion` (^1.2.0)
- `@radix-ui/react-select` (^2.1.1)
- `@radix-ui/react-slot` (^1.1.0)
- `@radix-ui/react-tabs` (^1.1.0)
- `class-variance-authority` (^0.7.0)
- `react-leaflet` (^4.2.1) — se usa Leaflet vanilla, no react-leaflet

**Indirectamente muertas** (solo usadas por `lib/utils.ts` huérfano):
- `clsx`, `tailwind-merge`

---

## E — Qué falta para conectar a un backend REST

Asumiendo endpoints `POST /api/registro-tienda`, `POST /api/registro-productor`, `GET /api/tiendas`:

### 1. Crear `.env.local` (nuevo)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 2. Crear `lib/api.ts` (nuevo)
Wrapper de `fetch` con `baseURL`, manejo de errores, tipos compartidos. Reemplazo natural ya que `lib/utils.ts` está huérfano.

### 3. [components/registro/FormTienda.tsx](components/registro/FormTienda.tsx)
- **Líneas 348-358 (`goToOTP` y `resendOTP`):** reemplazar `Math.random()` por `await fetch(`${API}/api/auth/otp/send`, { method: 'POST', body: { whatsapp } })`
- **Líneas 361-368 (`verifyOTP`):** reemplazar comparación local por `await fetch(`${API}/api/auth/otp/verify`, { method: 'POST', body: { whatsapp, codigo } })`
- **Líneas 376-380 (`submit`):** reemplazar `localStorage.setItem` por `await fetch(`${API}/api/registro-tienda`, { method: 'POST', body: form })`
- **Líneas 752-771:** quitar el banner que muestra el OTP en pantalla (ya llega por WhatsApp real)
- El error handling actual (`try/catch` + `setErrorMsg`) ya es compatible — no requiere refactor

### 4. [components/registro/FormProductor.tsx](components/registro/FormProductor.tsx)
- **Líneas 139-143 (`handleSubmit`):** reemplazar `localStorage.setItem` por `await fetch(`${API}/api/registro-productor`, { method: 'POST', body: form })`
- El error handling ya es compatible

### 5. [components/landing/MapaLeaflet.tsx](components/landing/MapaLeaflet.tsx)
- **Líneas 13-21:** reemplazar el array `mapPoints` hardcodeado por `useState([])` + `useEffect` que haga `await fetch(`${API}/api/tiendas`)`
- **Líneas 24-31:** el `ZONE_MAP` también debe venir del backend (cada tienda con su zona) o re-mapearse en el cliente desde la respuesta
- Loading state ya existe en `MapaCDMX.tsx` (`MapaPlaceholder`)
- Tipo de respuesta esperado: `{ id, name, slots, lat, lng, zona }[]`

### 6. [lib/tiendas.ts](lib/tiendas.ts) — opcional
Si el backend va a manejar el carrusel de tiendas socias del Hero/landing, mover el array a `useEffect` en [CarruselTiendas.tsx](components/landing/CarruselTiendas.tsx). Si es solo marketing, dejarlo hardcodeado.

### 7. [components/landing/Hero.tsx](components/landing/Hero.tsx) — opcional
- **Líneas 11-24 (`STATS`):** array de 12 stats hardcodeados ("+40 puntos", "6 cadenas: Alchef, Casa Bruna...", etc.). Si quieres datos vivos, hacer fetch a `/api/stats`. Como es contenido de marketing controlado, OK dejarlo hardcodeado.

### 8. NO requieren cambios
- [Calculator.tsx](components/landing/Calculator.tsx) — cálculo en tiempo real con sliders, sin backend
- [Pricing.tsx](components/landing/Pricing.tsx), [FAQ.tsx](components/landing/FAQ.tsx), [PainPoints.tsx](components/landing/PainPoints.tsx), [OnboardingRapido.tsx](components/landing/OnboardingRapido.tsx), [SlotVisual.tsx](components/landing/SlotVisual.tsx), [AudienceSplit.tsx](components/landing/AudienceSplit.tsx) — contenido de marketing estático
- [CalendarEmbed.tsx](components/registro/CalendarEmbed.tsx) — iframe de Google Calendar, no necesita backend
- Páginas legales, Nav, Footer, Logo

### 9. Limpieza recomendada (independiente del backend)
- Eliminar [lib/utils.ts](lib/utils.ts) huérfano
- Desinstalar 9 dependencias muertas:
  ```bash
  npm uninstall @emailjs/browser @radix-ui/react-accordion @radix-ui/react-select @radix-ui/react-slot @radix-ui/react-tabs class-variance-authority react-leaflet clsx tailwind-merge
  ```

---

**Confianza del reporte: 95/100.** Lo que sigue sin certeza absoluta: si el backend va a usar exactamente las rutas `/api/registro-tienda` o algo distinto (ej. `/api/v1/leads/tienda` como propuse en [BACKEND_SPEC.md](BACKEND_SPEC.md)), y si el equipo quiere mover los stats marketing a backend o mantenerlos hardcodeados.
