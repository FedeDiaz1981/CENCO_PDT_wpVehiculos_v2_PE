// Tipos de documento para mantener orden y evitar strings mágicos
export enum DocumentoKey {
  Thermoking = "thermoking",
  Sanipes = "sanipes",
  TarjetaPropiedad = "tarjetaPropiedad",
  Bonificacion = "bonificacion",
  Fumigacion = "fumigacion",
  RevisionTecnica = "revisionTecnica",
  LimpiezaDesinfeccion = "limpiezaDesinfeccion",
}

// Mapeo Temperatura -> TipoUnidad -> documentos visibles según matriz
const DOC_MATRIX: Record<
  "refrigerado" | "seco",
  Record<
    "camion" | "tracto" | "carreta",
    Record<DocumentoKey, boolean>
  >
> = {
  refrigerado: {
    camion: {
      [DocumentoKey.Thermoking]: true,
      [DocumentoKey.Sanipes]: true,
      [DocumentoKey.TarjetaPropiedad]: true,
      [DocumentoKey.Bonificacion]: false,
      [DocumentoKey.Fumigacion]: true,
      [DocumentoKey.RevisionTecnica]: true,
      [DocumentoKey.LimpiezaDesinfeccion]: true,
    },
    tracto: {
      [DocumentoKey.Thermoking]: false,
      [DocumentoKey.Sanipes]: false,
      [DocumentoKey.TarjetaPropiedad]: true,
      [DocumentoKey.Bonificacion]: false,
      [DocumentoKey.Fumigacion]: false,
      [DocumentoKey.RevisionTecnica]: true,
      [DocumentoKey.LimpiezaDesinfeccion]: false,
    },
    carreta: {
      [DocumentoKey.Thermoking]: true,
      [DocumentoKey.Sanipes]: true,
      [DocumentoKey.TarjetaPropiedad]: true,
      [DocumentoKey.Bonificacion]: true,
      [DocumentoKey.Fumigacion]: true,
      [DocumentoKey.RevisionTecnica]: true,
      [DocumentoKey.LimpiezaDesinfeccion]: true,
    },
  },
  seco: {
    camion: {
      [DocumentoKey.Thermoking]: false,
      [DocumentoKey.Sanipes]: false,
      [DocumentoKey.TarjetaPropiedad]: true,
      [DocumentoKey.Bonificacion]: false,
      [DocumentoKey.Fumigacion]: true,
      [DocumentoKey.RevisionTecnica]: true,
      [DocumentoKey.LimpiezaDesinfeccion]: true,
    },
    tracto: {
      [DocumentoKey.Thermoking]: false,
      [DocumentoKey.Sanipes]: false,
      [DocumentoKey.TarjetaPropiedad]: true,
      [DocumentoKey.Bonificacion]: false,
      [DocumentoKey.Fumigacion]: false,
      [DocumentoKey.RevisionTecnica]: true,
      [DocumentoKey.LimpiezaDesinfeccion]: false,
    },
    carreta: {
      [DocumentoKey.Thermoking]: false,
      [DocumentoKey.Sanipes]: false,
      [DocumentoKey.TarjetaPropiedad]: true,
      [DocumentoKey.Bonificacion]: true,
      [DocumentoKey.Fumigacion]: true,
      [DocumentoKey.RevisionTecnica]: true,
      [DocumentoKey.LimpiezaDesinfeccion]: true,
    },
  },
};

// Cómo se van a mostrar en UI
const DOC_LABELS: Record<DocumentoKey, string> = {
  [DocumentoKey.Thermoking]: "Certif. Mantenimiento Thermoking",
  [DocumentoKey.Sanipes]: "Certificado SANIPES",
  [DocumentoKey.TarjetaPropiedad]: "Tarjeta de propiedad",
  [DocumentoKey.Bonificacion]: "Bonificación",
  [DocumentoKey.Fumigacion]: "Certificado de fumigación",
  [DocumentoKey.RevisionTecnica]: "Revisión técnica",
  [DocumentoKey.LimpiezaDesinfeccion]: "Certificado de Limpieza y Desinfección",
};

// Función que decide qué documentos pedir
export function getDocumentosVisibles(vehiculo: {
  TipoTemperatura?: string; // "REFRIGERADO" | "SECO"
  TipoUnidad?: string;      // "Camion" | "Tracto" | "Carreta"
  Bonificacion?: boolean;
}) {
  // normalizamos por las dudas
  const tempKey =
    (vehiculo.TipoTemperatura || "").trim().toLowerCase() === "refrigerado"
      ? "refrigerado"
      : "seco";

  const unidadKey = (vehiculo.TipoUnidad || "").trim().toLowerCase();
  // fallback defensivo si no eligieron aún la unidad
  const unidadValida: "camion" | "tracto" | "carreta" =
    unidadKey === "tracto" || unidadKey === "carreta" ? unidadKey : "camion";

  const baseFlags = DOC_MATRIX[tempKey][unidadValida];

  // Regla especial Bonificación:
  // si la matriz dice true pero el camión NO está marcado con bonificación => ocultar
  const bonificacionVisible =
    baseFlags[DocumentoKey.Bonificacion] && vehiculo.Bonificacion === true;

  return {
    [DocumentoKey.Thermoking]: baseFlags[DocumentoKey.Thermoking],
    [DocumentoKey.Sanipes]: baseFlags[DocumentoKey.Sanipes],
    [DocumentoKey.TarjetaPropiedad]: true, // siempre pedir
    [DocumentoKey.Bonificacion]: bonificacionVisible,
    [DocumentoKey.Fumigacion]: baseFlags[DocumentoKey.Fumigacion],
    [DocumentoKey.RevisionTecnica]: true, // siempre pedir
    [DocumentoKey.LimpiezaDesinfeccion]:
      baseFlags[DocumentoKey.LimpiezaDesinfeccion],
  };
}

// Pequeño helper para mapear a algo que puedas renderizar en JSX
export function buildDocsList(vehiculo: any) {
  const visibles = getDocumentosVisibles(vehiculo);

  return (Object.keys(visibles) as DocumentoKey[])
    .filter((key) => visibles[key])
    .map((key) => ({
      key,
      label: DOC_LABELS[key],
    }));
}
