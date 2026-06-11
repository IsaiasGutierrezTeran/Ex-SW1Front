export interface RepositorioDocumental {
  id: string;
  politicaId: string;
  nombre: string;
  bucketKey: string;
  totalArchivos: number;
  totalBytes: number;
  activo: boolean;
  fechaCreacion?: string;
}
