// Envía el registro al backend (Supabase vía /api/registro).
// Si el backend aún no está configurado o falla, NO rompe la experiencia:
// el registro ya se guarda también en localStorage como respaldo.
export async function saveRegistro(payload: Record<string, unknown>): Promise<void> {
  try {
    await fetch('/api/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    // silencioso a propósito, la UX no debe depender del backend
  }
}
