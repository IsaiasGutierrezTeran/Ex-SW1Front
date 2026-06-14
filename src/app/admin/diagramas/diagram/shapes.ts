import type { Graph } from '@antv/x6';

/* Paleta UML 2.5 — identidad corporativa esmeralda + teal.
   Nodos con superficie clara, acento de color por tipo, sombra suave y
   tipografía clara para una lectura "premium" del diagrama de actividades. */
const COLORS = {
  // Actividad: tarjeta clara con acento esmeralda
  brand:        '#ffffff',   // relleno de la tarjeta de actividad
  brandDark:    '#cbd5cf',   // borde de la tarjeta
  brandLane:    '#10b981',   // barra de acento lateral (esmeralda)
  text:         '#0c1a15',   // texto principal
  textSoft:     '#4d6158',   // texto secundario
  white:        '#ffffff',
  // Inicio: esmeralda "go"
  success:      '#10b981',
  successDark:  '#047857',
  // Decisión: ámbar suave
  warning:      '#fef3c7',
  warningDark:  '#d97706',
  warningInk:   '#7c4a03',
  // Fin / barras fork-join: teal profundo
  ink:          '#0f766e',
  inkDeep:      '#064e3b',
  // Conectores
  edge:         '#5b7065',
  border:       '#cbd5cf',
};


let registered = false;

