export type TipoCampo =
  | 'texto'
  | 'textarea'
  | 'numero'
  | 'fecha'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'archivo'
  | 'calculado'
  // ── Tipos adicionales ──
  | 'email'
  | 'telefono'
  | 'decimal'
  | 'hora'
  | 'fechahora'
  | 'url'
  | 'rango'
  | 'multiselect'
  | 'matriz';

export interface FormularioPlantilla {
  id: string;
  nodoId: string;
  nombre: string;
  camposPlantillaIds: string[];
  permiteAdjuntos: boolean;
  permiteDictadoVoz: boolean;
}

export interface FormularioPlantillaRequest {
  nombre: string;
  permiteAdjuntos: boolean;
  permiteDictadoVoz: boolean;
}

export interface CampoPlantilla {
  id: string;
  formularioPlantillaId: string;
  nombre: string;
  etiqueta: string;
  tipo: TipoCampo;
  obligatorio: boolean;
  opciones?: string[];
  validacionRegex?: string;
  formula?: string;
  orden: number;
}

export interface CampoPlantillaRequest {
  nombre: string;
  etiqueta: string;
  tipo: TipoCampo;
  obligatorio: boolean;
  opciones?: string[];
  validacionRegex?: string;
  formula?: string;
  orden: number;
}

export const TIPOS_CAMPO: { value: TipoCampo; label: string; necesitaOpciones: boolean }[] = [
  { value: 'texto', label: 'Texto corto', necesitaOpciones: false },
  { value: 'textarea', label: 'Texto largo', necesitaOpciones: false },
  { value: 'numero', label: 'Número', necesitaOpciones: false },
  { value: 'fecha', label: 'Fecha', necesitaOpciones: false },
  { value: 'select', label: 'Lista desplegable', necesitaOpciones: true },
  { value: 'radio', label: 'Opción única (radio)', necesitaOpciones: true },
  { value: 'checkbox', label: 'Casilla (check)', necesitaOpciones: false },
  { value: 'archivo', label: 'Adjunto', necesitaOpciones: false },
  { value: 'calculado', label: 'Calculado (fórmula)', necesitaOpciones: false },
  { value: 'email', label: 'Correo electrónico', necesitaOpciones: false },
  { value: 'telefono', label: 'Teléfono', necesitaOpciones: false },
  { value: 'decimal', label: 'Decimal / Moneda', necesitaOpciones: false },
  { value: 'hora', label: 'Hora', necesitaOpciones: false },
  { value: 'fechahora', label: 'Fecha y hora', necesitaOpciones: false },
  { value: 'url', label: 'Enlace (URL)', necesitaOpciones: false },
  { value: 'rango', label: 'Rango (deslizador)', necesitaOpciones: false },
  { value: 'multiselect', label: 'Selección múltiple', necesitaOpciones: true },
  { value: 'matriz', label: 'Matriz / Tabla', necesitaOpciones: true },
];
