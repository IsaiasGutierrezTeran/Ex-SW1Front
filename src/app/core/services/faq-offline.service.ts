import { Injectable } from '@angular/core';

/**
 * IA OFFLINE — Base de conocimiento local del asistente (web/PWA).
 *
 * Permite que el chatbot responda preguntas frecuentes SIN conexión (o con el
 * backend caído). Usa coincidencia difusa (distancia de Levenshtein) por lo que
 * tolera errores de tipeo: normaliza acentos, parte en palabras y compara cada
 * palabra del usuario contra las claves de cada entrada.
 */
interface Faq {
  claves: string[];
  respuesta: string;
}

@Injectable({ providedIn: 'root' })
export class FaqOfflineService {
  // Base editable / ampliable (espejo de la app móvil).
  private readonly base: Faq[] = [
    { claves: ['hola', 'buenas', 'saludos', 'hey', 'buenos', 'dias', 'tardes'],
      respuesta: 'Hola, soy tu asistente. Estoy en modo sin conexión, pero puedo ayudarte con dudas frecuentes sobre tus trámites. ¿Qué necesitas?' },
    { claves: ['gracias', 'agradecido', 'genial', 'perfecto'],
      respuesta: '¡Con gusto! Si necesitas algo más sobre tus trámites, aquí estoy.' },
    { claves: ['iniciar', 'crear', 'empezar', 'nuevo', 'tramite', 'solicitar', 'comenzar'],
      respuesta: 'Para iniciar un trámite ve a "Iniciar trámite", describe lo que necesitas (puedes dictarlo por voz) y la IA te sugiere la política correcta. Confirma y se crea el trámite.' },
    { claves: ['subir', 'adjuntar', 'cargar', 'documento', 'archivo', 'pdf', 'foto'],
      respuesta: 'Para subir un documento entra al trámite y usa "Subir documento". Puedes adjuntar imágenes o archivos (PDF, Word, Excel). En el expediente digital, los funcionarios también pueden crear y editar documentos Word/Excel en línea.' },
    { claves: ['estado', 'seguimiento', 'avance', 'progreso', 'donde', 'situacion'],
      respuesta: 'En "Mis trámites" ves el estado de cada uno: código, etapa actual y progreso. Abre un trámite para ver el detalle del flujo y los documentos.' },
    { claves: ['observado', 'observacion', 'rechazado', 'corregir', 'error'],
      respuesta: 'Un documento "Observado" significa que el funcionario pidió corregirlo. Revisa la observación y vuelve a subir el documento corregido para continuar.' },
    { claves: ['contrasena', 'clave', 'password', 'olvide', 'recuperar', 'restablecer'],
      respuesta: 'Si olvidaste tu contraseña usa "Recuperar contraseña" en el inicio de sesión. Recibirás un enlace temporal para crear una nueva.' },
    { claves: ['tarda', 'demora', 'tiempo', 'cuanto', 'plazo', 'dias'],
      respuesta: 'El tiempo depende de la política del trámite y de cada etapa. Puedes ver la etapa actual y el progreso en el detalle del trámite.' },
    { claves: ['voz', 'dictar', 'dictado', 'hablar', 'microfono', 'grabar'],
      respuesta: 'El dictado por voz te permite llenar el formulario hablando: graba, la IA transcribe y coloca los datos en los campos. Revisa y confirma antes de guardar.' },
    { claves: ['cerrar', 'salir', 'logout', 'sesion', 'desconectar'],
      respuesta: 'Para cerrar sesión usa el menú de tu perfil y "Cerrar sesión".' },
    { claves: ['offline', 'sin', 'conexion', 'internet', 'datos', 'red', 'pwa'],
      respuesta: 'La app web funciona como PWA: una vez que inicias sesión, puedes seguir consultando lo básico y conversar conmigo sin conexión. Cuando vuelva la red, se sincroniza.' },
    { claves: ['aprobar', 'aprobado', 'firmar', 'resolucion', 'finalizar'],
      respuesta: 'Cuando un trámite se aprueba, su estado cambia a "Aprobado" y puedes descargar la resolución desde el detalle del trámite.' },
    { claves: ['funcionario', 'revisa', 'quien', 'encargado', 'responsable'],
      respuesta: 'Cada etapa la atiende un funcionario del departamento correspondiente. En etapas paralelas pueden intervenir varios funcionarios a la vez.' },
    { claves: ['notificacion', 'aviso', 'alerta', 'mensaje'],
      respuesta: 'Recibes notificaciones cuando tu trámite avanza, requiere documentos o es observado. Míralas en la campana de notificaciones.' },
    { claves: ['formulario', 'campo', 'matriz', 'tabla', 'campos', 'llenar'],
      respuesta: 'Los formularios admiten muchos tipos de campo: texto, número, fecha, correo, teléfono, decimal, hora, enlace, rango, selección múltiple y matriz/tabla. Complétalos y guarda.' },
    { claves: ['documentos', 'requisitos', 'necesito', 'cuales', 'requeridos'],
      respuesta: 'Los documentos requeridos dependen de la política del trámite. Al iniciar o en cada etapa verás la lista de requisitos a adjuntar.' },
  ];

  private readonly sinRespuesta =
    'Estoy sin conexión y no tengo una respuesta exacta para eso. Intenta reformular tu pregunta, o vuelve a intentarlo cuando tengas internet para una respuesta más completa.';

  /** Devuelve la mejor respuesta local para la consulta. */
  responder(consulta: string): string {
    const tokens = this.tokens(consulta);
    if (!tokens.length) return this.sinRespuesta;

    let mejor: Faq | null = null;
    let mejorPuntaje = 0;
    for (const faq of this.base) {
      const p = this.puntaje(tokens, faq.claves);
      if (p > mejorPuntaje) {
        mejorPuntaje = p;
        mejor = faq;
      }
    }
    return mejor && mejorPuntaje >= 1.0 ? mejor.respuesta : this.sinRespuesta;
  }

  private puntaje(tokens: string[], claves: string[]): number {
    let total = 0;
    for (const t of tokens) {
      let mejor = 0;
      for (const c of claves) {
        const s = this.similitud(t, c);
        if (s > mejor) mejor = s;
      }
      if (mejor >= 0.8) total += mejor;
    }
    return total;
  }

  private tokens(texto: string): string[] {
    return this.sinAcentos(texto.toLowerCase())
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 3);
  }

  private sinAcentos(s: string): string {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ñ/g, 'n');
  }

  private similitud(a: string, b: string): number {
    if (a === b) return 1;
    const dist = this.levenshtein(a, b);
    const maxLen = Math.max(a.length, b.length);
    return maxLen === 0 ? 1 : 1 - dist / maxLen;
  }

  private levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    const cur = new Array<number>(n + 1).fill(0);
    for (let i = 1; i <= m; i++) {
      cur[0] = i;
      for (let j = 1; j <= n; j++) {
        const costo = a[i - 1] === b[j - 1] ? 0 : 1;
        cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + costo);
      }
      prev = [...cur];
    }
    return prev[n];
  }
}
