export interface VersionDocumento {
  versionId: string;
  numeroVersion: number;
  autorId: string;
  coautores?: string[];
  comentarioCambio?: string;
  tamanoBytes: number;
  mimeType: string | null;
  hashSha256?: string;
  fechaCreacion: string;
  esActual: boolean;
}
