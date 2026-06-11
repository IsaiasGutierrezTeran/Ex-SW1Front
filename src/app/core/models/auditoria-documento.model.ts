export type AccionAuditoria =
  | 'LECTURA'
  | 'DESCARGA'
  | 'SUBIDA'
  | 'NUEVA_VERSION'
  | 'EDICION_EN_VIVO'
  | 'EDICION_GUARDADA'
  | 'BLOQUEO'
  | 'DESBLOQUEO'
  | 'BORRADO';

export const ACCIONES: AccionAuditoria[] = [
  'LECTURA',
  'DESCARGA',
  'SUBIDA',
  'NUEVA_VERSION',
  'EDICION_EN_VIVO',
  'EDICION_GUARDADA',
  'BLOQUEO',
  'DESBLOQUEO',
  'BORRADO',
];

export interface AuditoriaItem {
  id: string;
  documentoArchivoId: string;
  versionId?: string | null;
  usuarioId: string;
  usuarioNombre?: string | null;
  rol?: string | null;
  accion: AccionAuditoria | string;
  ip?: string | null;
  userAgent?: string | null;
  timestamp: string;
  detalle?: Record<string, unknown> | null;
}

export interface PageAuditoria {
  content: AuditoriaItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first?: boolean;
  last?: boolean;
}
