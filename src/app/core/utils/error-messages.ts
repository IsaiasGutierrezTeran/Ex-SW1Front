import { HttpErrorResponse } from '@angular/common/http';

interface ApiErrorBody {
  message?: string;
  error?: string;
  details?: string[];
}

function extraerMensajeBackend(err: HttpErrorResponse): string | undefined {
  const body: unknown = err.error;

  if (typeof body === 'string') {
    const texto = body.trim();
    return texto.length > 0 ? texto : undefined;
  }

  if (body !== null && typeof body === 'object') {
    const apiBody = body as ApiErrorBody;
    const candidato =
      apiBody.message ?? apiBody.error ?? apiBody.details?.[0];

    if (typeof candidato === 'string' && candidato.trim().length > 0) {
      return candidato.trim();
    }
  }

  return undefined;
}

export function mensajeAmigable(
  err: unknown,
  fallback = 'Ocurrió un error inesperado. Intenta de nuevo.',
): string {
  try {
    if (err instanceof HttpErrorResponse) {
      const mensajeBackend = extraerMensajeBackend(err);

      switch (err.status) {
        case 0:
          return 'Sin conexión con el servidor. Revisa tu red e intenta de nuevo.';
        case 401:
          return 'Tu sesión expiró. Inicia sesión de nuevo.';
        case 403:
          return 'No tienes permiso para esta acción.';
        case 404:
          return 'No se encontró el recurso solicitado.';
        case 413:
          return 'El archivo es demasiado grande.';
        case 400:
        case 409:
        case 422:
          return mensajeBackend ?? 'Datos inválidos. Revisa lo ingresado.';
        case 500:
        case 502:
        case 503:
        case 504:
          return 'El servidor no está disponible ahora. Intenta más tarde.';
        default:
          return mensajeBackend ?? fallback;
      }
    }

    if (err instanceof Error) {
      const mensaje = err.message?.trim();
      if (mensaje && mensaje.length > 0) {
        return mensaje;
      }
    }

    return fallback;
  } catch {
    return fallback;
  }
}
