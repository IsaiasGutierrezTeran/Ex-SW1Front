export interface TramiteResumen {
  id: string;
  codigo: string;
  politicaId: string;
  politicaNombre?: string;
  clienteId: string;
  clienteNombre?: string;
  estado: string;
  prioridad: number;
  progreso: number;
  fechaInicio: string;
  fechaLimite?: string;
  nodoActualId?: string;
  nodoActualNombre?: string;
}

export interface OpcionDecision {
  valor: string;
  etiqueta: string;
  destinoNombre?: string;
}

export interface DecisionSiguiente {
  nodoId: string;
  pregunta: string;
  opciones: OpcionDecision[];
}

export interface TramiteDetalle extends TramiteResumen {
  historial: HistorialNodo[];
  nodoActual?: NodoEstado;
  decisionSiguiente?: DecisionSiguiente;
}

export interface NodoEstado {
  nodoId: string;
  nombre: string;
  tipo: string;
  departamentoId?: string;
  actividadId?: string;
  estado: string;
  funcionarioId?: string;
  fechaInicio?: string;
  salidasPosibles?: string[];
}

export interface HistorialNodo {
  nodoId: string;
  nombre: string;
  estado: string;
  funcionarioId?: string;
  fechaCompletado?: string;
  resultado?: string;
  observaciones?: string;
}

export interface CompletarNodoRequest {
  funcionarioId?: string;
  decision?: string;
  notas?: string;
}
