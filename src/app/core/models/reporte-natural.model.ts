export interface ReporteNaturalRequest {
  consulta: string;
  formatoExport?: 'CSV' | 'XLSX' | 'JSON';
}

export interface ReporteNaturalResponse {
  reporteId: string;
  collection: string;
  filasMuestra: Record<string, unknown>[];
  totalFilas: number;
  urlDescarga?: string | null;
  formato: string;
  queryGenerada: string;
}
