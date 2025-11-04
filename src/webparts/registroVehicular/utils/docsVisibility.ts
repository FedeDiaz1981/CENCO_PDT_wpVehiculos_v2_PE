// utils/docsVisibility.ts

export type VehiculoState = {
  Temperatura?: string;       // "Seco" | "Con temperatura"
  TipoUnidad?: string;        // "Camión" | "Tracto" | "Carreta"
  Bonificacion?: boolean;     // checkbox en DatosVehiculo
};

// Estas keys representan cada bloque de DocumentacionLite
export type DocsFlags = {
  showTermoking: boolean;
  showSanipes: boolean;
  showTarjetaPropiedad: boolean;      // (si tu UI la muestra siempre, igual true)
  showResBonificacion: boolean;
  showFumigacion: boolean;
  showRevisionTecnica: boolean;       // siempre true
  showLimpieza: boolean;
};

// Matriz según combinación Temperatura / TipoUnidad.
// Ojo: acá usamos "con temperatura" ~ refrigerado en tu Excel.
//      "seco" ~ seco en tu Excel.
const MATRIX: Record<
  "con temperatura" | "seco",
  Record<
    "camión" | "tracto" | "carreta",
    {
      termoking: boolean;
      sanipes: boolean;
      tarjetaPropiedad: boolean;
      bonificacion: boolean;
      fumigacion: boolean;
      revisionTecnica: boolean;
      limpieza: boolean;
    }
  >
> = {
  "con temperatura": {
    "camión": {
      termoking: true,
      sanipes: true,
      tarjetaPropiedad: true,
      bonificacion: false,
      fumigacion: true,
      revisionTecnica: true,
      limpieza: true,
    },
    "tracto": {
      termoking: false,
      sanipes: false,
      tarjetaPropiedad: true,
      bonificacion: false,
      fumigacion: false,
      revisionTecnica: true,
      limpieza: false,
    },
    "carreta": {
      termoking: true,
      sanipes: true,
      tarjetaPropiedad: true,
      bonificacion: true,
      fumigacion: true,
      revisionTecnica: true,
      limpieza: true,
    },
  },
  "seco": {
    "camión": {
      termoking: false,
      sanipes: false,
      tarjetaPropiedad: true,
      bonificacion: false,
      fumigacion: true,
      revisionTecnica: true,
      limpieza: true,
    },
    "tracto": {
      termoking: false,
      sanipes: false,
      tarjetaPropiedad: true,
      bonificacion: false,
      fumigacion: false,
      revisionTecnica: true,
      limpieza: false,
    },
    "carreta": {
      termoking: false,
      sanipes: false,
      tarjetaPropiedad: true,
      bonificacion: true,
      fumigacion: true,
      revisionTecnica: true,
      limpieza: true,
    },
  },
};

// Esta función aplica:
//  - normaliza strings ("Camión" -> "camión", etc.)
//  - aplica la regla especial de Bonificación
//  - fuerza TarjetaPropiedad y RevisionTecnica a true siempre
export function getDocumentosVisibles(vehiculo: VehiculoState): DocsFlags {
  // normalizamos temperatura a "con temperatura" | "seco"
  const tempRaw = (vehiculo.Temperatura || "").trim().toLowerCase();
  const tempKey: "con temperatura" | "seco" =
    tempRaw === "con temperatura" ? "con temperatura" : "seco";

  // normalizamos tipo de unidad a "camión" | "tracto" | "carreta"
  const unidadRaw = (vehiculo.TipoUnidad || "").trim().toLowerCase();
  let unidadKey: "camión" | "tracto" | "carreta" = "camión";
  if (unidadRaw === "tracto") unidadKey = "tracto";
  if (unidadRaw === "carreta") unidadKey = "carreta";

  const base = MATRIX[tempKey][unidadKey];

  // regla especial bonificación:
  // - la matriz dice si aplica bonificación en esa combinación
  // - PERO además el checkbox Bonificacion del vehículo tiene que estar en true
  const bonifVisible = base.bonificacion && vehiculo.Bonificacion === true;

  return {
    showTermoking: base.termoking,
    showSanipes: base.sanipes,
    showTarjetaPropiedad: true, // siempre debe estar
    showResBonificacion: bonifVisible,
    showFumigacion: base.fumigacion,
    showRevisionTecnica: true, // siempre debe estar
    showLimpieza: base.limpieza,
  };
}
