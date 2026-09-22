// Roles de contratación. Cada rol define el contexto, las dimensiones a medir,
// los datos rápidos y las preguntas fijas. La IA genera las personalizadas a
// partir del CV, cubriendo las dimensiones que no tocan las fijas.
import type { QuickField, Question } from './interview'

export type Dimension = { key: string; label: string; desc: string }
export type Role = {
  key: string
  name: string
  context: string
  objetivo: string
  dimensions: Dimension[]
  quick_fields: QuickField[]
  fixed_questions: Question[]
}

const QUICK_CAMPO: QuickField[] = [
  { key: 'disponibilidad', label: '¿Tienes disponibilidad entre semana (aunque sea algunas mañanas)?', type: 'select', options: ['Sí', 'Solo algunos días', 'No'], required: true, knockout: ['No'] },
  { key: 'mananas', label: '¿Tienes las mañanas libres entre semana?', type: 'select', options: ['Sí', 'A veces', 'No'], required: true },
  { key: 'formato', label: '¿Te late trabajar por días y en la calle, o buscas un horario fijo de oficina?', type: 'text', required: true },
  { key: 'inicio', label: '¿Cuándo podrías empezar?', type: 'text', required: true },
  { key: 'transporte', label: '¿Cómo te mueves normalmente por la ciudad?', type: 'text', required: true },
  { key: 'zona', label: '¿En qué zona vives? (colonia o alcaldía)', type: 'text' },
  { key: 'sueldo', label: '¿Cuánto esperas ganar? (por día o al mes)', type: 'text', required: true },
]

const FIJAS_CAMPO: Question[] = [
  { order: 1, maxSeconds: 90, text: 'Cuéntame de una vez que le echaste ganas a algo constante, aunque fuera repetitivo o te diera flojera. ¿Cómo le hiciste para no aflojar?', rubric: { '1': 'Vago, no da ejemplo', '2': 'Ejemplo aceptable', '3': 'Ejemplo concreto con constancia real' } },
  { order: 2, maxSeconds: 90, text: 'Cuéntame de una vez que trataste con alguien de malas o poco cooperativo. ¿Qué hiciste?', rubric: { '1': 'Se bloqueó o lo evitó', '2': 'Lo manejó bien', '3': 'Leyó a la persona y le dio la vuelta con tacto' } },
  { order: 3, maxSeconds: 90, text: 'Cuéntame de un lugar o situación que hayas observado bien: ¿qué detalles notaste que otros pasaron por alto, y cómo los contarías?', rubric: { '1': 'Genérico, no nota detalles', '2': 'Nota algo', '3': 'Observa fino y lo cuenta claro' } },
]

export const ROLES: Role[] = [
  {
    key: 'campo-operacion',
    name: 'Campo y operación',
    context: `Suuplai conecta marcas mexicanas de alimentos y bebidas con tiendas gourmet, delis, mercados orgánicos y cafeterías en CDMX. Equipo chico que va rápido. Buscamos a la cara en la calle, empezando por algunas mañanas a la semana, con espacio para crecer a operación, ventas o contenido según lo que le salga bien. Lo que hace: visita tiendas para entregar muestras y pedidos; revisa anaqueles (piezas, fotos, precio, acomodo, competencia); platica con encargados y dueños y cuenta lo que dicen; registra todo desde el celular. No importa qué estudió ni si tiene experiencia.`,
    objetivo: `Encontrar talento, NO descartar. Cada pregunta debe darle a la persona la oportunidad de mostrar algo bueno de sí misma. Queremos terminar con un perfil de fortalezas, no con un "sí o no".`,
    dimensions: [
      { key: 'constancia', label: 'Palabra y constancia', desc: 'Hace lo que dice, aunque le dé flojera.' },
      { key: 'trato', label: 'Trato con la gente', desc: 'No le da pena, conecta, lee a la otra persona.' },
      { key: 'resolver', label: 'Resolver sola', desc: 'Cuando algo sale mal, busca una salida sin esperar instrucciones.' },
      { key: 'aguante', label: 'Aguante', desc: 'Ante un "no", insiste con otra estrategia.' },
      { key: 'observacion', label: 'Observación y reporte', desc: 'Nota detalles y los cuenta con claridad.' },
      { key: 'iniciativa', label: 'Iniciativa', desc: 'Ve algo que se puede mejorar y lo hace sin que se lo pidan.' },
      { key: 'motor', label: 'Motor', desc: 'Qué la mueve: aprender, crecer, crear, dinero, estabilidad.' },
      { key: 'encaje', label: 'Encaje con el formato', desc: 'Si le late trabajar por días y en la calle, o busca un horario fijo de oficina.' },
    ],
    quick_fields: QUICK_CAMPO,
    fixed_questions: FIJAS_CAMPO,
  },
]

export function getRole(key: string | undefined | null): Role | undefined {
  return ROLES.find((r) => r.key === key)
}
export function defaultRole(): Role { return ROLES[0] }
export function rolesList(): { key: string; name: string }[] { return ROLES.map((r) => ({ key: r.key, name: r.name })) }
