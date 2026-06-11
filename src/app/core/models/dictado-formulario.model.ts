export interface CampoSugerido {
  campo: string;
  valor: string;
  confianza: number;
}

export interface DictarFormularioResponse {
  transcripcionId: string;
  textoTranscrito: string;
  campos: CampoSugerido[];
}
