export type SalidaActividad =
  | 'aprobar'
  | 'rechazar'
  | 'derivar'
  | 'observar'
  | 'completar';

export interface RequisitoDocumento {
  documentoId: string;
  proveedor: 'CLIENTE' | 'FUNCIONARIO';
  obligatorio: boolean;
}

export interface Actividad {
  id: string;
  nombre: string;
  descripcion: string;
  departamentoId: string;
  funcionarioResponsableId?: string;
  slaHoras: number;
  salidasPosibles: SalidaActividad[];
  reutilizable: boolean;
  documentoIds?: string[];
  documentosRequeridos?: RequisitoDocumento[];
  fechaCreacion?: string;
}

export interface ActividadRequest {
  nombre: string;
  descripcion: string;
  departamentoId: string;
  funcionarioResponsableId?: string;
  slaHoras: number;
  salidasPosibles: SalidaActividad[];
  reutilizable: boolean;
  documentoIds?: string[];
  documentosRequeridos?: RequisitoDocumento[];
}

export interface SalidaInfo {
  value: SalidaActividad;
  label: string;
  descripcion: string;
  icono: string;
  color: 'success' | 'danger' | 'info' | 'warning' | 'secondary';
}

export const SALIDAS_INFO: SalidaInfo[] = [
  {
    value: 'aprobar',
    label: 'Aprobar',
    descripcion: 'Finaliza el trámite con resultado positivo.',
    icono: '✔',
    color: 'success',
  },
  {
    value: 'rechazar',
    label: 'Rechazar',
    descripcion: 'Cierra el trámite definitivamente, no continúa.',
    icono: '✖',
    color: 'danger',
  },
  {
    value: 'observar',
    label: 'Observar / Devolver',
    descripcion: 'Devuelve al solicitante o paso previo para que corrija.',
    icono: '↺',
    color: 'warning',
  },
  {
    value: 'completar',
    label: 'Completar / Avanzar',
    descripcion: 'Marca la tarea como hecha y avanza al siguiente paso del flujo.',
    icono: '◉',
    color: 'secondary',
  },
];