export function registerCreShapes(graph: typeof Graph): void {
  if (registered) return;
  registered = true;

  graph.registerNode(
    'cre-inicio',
    {
      inherit: 'circle',
      width: 60,
      height: 60,
      attrs: {
        body: {
          fill: COLORS.success,
          stroke: COLORS.successDark,
          strokeWidth: 2.5,
          filter: 'drop-shadow(0 3px 6px rgba(4,120,87,0.30))',
          magnet: true,
        },
        label: {
          fill: COLORS.white,
          fontSize: 11,
          fontWeight: 700,
          fontFamily: 'Inter Variable, Inter, sans-serif',
          textWrap: { width: 50, height: 50, ellipsis: true, breakWord: true },
        },
      },
    },
    true,
  );

  graph.registerNode(
    'cre-fin',
    {
      width: 60,
      height: 60,
      markup: [
        { tagName: 'circle', selector: 'outer' },
        { tagName: 'circle', selector: 'inner' },
        { tagName: 'text', selector: 'label' },
      ],
      attrs: {
        outer: {
          r: 28,
          cx: 30,
          cy: 30,
          fill: COLORS.white,
          stroke: COLORS.inkDeep,
          strokeWidth: 2.5,
          filter: 'drop-shadow(0 3px 6px rgba(6,78,59,0.25))',
          magnet: true,
        },
        inner: {
          r: 19,
          cx: 30,
          cy: 30,
          fill: COLORS.inkDeep,
          stroke: COLORS.inkDeep,
        },
        label: {
          x: 30,
          y: 33,
          textAnchor: 'middle',
          fill: COLORS.white,
          fontSize: 10,
          fontWeight: 600,
          fontFamily: 'Inter Variable, Inter, sans-serif',
        },
      },
    },
    true,
  );

  graph.registerNode(
    'cre-actividad',
    {
      width: 180,
      height: 64,
      markup: [
        { tagName: 'rect', selector: 'body' },
        { tagName: 'rect', selector: 'lane' },
        { tagName: 'text', selector: 'label' },
        { tagName: 'text', selector: 'sublabel' },
      ],
      attrs: {
        body: {
          width: 180,
          height: 64,
          rx: 12,
          ry: 12,
          fill: COLORS.brand,
          stroke: COLORS.brandDark,
          strokeWidth: 1.5,
          filter: 'drop-shadow(0 4px 10px rgba(6,59,46,0.12))',
          magnet: true,
        },
        lane: {
          x: 0,
          y: 0,
          width: 6,
          height: 64,
          rx: 3,
          ry: 3,
          fill: COLORS.brandLane,
        },
        label: {
          x: 95,
          y: 28,
          textAnchor: 'middle',
          fill: COLORS.text,
          fontSize: 12,
          fontWeight: 700,
          fontFamily: 'Inter Variable, Inter, sans-serif',
          textWrap: { width: 150, height: 28, ellipsis: true, breakWord: true },
        },
        sublabel: {
          x: 95,
          y: 48,
          textAnchor: 'middle',
          fill: COLORS.textSoft,
          fontSize: 10,
          fontFamily: 'Inter Variable, Inter, sans-serif',
        },
      },
    },
    true,
  );

  graph.registerNode(
    'cre-decision',
    {
      inherit: 'polygon',
      width: 120,
      height: 90,
      attrs: {
        body: {
          refPoints: '0,0.5 0.5,0 1,0.5 0.5,1',
          fill: COLORS.warning,
          stroke: COLORS.warningDark,
          strokeWidth: 2,
          filter: 'drop-shadow(0 4px 8px rgba(217,119,6,0.18))',
          magnet: true,
        },
        label: {
          fill: COLORS.warningInk,
          fontSize: 11,
          fontWeight: 700,
          fontFamily: 'Inter Variable, Inter, sans-serif',
          textWrap: { width: 80, height: 50, ellipsis: true, breakWord: true },
        },
      },
    },
    true,
  );

  graph.registerNode(
    'cre-fork',
    {
      width: 140,
      height: 10,
      markup: [
        { tagName: 'rect', selector: 'body' },
        { tagName: 'text', selector: 'label' },
      ],
      attrs: {
        body: {
          width: 140,
          height: 10,
          rx: 5,
          ry: 5,
          fill: COLORS.ink,
          stroke: COLORS.ink,
          filter: 'drop-shadow(0 2px 4px rgba(15,118,110,0.30))',
          magnet: true,
        },
        label: {
          x: 70,
          y: -8,
          textAnchor: 'middle',
          fill: COLORS.text,
          fontSize: 10,
          fontWeight: 600,
          fontFamily: 'Inter Variable, Inter, sans-serif',
        },
      },
    },
    true,
  );

  graph.registerNode(
    'cre-join',
    {
      width: 140,
      height: 10,
      markup: [
        { tagName: 'rect', selector: 'body' },
        { tagName: 'text', selector: 'label' },
      ],
      attrs: {
        body: {
          width: 140,
          height: 10,
          rx: 5,
          ry: 5,
          fill: COLORS.ink,
          stroke: COLORS.ink,
          filter: 'drop-shadow(0 2px 4px rgba(15,118,110,0.30))',
          magnet: true,
        },
        label: {
          x: 70,
          y: 22,
          textAnchor: 'middle',
          fill: COLORS.text,
          fontSize: 10,
          fontWeight: 600,
          fontFamily: 'Inter Variable, Inter, sans-serif',
        },
      },
    },
    true,
  );

  graph.registerEdge(
    'cre-edge',
    {
      attrs: {
        line: {
          stroke: COLORS.edge,
          strokeWidth: 1.8,
          targetMarker: {
            name: 'block',
            width: 10,
            height: 8,
          },
        },
      },
      router: { name: 'orth' },
      connector: { name: 'rounded', args: { radius: 10 } },
      defaultLabel: {
        markup: [
          { tagName: 'rect', selector: 'body' },
          { tagName: 'text', selector: 'label' },
        ],
        attrs: {
          label: {
            fill: COLORS.text,
            fontSize: 11,
            fontWeight: 500,
            fontFamily: 'Inter Variable, Inter, sans-serif',
            textAnchor: 'middle',
            textVerticalAnchor: 'middle',
            pointerEvents: 'none',
          },
          body: {
            ref: 'label',
            fill: COLORS.white,
            stroke: COLORS.border,
            strokeWidth: 1,
            rx: 8,
            ry: 8,
            refWidth: '120%',
            refHeight: '140%',
            refX: '-10%',
            refY: '-20%',
          },
        },
      },
    },
    true,
  );
}

export function shapeFromTipo(tipo: string): string {
  switch (tipo) {
    case 'inicio': return 'cre-inicio';
    case 'fin': return 'cre-fin';
    case 'actividad': return 'cre-actividad';
    case 'decision': return 'cre-decision';
    case 'fork': return 'cre-fork';
    case 'join': return 'cre-join';
    default: return 'cre-actividad';
  }
}

export function defaultSize(tipo: string): { width: number; height: number } {
  switch (tipo) {
    case 'inicio': case 'fin': return { width: 60, height: 60 };
    case 'decision': return { width: 120, height: 90 };
    case 'fork': case 'join': return { width: 140, height: 10 };
    default: return { width: 180, height: 64 };
  }
}
