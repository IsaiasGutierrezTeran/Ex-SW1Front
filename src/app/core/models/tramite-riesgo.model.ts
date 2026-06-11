export type NivelRiesgo = 'bajo' | 'medio' | 'alto' | 'desconocido';

export interface TramiteRiesgo {
  tramiteId: string;
  probSuperarSla: number;
  nivel: NivelRiesgo;
  razones: string[];
}

export interface RutaOptima {
  rutaSugerida: string[];
  pasosOmitidos: { nodoId: string; motivo: string }[];
  confianza: number;
  explicacion?: string;
}
