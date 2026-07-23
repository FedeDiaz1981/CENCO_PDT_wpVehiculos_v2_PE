import * as React from "react";
import { spfi, SPFI } from "@pnp/sp";
import { SPFx } from "@pnp/sp/presets/all";
import {
  ThemeProvider,
  PrimaryButton,
  DefaultButton,
  Modal,
  Icon,
  MessageBar,
  MessageBarType,
  ProgressIndicator,
  TextField,
  Stack,
  Separator,
} from "@fluentui/react";
import { WebPartContext } from "@microsoft/sp-webpart-base";

import {
  classes,
  theme,
  primaryButtonStyles,
  secondaryButtonStyles,
} from "../ui/styles";
import DatosVehiculo from "./sections/DatosVehiculo";
import { VehiculosGrid } from "./sections/VehiculosGrid";
import { ActionTile } from "./atoms/ActionTile";
import { DocCard } from "./atoms/DocCard";
import { LISTS, VEH_FIELDS } from "../services/fields";
import {
  saveCertificadosDeVehiculoSimple,
  getCertificadosListado,
  deleteCertificadosPorPlaca,
} from "../services/certificados.service";
import { IVehiculoItem } from "../services/vehiculos.service";
import { getEmpresaForCurrentUser } from "../services/proveedores.service";
import {
  isPlacaValid,
  normalizePlacaValue,
  parsePlacaPattern,
} from "../utils/placa";
import {
  isCamionTipoUnidad,
  normalizeCodigoVehicular,
} from "../utils/vehiculoRules";

type IVehiculoItemFull = IVehiculoItem & {
  Placa?: string;
  Marca?: string;
  Modelo?: string;
  Codigo?: string;
  Final?: boolean;
  Capacidad?: string;
  Otros?: string;
  Rampa?: boolean;
  LargoRampa?: string;
  AnchoRampa?: string;
  Bonificacion?: boolean;
  RielesLogisticos?: boolean;
  Propiedad?: boolean;
  NroResolucion?: string;
  MedidasInternas?: string;
  MedidasExternas?: string;
  AlturaPiso?: string;
  PesoCargaUtil?: string;
  PesoNeto?: string;
  Temperatura?: string;
  TipoTemperatura?: string;
  TipoUnidad?: string;
  Activo?: boolean;
  CorreosNotificacion?: string;
  Empresa?: string;
  EmpresaId?: number;
};

type DocFileValue = File | { name: string; url?: string } | string | undefined;

type DocStateLocal = {
  propFile?: DocFileValue;
  revTecDate?: string;
  revTecText?: string;
  revTecFile?: DocFileValue;
  resBonificacionFile?: DocFileValue;
  fumigacionDate?: string;
  fumigacionFile?: DocFileValue;
  SanipesDate?: string;
  SanipesText?: string;
  sanipesFile?: DocFileValue;
  termokingDate?: string;
  termokingFile?: DocFileValue;
  limpiezaDate?: string;
  limpiezaFile?: DocFileValue;
};

const vehiculoInicial: IVehiculoItemFull = {
  Id: 0,
  Title: "",
  Proveedor: "",
  SOAT: "",
  CodigoInterno: "",
  Marca: "",
  Modelo: "",
  Capacidad: "",
  Otros: "",
  Rampa: false,
  LargoRampa: "",
  AnchoRampa: "",
  Bonificacion: false,
  RielesLogisticos: false,
  Propiedad: false,
  NroResolucion: "",
  MedidasInternas: "",
  MedidasExternas: "",
  AlturaPiso: "",
  PesoCargaUtil: "",
  PesoNeto: "",
  Temperatura: "",
  TipoTemperatura: "",
  TipoUnidad: "",
  Activo: true,
  CorreosNotificacion: "",
  Empresa: "",
  EmpresaId: undefined,
};

const createEmptyVehiculo = (defaultCorreos = ""): IVehiculoItemFull => ({
  ...vehiculoInicial,
  CorreosNotificacion: defaultCorreos,
});

const docinicial: DocStateLocal = {
  propFile: undefined,
  resBonificacionFile: undefined,
  fumigacionFile: undefined,
  revTecFile: undefined,
  revTecText: "",
  sanipesFile: undefined,
  SanipesText: "",
  termokingFile: undefined,
  limpiezaFile: undefined,
};

const getDocFileName = (v: DocFileValue): string | undefined => {
  if (!v) return undefined;
  if (typeof v === "string") return v;
  if (typeof v === "object" && "name" in v) return String(v.name);
  return undefined;
};

const getDocFileUrl = (v: DocFileValue): string | undefined => {
  if (!v || typeof v !== "object" || v instanceof File) return undefined;
  return "url" in v ? String(v.url || "") || undefined : undefined;
};

type TempKey = "con temperatura" | "seco";
type UnidadKey = "camión" | "tracto" | "carreta";

const DOC_MATRIX: Record<
  TempKey,
  Record<
    UnidadKey,
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
    tracto: {
      termoking: false,
      sanipes: false,
      tarjetaPropiedad: true,
      bonificacion: false,
      fumigacion: false,
      revisionTecnica: true,
      limpieza: false,
    },
    carreta: {
      termoking: true,
      sanipes: true,
      tarjetaPropiedad: true,
      bonificacion: true,
      fumigacion: true,
      revisionTecnica: true,
      limpieza: true,
    },
  },
  seco: {
    "camión": {
      termoking: false,
      sanipes: false,
      tarjetaPropiedad: true,
      bonificacion: false,
      fumigacion: true,
      revisionTecnica: true,
      limpieza: true,
    },
    tracto: {
      termoking: false,
      sanipes: false,
      tarjetaPropiedad: true,
      bonificacion: false,
      fumigacion: false,
      revisionTecnica: true,
      limpieza: false,
    },
    carreta: {
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

type DocsFlags = {
  showTermoking: boolean;
  showSanipes: boolean;
  showFumigacion: boolean;
  showLimpieza: boolean;
  showResBonificacion: boolean;
  forceTarjetaPropiedad: boolean;
  forceRevisionTecnica: boolean;
};

function getDocumentosVisibles(vehiculo: {
  Temperatura?: string;
  TipoUnidad?: string;
  Bonificacion?: boolean;
}): DocsFlags {
  const tempRaw = (vehiculo.Temperatura || "").trim().toLowerCase();
  const tempKey: TempKey =
    tempRaw === "con temperatura" ? "con temperatura" : "seco";

  const unidadRaw = (vehiculo.TipoUnidad || "").trim().toLowerCase();
  let unidadKey: UnidadKey = "camión";
  if (unidadRaw === "tracto") unidadKey = "tracto";
  if (unidadRaw === "carreta") unidadKey = "carreta";

  const baseFlags = DOC_MATRIX[tempKey][unidadKey];
  const bonifVisible = baseFlags.bonificacion && vehiculo.Bonificacion === true;

  return {
    showTermoking: baseFlags.termoking,
    showSanipes: baseFlags.sanipes,
    showFumigacion: baseFlags.fumigacion,
    showLimpieza: baseFlags.limpieza,
    showResBonificacion: bonifVisible,
    forceTarjetaPropiedad: true,
    forceRevisionTecnica: true,
  };
}

const getErrorText = (err: unknown): string => {
  if (!err) return "";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message || "";

  const anyErr = err as {
    message?: string;
    data?: {
      message?: string;
      responseBody?: string;
      error?: { message?: { value?: string } | string };
    };
    response?: { data?: { message?: string } };
  };

  const innerMessage = anyErr.data?.error?.message;
  const innerValue =
    typeof innerMessage === "object" && innerMessage && "value" in innerMessage
      ? (innerMessage as { value?: string }).value
      : "";

  return (
    anyErr.message ||
    anyErr.data?.message ||
    innerValue ||
    (typeof innerMessage === "string" ? innerMessage : "") ||
    anyErr.data?.responseBody ||
    anyErr.response?.data?.message ||
    ""
  );
};

const cleanHtmlText = (value: unknown): string => {
  const raw = String(value ?? "");
  if (!raw) return "";

  return raw
    .replace(/<\/(div|p|li|tr|td|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]*>/g, "")
    .trim();
};

const readRowValue = (row: Record<string, unknown>, fieldName: string): unknown => {
  const candidates = [
    fieldName,
    fieldName.toLowerCase(),
    fieldName.toUpperCase(),
    `${fieldName}_0`,
    `${fieldName}0`,
  ];

  for (const candidate of candidates) {
    if (candidate in row) {
      return row[candidate];
    }
  }

  return undefined;
};

const asText = (value: unknown): string => {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return cleanHtmlText(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join("; ");

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const preferredKeys = [
      "LookupValue",
      "Title",
      "text",
      "Text",
      "value",
      "Value",
      "name",
      "Name",
      "Label",
      "label",
    ];

    for (const key of preferredKeys) {
      if (key in obj && obj[key] !== undefined && obj[key] !== null) {
        return asText(obj[key]);
      }
    }
  }

  return cleanHtmlText(String(value));
};

const asBoolean = (value: unknown): boolean => {
  if (value === true) return true;
  if (value === false || value === undefined || value === null) return false;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if ("Value" in obj) return asBoolean(obj.Value);
    if ("value" in obj) return asBoolean(obj.value);
    if ("LookupValue" in obj) return asBoolean(obj.LookupValue);
  }
  return false;
};

const mapVehiculoRow = (row: Record<string, unknown>): IVehiculoItemFull => {
  const proveedorValue = readRowValue(row, VEH_FIELDS.Proveedor);
  const proveedorText = asText(proveedorValue);
  const proveedorId = (() => {
    const raw = proveedorValue as Record<string, unknown> | undefined;
    if (raw && typeof raw === "object") {
      const idCandidate = raw.Id ?? raw.LookupId ?? raw.lookupId;
      const parsed = Number(idCandidate);
      return Number.isFinite(parsed) ? parsed : undefined;
    }

    const fallback = row[`${VEH_FIELDS.Proveedor}Id`] ?? row[`${VEH_FIELDS.Proveedor}ID`];
    const parsed = Number(fallback);
    return Number.isFinite(parsed) ? parsed : undefined;
  })();

  return {
    Id: Number(readRowValue(row, "Id") ?? row.ID ?? 0),
    Title: asText(readRowValue(row, VEH_FIELDS.Title)),
    Proveedor: proveedorText,
    SOAT: asText(readRowValue(row, VEH_FIELDS.SOAT)),
    CodigoInterno: asText(readRowValue(row, VEH_FIELDS.Codigo)),
    Marca: asText(readRowValue(row, VEH_FIELDS.Marca)),
    Modelo: asText(readRowValue(row, VEH_FIELDS.Modelo)),
    Capacidad: asText(readRowValue(row, VEH_FIELDS.Capacidad)),
    Otros: asText(readRowValue(row, VEH_FIELDS.CapacidadOtros)),
    Rampa: asBoolean(readRowValue(row, VEH_FIELDS.Rampa)),
    LargoRampa: asText(readRowValue(row, VEH_FIELDS.LargoRampa)),
    AnchoRampa: asText(readRowValue(row, VEH_FIELDS.AnchoRampa)),
    Bonificacion: asBoolean(readRowValue(row, VEH_FIELDS.Bonificacion)),
    RielesLogisticos: asBoolean(readRowValue(row, VEH_FIELDS.RielesLogisticos)),
    Propiedad: asBoolean(readRowValue(row, VEH_FIELDS.Propiedad)),
    NroResolucion: asText(readRowValue(row, VEH_FIELDS.Resolucion)),
    MedidasInternas: asText(readRowValue(row, VEH_FIELDS.MedidasInternas)),
    MedidasExternas: asText(readRowValue(row, VEH_FIELDS.MedidasExternas)),
    AlturaPiso: asText(readRowValue(row, VEH_FIELDS.AlturaPiso)),
    PesoCargaUtil: asText(readRowValue(row, VEH_FIELDS.PesoCargaUtil)),
    PesoNeto: asText(readRowValue(row, VEH_FIELDS.PesoBruto)),
    Temperatura: asText(readRowValue(row, VEH_FIELDS.Temperatura)),
    TipoTemperatura: asText(readRowValue(row, VEH_FIELDS.TipoTemperatura)),
    TipoUnidad: asText(readRowValue(row, VEH_FIELDS.TipoUnidad)),
    Activo: asBoolean(readRowValue(row, VEH_FIELDS.Activo)),
    Final: asBoolean(readRowValue(row, VEH_FIELDS.Final)),
    CorreosNotificacion: asText(readRowValue(row, VEH_FIELDS.Correos)),
    Empresa: proveedorText,
    EmpresaId: proveedorId,
  };
};

const isDuplicatePlacaError = (raw: string): boolean => {
  const t = (raw || "").toLowerCase();
  return (
    t.includes("duplicate") ||
    t.includes("duplicad") ||
    t.includes("already exists") ||
    t.includes("already in use") ||
    t.includes("ya existe") ||
    t.includes("valor duplicado") ||
    t.includes("unique")
  );
};

const DocumentacionLiteLocal: React.FC<{
  doc: DocStateLocal;
  setDoc: React.Dispatch<React.SetStateAction<DocStateLocal>>;
  showTermoking?: boolean;
  showSanipes?: boolean;
  showFumigacion?: boolean;
  showLimpieza?: boolean;
  showResBonificacion?: boolean;
  disabled?: boolean;
}> = ({
  doc,
  setDoc,
  showTermoking = false,
  showSanipes = false,
  showFumigacion = false,
  showLimpieza = false,
  showResBonificacion = false,
  disabled = false,
}) => {
  const setField = <K extends keyof DocStateLocal>(
    k: K
  ): ((v: DocStateLocal[K]) => void) => {
    return (v: DocStateLocal[K]): void => {
      if (disabled) return;
      setDoc((s) => ({ ...s, [k]: v }));
    };
  };

  const fileOut = (f: DocFileValue): File | undefined =>
    f instanceof File ? f : undefined;

  const yearOptions = React.useMemo((): { key: string; text: string }[] => {
    const currentYear = new Date().getFullYear();
    const arr: { key: string; text: string }[] = [];
    for (let y = currentYear; y >= 1980; y--) {
      arr.push({ key: String(y), text: String(y) });
    }
    return arr;
  }, []);

  const todayStr = React.useMemo((): string => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  }, []);

  return (
    <div
      className={classes.card}
      style={disabled ? { opacity: 0.6 } : undefined}
    >
      <div className={classes.cardHeader}>
        <Icon
          iconName="Page"
          styles={{ root: { fontSize: 20, color: theme.palette.themePrimary } }}
        />
        <div className={classes.cardTitle}>2- Documentación</div>
      </div>
      <Separator />

      <div className={classes.docsGrid}>
        <div className={`${classes.docItem} ${classes.docLabelScope}`}>
          <DocCard
            title="Tarjeta de propiedad *"
            file={fileOut(doc.propFile)}
            existingFileName={getDocFileName(doc.propFile)}
            fileUrl={getDocFileUrl(doc.propFile)}
            onFileChange={
              disabled
                ? undefined
                : (f: File | undefined) => setField("propFile")(f)
            }
          />
        </div>

        {showResBonificacion && (
          <div className={`${classes.docItem} ${classes.docLabelScope}`}>
            <DocCard
              title="Resolución de bonificación"
              file={fileOut(doc.resBonificacionFile)}
              existingFileName={getDocFileName(doc.resBonificacionFile)}
            fileUrl={getDocFileUrl(doc.resBonificacionFile)}
              onFileChange={
                disabled
                  ? undefined
                  : (f: File | undefined) => setField("resBonificacionFile")(f)
              }
            />
          </div>
        )}

        {showFumigacion && (
          <div className={`${classes.docItem} ${classes.docLabelScope}`}>
            <DocCard
              title="Certificado de fumigación"
              dateLabel="Fecha de emisión"
              dateValue={doc.fumigacionDate || ""}
              onDateChange={
                disabled
                  ? undefined
                  : (value?: string) => setField("fumigacionDate")(value || "")
              }
              dateMax={todayStr}
              file={fileOut(doc.fumigacionFile)}
              existingFileName={getDocFileName(doc.fumigacionFile)}
            fileUrl={getDocFileUrl(doc.fumigacionFile)}
              onFileChange={
                disabled
                  ? undefined
                  : (f: File | undefined) => setField("fumigacionFile")(f)
              }
            />
          </div>
        )}

        <div className={`${classes.docItem} ${classes.docLabelScope}`}>
          <DocCard
            title="Revisión técnica"
            dateLabel="Fecha de vencimiento"
            dateValue={doc.revTecDate || ""}
            onDateChange={
              disabled
                ? undefined
                : (value?: string) => setField("revTecDate")(value || "")
            }
            dateMin={todayStr}
            textLabel="Año de fabricación"
            textValue={doc.revTecText ?? ""}
            onTextChange={
              disabled
                ? undefined
                : (v?: string) => setField("revTecText")(String(v ?? ""))
            }
            textAsDropdown
            textOptions={yearOptions}
            file={fileOut(doc.revTecFile)}
            existingFileName={getDocFileName(doc.revTecFile)}
            fileUrl={getDocFileUrl(doc.revTecFile)}
            onFileChange={
              disabled
                ? undefined
                : (f: File | undefined) => setField("revTecFile")(f)
            }
          />
        </div>

        {showSanipes && (
          <div className={`${classes.docItem} ${classes.docLabelScope}`}>
            <DocCard
              title="SANIPES"
              dateLabel="Fecha de resoluci?n de expediente"
              dateValue={doc.SanipesDate || ""}
              onDateChange={
                disabled
                  ? undefined
                  : (value?: string) => setField("SanipesDate")(value || "")
              }
              dateMax={todayStr}
              textLabel="N? de expediente"
              textValue={doc.SanipesText ?? ""}
              onTextChange={
                disabled
                  ? undefined
                  : (v?: string) => setField("SanipesText")(String(v ?? ""))
              }
              file={fileOut(doc.sanipesFile)}
              existingFileName={getDocFileName(doc.sanipesFile)}
            fileUrl={getDocFileUrl(doc.sanipesFile)}
              onFileChange={
                disabled
                  ? undefined
                  : (f: File | undefined) => setField("sanipesFile")(f)
              }
            />
          </div>
        )}

        {showTermoking && (
          <div className={`${classes.docItem} ${classes.docLabelScope}`}>
            <DocCard
              title="Certificado de mantenimiento de termoking"
              dateLabel="Fecha de emisión"
              dateValue={doc.termokingDate || ""}
              onDateChange={
                disabled
                  ? undefined
                  : (value?: string) => setField("termokingDate")(value || "")
              }
              dateMax={todayStr}
              file={fileOut(doc.termokingFile)}
              existingFileName={getDocFileName(doc.termokingFile)}
            fileUrl={getDocFileUrl(doc.termokingFile)}
              onFileChange={
                disabled
                  ? undefined
                  : (f: File | undefined) => setField("termokingFile")(f)
              }
            />
          </div>
        )}

        {showLimpieza && (
          <div className={`${classes.docItem} ${classes.docLabelScope}`}>
            <DocCard
              title="Limpieza y desinfección"
              dateLabel="Fecha de emisión"
              dateValue={doc.limpiezaDate || ""}
              onDateChange={
                disabled
                  ? undefined
                  : (value?: string) => setField("limpiezaDate")(value || "")
              }
              dateMax={todayStr}
              file={fileOut(doc.limpiezaFile)}
              existingFileName={getDocFileName(doc.limpiezaFile)}
            fileUrl={getDocFileUrl(doc.limpiezaFile)}
              onFileChange={
                disabled
                  ? undefined
                  : (f: File | undefined) => setField("limpiezaFile")(f)
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};

type NotificacionesVehiculo = Pick<IVehiculoItemFull, "CorreosNotificacion">;

function cleanRichText(value: unknown): string {
  const raw = String(value ?? "");
  if (!raw) return "";

  const withBreaks = raw
    .replace(/<\/(div|p|li|tr|td|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&nbsp;/gi, " ");

  const stripped = withBreaks.replace(/<[^>]*>/g, "");

  try {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = stripped;
    return textarea.value.replace(/\u00a0/g, " ").trim();
  } catch {
    return stripped.replace(/\u00a0/g, " ").trim();
  }
}

const Notificaciones: React.FC<{
  vehiculo: NotificacionesVehiculo;
  setVehiculo: React.Dispatch<React.SetStateAction<IVehiculoItemFull>>;
  disabled?: boolean;
}> = ({ vehiculo, setVehiculo, disabled }) => {
  const value = cleanRichText(vehiculo.CorreosNotificacion);
  return (
    <div className={classes.card}>
      <div className={classes.cardHeader}>
        <Icon
          iconName="Mail"
          styles={{ root: { fontSize: 20, color: theme.palette.themePrimary } }}
        />
        <div className={classes.cardTitle}>Notificaciones</div>
      </div>

      <div style={{ paddingTop: 4 }}>
        <Stack tokens={{ childrenGap: 12 }}>
          <Stack.Item grow className={classes.fieldCell}>
            <TextField
              label="Correos de notificación"
              placeholder="correo1@dominio.com; correo2@dominio.com"
              value={value}
              onChange={(_, v) =>
                setVehiculo((s) => ({
                  ...s,
                  CorreosNotificacion: cleanRichText(v),
                }))
              }
              multiline
              autoAdjustHeight
              disabled={disabled}
            />
          </Stack.Item>
        </Stack>
      </div>
    </div>
  );
};

type RegistroVehicularProps = {
  spContext: WebPartContext;
  vehiculosListTitle: string;
  vehiculosViewModificacionId?: string;
  vehiculosViewBajaId?: string;
  vehiculosViewVisualizacionId?: string;
  certificadosListTitle?: string;
  correosNotificacionDefault?: string;
  mostrarIngresar?: boolean;
  mostrarModificar?: boolean;
  mostrarVisualizar?: boolean;
  mostrarBaja?: boolean;
  proveedoresList: string;
  proveedoresDisplayField: string;
  proveedoresUserField: string;
  placaFormat?: string;
  Proveedor: boolean;
  Distribuidor: boolean;
  Coordinador: boolean;
  Transportista?: boolean;
  Borrar?: boolean;
  alturaPisoHelpImageUrl?: string;
  redireccion?: boolean;
  urlRedireccion?: string;
};

const RegistroVehicular: React.FC<RegistroVehicularProps> = (_props) => {
  const {
    spContext,
    vehiculosListTitle,
    vehiculosViewModificacionId,
    vehiculosViewBajaId,
    vehiculosViewVisualizacionId,
    certificadosListTitle,
    correosNotificacionDefault,
    mostrarIngresar = true,
    mostrarModificar = true,
    mostrarVisualizar = true,
    mostrarBaja = true,
    Proveedor,
    Transportista,
    proveedoresList,
    proveedoresDisplayField,
    proveedoresUserField,
    placaFormat,
    Borrar,
    alturaPisoHelpImageUrl,
    redireccion,
    urlRedireccion,
  } = _props;

  const placaPattern = React.useMemo(
    () => parsePlacaPattern(placaFormat),
    [placaFormat]
  );
  const sp = React.useMemo<SPFI>(
    () => spfi().using(SPFx(spContext)),
    [spContext]
  );
  const vehiculosList = React.useMemo<string>(
    () => vehiculosListTitle || LISTS.Vehiculos,
    [vehiculosListTitle]
  );
  const certificadosList = React.useMemo<string>(
    () => certificadosListTitle || LISTS.Certificados,
    [certificadosListTitle]
  );
  const defaultCorreosNotificacion = React.useMemo<string>(
    () => cleanHtmlText(correosNotificacionDefault || ""),
    [correosNotificacionDefault]
  );

  const [accion, setAccion] = React.useState<
    "crear" | "actualizar" | "baja" | "visualizar"
  >("crear");
  const [modo, setModo] = React.useState<
    "INGRESAR" | "MODIFICAR" | "BAJA" | "VISUALIZAR"
  >("INGRESAR");
  const selectedGridViewId = React.useMemo<string>(
    () =>
      modo === "VISUALIZAR"
        ? vehiculosViewVisualizacionId || ""
        : modo === "BAJA"
        ? vehiculosViewBajaId || ""
        : vehiculosViewModificacionId || "",
    [
      modo,
      vehiculosViewBajaId,
      vehiculosViewModificacionId,
      vehiculosViewVisualizacionId,
    ]
  );
  const showActionButtons = React.useMemo(
    () =>
      mostrarIngresar || mostrarModificar || mostrarVisualizar || mostrarBaja,
    [mostrarBaja, mostrarIngresar, mostrarModificar, mostrarVisualizar]
  );
  const [vehiculos, _setVehiculos] = React.useState<IVehiculoItemFull[]>([]);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [vehiculo, setVehiculo] = React.useState<IVehiculoItemFull>(() =>
    createEmptyVehiculo(defaultCorreosNotificacion)
  );
  const showCodigoVehicular = React.useMemo(
    () => isCamionTipoUnidad(vehiculo.TipoUnidad),
    [vehiculo.TipoUnidad]
  );
  const requiredVehicleFields = React.useMemo(
    (): Record<string, boolean | undefined> =>
      accion === "visualizar"
        ? {}
        : Proveedor
        ? {
            EmpresaId: true,
            Placa: true,
            Marca: true,
            Modelo: true,
          }
        : {
            EmpresaId: true,
            Placa: true,
            Marca: true,
            Modelo: true,
          },
    [Proveedor, accion, showCodigoVehicular]
  );
  const [empresaBloqueada, setEmpresaBloqueada] =
    React.useState<boolean>(false);
  const [empresaUsuarioId, setEmpresaUsuarioId] = React.useState<
    number | undefined
  >(undefined);

  const [doc, setDoc] = React.useState<DocStateLocal>({
    propFile: undefined,
    revTecDate: "",
    revTecText: "",
    revTecFile: undefined,
    resBonificacionFile: undefined,
    fumigacionDate: "",
    fumigacionFile: undefined,
    SanipesDate: "",
    SanipesText: "",
    sanipesFile: undefined,
    termokingDate: "",
    termokingFile: undefined,
    limpiezaDate: "",
    limpiezaFile: undefined,
  });

  const [fechaError, setFechaError] = React.useState<string | undefined>(
    undefined
  );
  const [validationError, setValidationError] = React.useState<
    string | undefined
  >(undefined);
  const [errorModal, setErrorModal] = React.useState<{
    title: string;
    message: string;
  } | null>(null);
  const [cargaPendiente, setCargaPendiente] = React.useState<{
    vehiculoId: number;
    placa: string;
  } | null>(null);
  const topRef = React.useRef<HTMLDivElement | null>(null);
  const selectionLockedRef = React.useRef<boolean>(false);
  const loadVehiculosSeqRef = React.useRef(0);
  const errorModalStyles = React.useMemo(
    () => ({
      container: {
        padding: "20px 20px 16px",
        maxWidth: 560,
        minWidth: 320,
      } as React.CSSProperties,
      header: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        paddingBottom: 10,
        marginBottom: 12,
        borderBottom: `1px solid ${theme.semanticColors.bodyDivider}`,
      } as React.CSSProperties,
      icon: {
        fontSize: 20,
        color: theme.semanticColors.errorText,
      } as React.CSSProperties,
      title: {
        fontSize: 18,
        fontWeight: 700,
        color: theme.semanticColors.bodyText,
      } as React.CSSProperties,
      body: {
        fontSize: 14,
        lineHeight: 1.45,
        color: theme.semanticColors.bodyText,
        marginBottom: 16,
      } as React.CSSProperties,
      footer: {
        display: "flex",
        justifyContent: "flex-end",
        gap: 8,
      } as React.CSSProperties,
    }),
    []
  );

  React.useEffect((): void => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let errorMsg: string | undefined;

    if (doc.revTecDate) {
      const rev = new Date(doc.revTecDate);
      rev.setHours(0, 0, 0, 0);
      if (rev < hoy) {
        errorMsg =
          "La fecha de vencimiento de la revisi?n t?cnica no puede estar vencida.";
      }
    }

    if (!errorMsg && doc.fumigacionDate) {
      const fum = new Date(doc.fumigacionDate);
      fum.setHours(0, 0, 0, 0);
      const diffMeses =
        (hoy.getFullYear() - fum.getFullYear()) * 12 +
        (hoy.getMonth() - fum.getMonth());
      if (diffMeses > 6) {
        errorMsg =
          "La fecha de emisi?n del certificado de fumigaci?n no puede tener m?s de 6 meses de antig?edad.";
      }
    }

    if (!errorMsg && doc.termokingDate) {
      const termokingD = new Date(doc.termokingDate);
      termokingD.setHours(0, 0, 0, 0);
      const diffMeses =
        (hoy.getFullYear() - termokingD.getFullYear()) * 12 +
        (hoy.getMonth() - termokingD.getMonth());
      if (diffMeses > 6) {
        errorMsg =
          "La fecha de emisi?n del certificado de termoking no puede tener m?s de 6 meses de antig?edad.";
      }
    }

    if (!errorMsg && doc.limpiezaDate) {
      const limpiezaD = new Date(doc.limpiezaDate);
      limpiezaD.setHours(0, 0, 0, 0);
      const diffDias =
        (hoy.getTime() - limpiezaD.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDias > 31) {
        errorMsg =
          "La fecha de emisi?n del certificado de limpieza y desinfecci?n no puede tener m?s de un mes de antig?edad.";
      }
    }

    setFechaError(errorMsg);
  }, [doc.revTecDate, doc.fumigacionDate, doc.termokingDate, doc.limpiezaDate]);

  React.useEffect((): void => {
    const run = async (): Promise<void> => {
      const debeForzar = Proveedor || !!Transportista;
      if (!debeForzar) {
        setEmpresaBloqueada(false);
        setEmpresaUsuarioId(undefined);
        return;
      }

      try {
        const { empresaTitle, proveedorId } = await getEmpresaForCurrentUser({
          listName: proveedoresList || "Proveedores",
          displayCol: proveedoresDisplayField || "Title",
          userCol: proveedoresUserField || "Usuarios",
        }, sp);

        if (selectionLockedRef.current) {
          return;
        }

        if (proveedorId && empresaTitle) {
          setVehiculo((prev) => ({
            ...prev,
            EmpresaId: proveedorId,
            Empresa: empresaTitle,
          }));
          setEmpresaBloqueada(true);
          setEmpresaUsuarioId(proveedorId);
        } else {
          setEmpresaBloqueada(false);
          setEmpresaUsuarioId(undefined);
        }
      } catch (err) {
        console.error("No se pudo resolver la empresa del usuario", err);
        setEmpresaBloqueada(false);
        setEmpresaUsuarioId(undefined);
      }
    };

    run().catch((err) => console.error(err));
  }, [
    Proveedor,
    Transportista,
    proveedoresList,
    proveedoresDisplayField,
    proveedoresUserField,
  ]);

  const resetFormulario = React.useCallback(
    (
      nextAccion?: "crear" | "actualizar" | "baja" | "visualizar",
      opts?: { scrollTop?: boolean }
    ): void => {
      selectionLockedRef.current = false;
      setCargaPendiente(null);

      if (nextAccion) {
        setAccion(nextAccion);
      }

      let baseVeh: IVehiculoItemFull = {
        ...createEmptyVehiculo(defaultCorreosNotificacion),
        Id: 0,
        EmpresaId: undefined,
        Empresa: "",
        Proveedor: "",
        CodigoInterno: "",
        Placa: "",
        SOAT: "",
        Marca: "",
        Modelo: "",
        Capacidad: "",
        Otros: "",
        Rampa: false,
        LargoRampa: "",
        AnchoRampa: "",
        Bonificacion: false,
        RielesLogisticos: false,
        Propiedad: false,
        NroResolucion: "",
        MedidasInternas: "",
        MedidasExternas: "",
        AlturaPiso: "",
        PesoCargaUtil: "",
        PesoNeto: "",
        Temperatura: "",
        TipoTemperatura: "",
        TipoUnidad: "",
        Activo: true,
      };

      if (empresaBloqueada && empresaUsuarioId) {
        baseVeh = { ...baseVeh, EmpresaId: empresaUsuarioId };
      }

      setVehiculo(baseVeh);
      setDoc({ ...docinicial });
      setValidationError(undefined);
      setFechaError(undefined);
      setCargaPendiente(null);

      if (opts?.scrollTop) {
        window.requestAnimationFrame(() => {
          if (topRef.current) {
            topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
          } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        });
      }
    },
    [defaultCorreosNotificacion, empresaBloqueada, empresaUsuarioId]
  );

  React.useEffect(() => {
    if (accion !== "crear") return;
    if (vehiculo.Id && vehiculo.Id > 0) return;

    const current = cleanHtmlText(vehiculo.CorreosNotificacion);
    if (current) return;

    if (!defaultCorreosNotificacion) return;

    setVehiculo((prev) =>
      prev.Id > 0 || cleanHtmlText(prev.CorreosNotificacion)
        ? prev
        : { ...prev, CorreosNotificacion: defaultCorreosNotificacion }
    );
  }, [accion, defaultCorreosNotificacion, vehiculo.Id, vehiculo.CorreosNotificacion]);

  const onIngresarClick = (): void => {
    resetFormulario("crear", { scrollTop: true });
  };

  const onVisualizarClick = (): void => {
    resetFormulario("visualizar", { scrollTop: true });
    setModo("VISUALIZAR");
    cargarVehiculos({
      includeFinalizados: true,
      viewId: vehiculosViewVisualizacionId || "",
    }).catch((e) =>
      console.error(e)
    );
  };

  const choices = {
    Temperatura: [
      { key: "Seco", text: "Seco" },
      { key: "Con temperatura", text: "Con temperatura" },
    ],
    TipoTemperatura: [
      { key: "Refrigerado", text: "Refrigerado" },
      { key: "Congelado", text: "Congelado" },
      { key: "Refrigerado y congelado", text: "Refrigerado y congelado" },
    ],
    TipoUnidad: [
      { key: "Camión", text: "Camión" },
      { key: "Tracto", text: "Tracto" },
      { key: "Carreta", text: "Carreta" },
    ],
  };

  const docsFlags = React.useMemo((): DocsFlags => {
    return getDocumentosVisibles({
      Temperatura: vehiculo.Temperatura,
      TipoUnidad: vehiculo.TipoUnidad,
      Bonificacion: vehiculo.Bonificacion,
    });
  }, [vehiculo.Temperatura, vehiculo.TipoUnidad, vehiculo.Bonificacion]);

  const isUrlDrivenEdit = React.useMemo((): boolean => {
    const query = new URLSearchParams(window.location.search);
    const rawId =
      query.get("id") || query.get("itemId") || query.get("vehiculoId");
    const vehiculoId = Number(rawId);
    return !!rawId && !Number.isNaN(vehiculoId) && vehiculoId > 0;
  }, []);

  const isModalDriven = React.useMemo((): boolean => {
    const query = new URLSearchParams(window.location.search);
    return (
      query.get("modal") === "1" ||
      query.get("dialog") === "1" ||
      query.get("embed") === "1"
    );
  }, []);

  const notifyModalClose = React.useCallback(
    (payload: {
      action: "saved" | "cancelled";
      id?: number;
      placa?: string;
    }): void => {
      const message = {
        source: "registroVehicular",
        type: "close",
        payload,
      };

      const origin = new URL(spContext.pageContext.web.absoluteUrl).origin;
      const targets = [window.parent, window.top].filter(
        (target): target is Window => !!target && target !== window
      );

      for (const target of targets) {
        try {
          target.postMessage(message, origin);
        } catch (err) {
          console.warn("No se pudo notificar el cierre del modal.", err);
        }
      }
    },
    [spContext]
  );

  const deleteVehiculoYCertificados = React.useCallback(
    async (spLocal: SPFI, placa: string): Promise<void> => {
      await deleteCertificadosPorPlaca(placa, certificadosList);

      const list = spLocal.web.lists.getByTitle(vehiculosList);
      const found = await list.items
        .select("Id")
        .filter(`${VEH_FIELDS.Title} eq '${placa.replace(/'/g, "''")}'`)
        .top(1)();

      const id = found?.[0]?.Id as number | undefined;
      if (id) {
        await list.items.getById(id).delete();
      }
    },
    [certificadosList, vehiculosList]
  );

  const hydrateSelection = React.useCallback(
    async (
      veh: IVehiculoItemFull,
      nextAction: "actualizar" | "baja" | "visualizar"
    ): Promise<void> => {
      selectionLockedRef.current = true;

      setVehiculo({
        Id: veh.Id,
        Title: veh.Title || "",
        Proveedor: veh.Proveedor || "",
        SOAT: veh.SOAT || "",
        CodigoInterno: veh.CodigoInterno || "",
        Placa: veh.Title || "",
        Codigo: veh.CodigoInterno || "",
        Marca: veh.Marca || "",
        Modelo: veh.Modelo || "",
        Capacidad: veh.Capacidad || "",
        Otros: veh.Otros || "",
        Rampa: !!veh.Rampa,
        LargoRampa: veh.LargoRampa || "",
        AnchoRampa: veh.AnchoRampa || "",
        Bonificacion: !!veh.Bonificacion,
        RielesLogisticos: !!veh.RielesLogisticos,
        Propiedad: !!veh.Propiedad,
        NroResolucion: veh.NroResolucion || "",
        MedidasInternas: veh.MedidasInternas || "",
        MedidasExternas: veh.MedidasExternas || "",
        AlturaPiso: veh.AlturaPiso || "",
        PesoCargaUtil: veh.PesoCargaUtil || "",
        PesoNeto: veh.PesoNeto || "",
        Temperatura: veh.Temperatura || "",
        TipoTemperatura: veh.TipoTemperatura || "",
        TipoUnidad: veh.TipoUnidad || "",
        Activo: veh.Activo !== false,
        CorreosNotificacion: veh.CorreosNotificacion || "",
        Empresa: veh.Empresa || veh.Proveedor || "",
        EmpresaId: veh.EmpresaId,
      });

      try {
        const certRows = await getCertificadosListado(
          veh.Title || "",
          certificadosList
        );

        setDoc(() => {
          const next: DocStateLocal = {
            propFile: undefined,
            revTecDate: "",
            revTecText: "",
            revTecFile: undefined,
            resBonificacionFile: undefined,
            fumigacionDate: "",
            fumigacionFile: undefined,
            SanipesDate: "",
            SanipesText: "",
            sanipesFile: undefined,
            termokingDate: "",
            termokingFile: undefined,
            limpiezaDate: "",
            limpiezaFile: undefined,
          };

          const toYMD = (v?: string | undefined): string =>
            v ? new Date(v).toISOString().slice(0, 10) : "";

          for (const c of certRows) {
            const tipo = (c.tipo || "").toUpperCase();

            if (tipo.includes("TARJETA") && tipo.includes("PROPIEDAD")) {
              next.propFile = c.archivo
                ? { name: c.archivo, url: c.archivoUrl }
                : undefined;
            }

            if (
              tipo.includes("REVISI") &&
              (tipo.includes("TÉCN") || tipo.includes("TECN"))
            ) {
              next.revTecDate = toYMD(c.caducidad || undefined);
              next.revTecText =
                c.anio !== undefined && c.anio !== null ? String(c.anio) : "";
              next.revTecFile = c.archivo
                ? { name: c.archivo, url: c.archivoUrl }
                : undefined;
            }

            if (tipo.includes("FUMIG")) {
              next.fumigacionDate = dateOnly(c.emision || undefined);
              next.fumigacionFile = c.archivo
                ? { name: c.archivo, url: c.archivoUrl }
                : undefined;
            }

            if (tipo.includes("BONIFIC")) {
              next.resBonificacionFile = c.archivo
                ? { name: c.archivo, url: c.archivoUrl }
                : undefined;
            }

            if (tipo.includes("SANIPES")) {
              next.SanipesDate = dateOnly(
                c.resolucion || c.emision || undefined
              );
              next.SanipesText = c.expediente || "";
              next.sanipesFile = c.archivo
                ? { name: c.archivo, url: c.archivoUrl }
                : undefined;
            }

            if (tipo.includes("TERMO")) {
              next.termokingDate = dateOnly(c.emision || undefined);
              next.termokingFile = c.archivo
                ? { name: c.archivo, url: c.archivoUrl }
                : undefined;
            }

            if (
              tipo.includes("LIMPIEZA") ||
              tipo.includes("DESINFECCION") ||
              tipo.includes("DESINFECCIÓN")
            ) {
              next.limpiezaDate = dateOnly(c.emision || undefined);
              next.limpiezaFile = c.archivo
                ? { name: c.archivo, url: c.archivoUrl }
                : undefined;
            }
          }

          return next;
        });
      } catch (err) {
        console.error("Error cargando certificados", err);
        alert("No se pudo cargar la documentaci?n de este veh?culo.");
      }

      setModo(
        nextAction === "baja"
          ? "BAJA"
          : nextAction === "visualizar"
          ? "VISUALIZAR"
          : "MODIFICAR"
      );
      setAccion(nextAction);
      setValidationError(undefined);
    },
    [vehiculosList]
  );

  const loadVehicleForEdit = React.useCallback(
    async (
      vehiculoId: number,
      nextAction: "actualizar" | "baja" | "visualizar" = "actualizar"
    ): Promise<boolean> => {
      if (!vehiculoId || vehiculoId <= 0) return false;

      setCargaPendiente(null);

      const item = (await sp.web.lists
        .getByTitle(vehiculosList)
        .items.getById(vehiculoId)
        .select(
          "Id",
          VEH_FIELDS.Title,
          VEH_FIELDS.SOAT,
          VEH_FIELDS.Codigo,
          VEH_FIELDS.Marca,
          VEH_FIELDS.Modelo,
          VEH_FIELDS.Capacidad,
          VEH_FIELDS.CapacidadOtros,
          VEH_FIELDS.Rampa,
          VEH_FIELDS.LargoRampa,
          VEH_FIELDS.AnchoRampa,
          VEH_FIELDS.Bonificacion,
          VEH_FIELDS.RielesLogisticos,
          VEH_FIELDS.Propiedad,
          VEH_FIELDS.Resolucion,
          VEH_FIELDS.MedidasInternas,
          VEH_FIELDS.MedidasExternas,
          VEH_FIELDS.AlturaPiso,
          VEH_FIELDS.PesoCargaUtil,
          VEH_FIELDS.PesoBruto,
          VEH_FIELDS.Temperatura,
          VEH_FIELDS.TipoTemperatura,
          VEH_FIELDS.TipoUnidad,
          VEH_FIELDS.Activo,
          VEH_FIELDS.Correos,
          `${VEH_FIELDS.Proveedor}/Id`,
          `${VEH_FIELDS.Proveedor}/Title`
        )
        .expand(VEH_FIELDS.Proveedor)()) as Record<string, unknown> & {
        Id?: number;
        Proveedor?: { Title?: string; Id?: number };
      };

      if (!item?.Id) return false;

      const veh: IVehiculoItemFull = {
        Id: Number(item.Id || 0),
        Title: String(item[VEH_FIELDS.Title] ?? ""),
        Proveedor: String(item.Proveedor?.Title ?? ""),
        SOAT: String(item[VEH_FIELDS.SOAT] ?? ""),
        CodigoInterno: String(item[VEH_FIELDS.Codigo] ?? ""),
        Placa: String(item[VEH_FIELDS.Title] ?? ""),
        Codigo: String(item[VEH_FIELDS.Codigo] ?? ""),
        Marca: String(item[VEH_FIELDS.Marca] ?? ""),
        Modelo: String(item[VEH_FIELDS.Modelo] ?? ""),
        Capacidad: String(item[VEH_FIELDS.Capacidad] ?? ""),
        Otros: String(item[VEH_FIELDS.CapacidadOtros] ?? ""),
        Rampa: item[VEH_FIELDS.Rampa] === true,
        LargoRampa: String(item[VEH_FIELDS.LargoRampa] ?? ""),
        AnchoRampa: String(item[VEH_FIELDS.AnchoRampa] ?? ""),
        Bonificacion: item[VEH_FIELDS.Bonificacion] === true,
        RielesLogisticos: item[VEH_FIELDS.RielesLogisticos] === true,
        Propiedad: item[VEH_FIELDS.Propiedad] === true,
        NroResolucion: String(item[VEH_FIELDS.Resolucion] ?? ""),
        MedidasInternas: String(item[VEH_FIELDS.MedidasInternas] ?? ""),
        MedidasExternas: String(item[VEH_FIELDS.MedidasExternas] ?? ""),
        AlturaPiso: String(item[VEH_FIELDS.AlturaPiso] ?? ""),
        PesoCargaUtil: String(item[VEH_FIELDS.PesoCargaUtil] ?? ""),
        PesoNeto: String(item[VEH_FIELDS.PesoBruto] ?? ""),
        Temperatura: String(item[VEH_FIELDS.Temperatura] ?? ""),
        TipoTemperatura: String(item[VEH_FIELDS.TipoTemperatura] ?? ""),
        TipoUnidad: String(item[VEH_FIELDS.TipoUnidad] ?? ""),
        Activo: item[VEH_FIELDS.Activo] !== false,
        CorreosNotificacion: cleanRichText(item[VEH_FIELDS.Correos]),
        Empresa: String(item.Proveedor?.Title ?? ""),
        EmpresaId: item.Proveedor?.Id ?? undefined,
      };

      await hydrateSelection(veh, nextAction);
      return true;
    },
    [hydrateSelection, sp, vehiculosList]
  );

  React.useEffect((): void => {
    const query = new URLSearchParams(window.location.search);
    const rawId =
      query.get("id") || query.get("itemId") || query.get("vehiculoId");

    const vehiculoId = Number(rawId);
    if (!rawId || Number.isNaN(vehiculoId) || vehiculoId <= 0) {
      return;
    }

    loadVehicleForEdit(vehiculoId).catch((err) => {
      console.error("No se pudo cargar el veh?culo desde la URL", err);
      alert("No se pudo abrir el veh?culo indicado desde la URL.");
    });
  }, [loadVehicleForEdit]);

  const lockedFields: string[] = [];

  function dateOnly(v?: string | undefined): string {
    if (!v) return "";
    const m = /^(\d{4}-\d{2}-\d{2})/.exec(v);
    if (m) return m[1];
    const d = new Date(v);
    return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
  }

  const resolveRedirectUrl = React.useCallback(
    (rawUrl: string): string => {
      const raw = rawUrl.trim();
      if (/^https?:\/\//i.test(raw)) return raw;

      const base = spContext.pageContext.web.absoluteUrl.replace(/\/$/, "");
      const rel = raw.startsWith("/") ? raw : `/${raw}`;
      return `${base}${rel}`;
    },
    [spContext]
  );

  const redirectContainingPage = React.useCallback((targetUrl: string): void => {
    const tryAssign = (targetWindow: Window | null | undefined): boolean => {
      if (!targetWindow) return false;

      try {
        targetWindow.location.assign(targetUrl);
        return true;
      } catch (err) {
        console.warn("No se pudo redirigir la ventana contenedora.", err);
        return false;
      }
    };

    if (window.top && window.top !== window && tryAssign(window.top)) return;
    if (window.parent && window.parent !== window && tryAssign(window.parent)) {
      return;
    }

    window.location.assign(targetUrl);
  }, []);

  const onGuardar = React.useCallback(async (): Promise<void> => {
    setErrorModal(null);
    if (accion === "baja") {
      let motivo: string | undefined = "";
      let ok = false;

      while (!ok) {
        const input = window.prompt("Motivo de la baja:", motivo || "");
        if (input === null) return;
        const trimmed = input.trim();
        if (trimmed) {
          motivo = trimmed;
          ok = true;
        } else {
          alert(
            "Ten?s que ingresar un motivo para poder dar de baja el veh?culo."
          );
        }
      }

      try {
        setBusy(true);
        const placa = (vehiculo.Placa || "").trim();
        const vehList = sp.web.lists.getByTitle(vehiculosList);

        if (Borrar) {
          if (vehiculo.Id) {
            await vehList.items
              .getById(vehiculo.Id)
              .update({ motivobaja: motivo });
          }
          await deleteVehiculoYCertificados(sp, placa);
          alert("Veh?culo y certificados eliminados correctamente.");
        } else {
          if (!vehiculo.Id) {
            alert("No se encontr? el Id del veh?culo para dar de baja.");
          } else {
            await vehList.items.getById(vehiculo.Id).update({
              [VEH_FIELDS.Activo]: false,
              motivobaja: motivo,
            });
            alert("Veh?culo dado de baja (marcado como inactivo).");
          }
        }
      } catch (err) {
        console.error("Error al dar de baja el veh?culo", err);
        alert("Error al dar de baja el veh?culo. Revis? consola.");
      } finally {
        setBusy(false);
      }
      return;
    }

    if (accion === "actualizar" && vehiculo.Id && vehiculo.Id > 0) {
      try {
        const current = (await sp.web.lists
          .getByTitle(vehiculosList)
          .items.getById(vehiculo.Id)
          .select("Id", VEH_FIELDS.Final)()) as Record<string, unknown>;

        if (current && current[VEH_FIELDS.Final] === false) {
          alert(
            "No se puede modificar un vehículo finalizado. Actualizá la grilla e intentá nuevamente."
          );
          return;
        }
      } catch (err) {
        console.error("No se pudo verificar el estado final del vehículo", err);
        alert(
          "No se pudo verificar el estado actual del vehículo. Volvé a intentar."
        );
        return;
      }
    }

    const errores: string[] = [];
    const isLockedField = (name: string): boolean =>
      (lockedFields || []).includes(name);

    const req = (
      value: unknown,
      label: string,
      lockedBy?: string | string[]
    ): void => {
      const keys = Array.isArray(lockedBy)
        ? lockedBy
        : lockedBy
        ? [lockedBy]
        : [];
      if (keys.some((k) => isLockedField(k))) return;

      if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
      ) {
        errores.push(label);
      }
    };

    // =========================
    // VALIDACIÓN CAMPOS VEHÍCULO
    // =========================
    req(vehiculo.EmpresaId, "Empresa", ["Empresa", "EmpresaId"]);
    req(vehiculo.Temperatura, "Temperatura", "Temperatura");
    req(vehiculo.TipoUnidad, "Tipo de unidad", "TipoUnidad");

    if (
      (vehiculo.Temperatura || "").trim().toLowerCase() === "con temperatura"
    ) {
      req(vehiculo.TipoTemperatura, "Tipo temperatura", "TipoTemperatura");
    }

    req(vehiculo.Marca, "Marca", "Marca");
    req(vehiculo.Modelo, "Modelo", "Modelo");

    req(vehiculo.Placa, "Placa", ["Placa", "Title"]);
    if (vehiculo.Placa && !isPlacaValid(vehiculo.Placa, placaPattern)) {
      errores.push("Placa");
    }
    req(vehiculo.SOAT, "SOAT", "SOAT");
    if (showCodigoVehicular) {
      req(vehiculo.Codigo || vehiculo.CodigoInterno, "C?digo de unidad", [
        "Codigo",
        "CodigoInterno",
      ]);
    }

    req(vehiculo.Capacidad, "Capacidad", "Capacidad");
    req(vehiculo.AlturaPiso, "Altura de piso al furg?n", "AlturaPiso");
    req(vehiculo.PesoCargaUtil, "Peso ?til", "PesoCargaUtil");
    req(vehiculo.PesoNeto, "Peso bruto", "PesoNeto");

    if (
      vehiculo.Capacidad &&
      String(vehiculo.Capacidad).toLowerCase().includes("otro")
    ) {
      req(vehiculo.Otros, "Capacidad otros", "Otros");
    }

    if (vehiculo.Rampa) {
      req(vehiculo.LargoRampa, "Largo de rampa", "LargoRampa");
      req(vehiculo.AnchoRampa, "Ancho de rampa", "AnchoRampa");
    }

    // =========================
    // VALIDACIÓN DOCUMENTOS (según docsFlags)
    // =========================
    const hasValueLocal = (v: unknown): boolean =>
      v !== undefined && v !== null && String(v).trim() !== "";

    const hasDocFile = (v: DocFileValue): boolean => {
      if (!v) return false;
      if (v instanceof File) return true;
      if (typeof v === "string") return v.trim().length > 0;
      if (typeof v === "object" && "name" in v)
        return String((v as any).name || "").trim().length > 0;
      return false;
    };

    const erroresDocs: string[] = [];

    // Solo exigir docs si NO es transportista (como ya ven?as haciendo)
    if (!Transportista) {
      // Tarjeta propiedad (siempre)
      if (!hasDocFile(doc.propFile)) erroresDocs.push("Tarjeta de propiedad");

      // Revisi?n t?cnica (siempre)
      if (!hasValueLocal(doc.revTecDate))
        erroresDocs.push("Fecha de vencimiento (Revisi?n t?cnica)");
      if (!hasValueLocal(doc.revTecText))
        erroresDocs.push("A?o de fabricaci?n (Revisi?n t?cnica)");
      if (!hasDocFile(doc.revTecFile))
        erroresDocs.push("Documento (Revisi?n t?cnica)");

      // Fumigaci?n (cuando aplica)
      if (docsFlags.showFumigacion) {
        if (!hasValueLocal(doc.fumigacionDate))
          erroresDocs.push("Fecha de emisi?n (Fumigaci?n)");
        if (!hasDocFile(doc.fumigacionFile))
          erroresDocs.push("Certificado de fumigaci?n");
      }

      // Termoking (cuando aplica)  âœ… lo que pediste
      if (docsFlags.showTermoking) {
        if (!hasValueLocal(doc.termokingDate))
          erroresDocs.push("Fecha de emisi?n (Termoking)");
        if (!hasDocFile(doc.termokingFile))
          erroresDocs.push("Certificado de mantenimiento de termoking");
      }

      // Limpieza (cuando aplica)
      if (docsFlags.showLimpieza) {
        if (!hasValueLocal(doc.limpiezaDate))
          erroresDocs.push("Fecha de emisi?n (Limpieza y desinfecci?n)");
        if (!hasDocFile(doc.limpiezaFile))
          erroresDocs.push("Certificado de limpieza y desinfecci?n");
      }

      // Bonificaci?n (cuando aplica)
      if (docsFlags.showResBonificacion) {
        if (!hasDocFile(doc.resBonificacionFile))
          erroresDocs.push("Resoluci?n de bonificaci?n");
      }

      // SANIPES NO obligatorio => no se valida
    }

    // =========================
    // CORTE SI HAY ERRORES (veh?culo o docs)
    // =========================
    if (errores.length > 0 || erroresDocs.length > 0) {
      const partes: string[] = [];
      if (errores.length > 0) partes.push(errores.join(", "));
      if (erroresDocs.length > 0) partes.push(erroresDocs.join(", "));

      setValidationError(
        "Complet? los campos obligatorios: " + partes.join(", ")
      );
      return;
    }

    setValidationError(undefined);

    // =========================
    // GUARDADO
    // =========================
    try {
      setBusy(true);

      const placa = normalizePlacaValue(vehiculo.Placa || "", placaPattern);
      const isCreateFlow = accion === "crear";
      let savedVehiculoId = vehiculo.Id || 0;
      const item: Record<string, unknown> = {
        [VEH_FIELDS.Title]: placa,
        [VEH_FIELDS.SOAT]: vehiculo.SOAT || "",
        [VEH_FIELDS.Codigo]: normalizeCodigoVehicular(vehiculo.CodigoInterno || ""),
        [VEH_FIELDS.Marca]: vehiculo.Marca || "",
        [VEH_FIELDS.Modelo]: vehiculo.Modelo || "",
        [VEH_FIELDS.Capacidad]: vehiculo.Capacidad || "",
        [VEH_FIELDS.CapacidadOtros]: vehiculo.Otros || "",
        [VEH_FIELDS.Rampa]: !!vehiculo.Rampa,
        [VEH_FIELDS.LargoRampa]: vehiculo.LargoRampa || "",
        [VEH_FIELDS.AnchoRampa]: vehiculo.AnchoRampa || "",
        [VEH_FIELDS.Bonificacion]: !!vehiculo.Bonificacion,
        [VEH_FIELDS.RielesLogisticos]: !!vehiculo.RielesLogisticos,
        [VEH_FIELDS.Propiedad]: !!vehiculo.Propiedad,
        [VEH_FIELDS.Resolucion]: vehiculo.NroResolucion || "",
        [VEH_FIELDS.MedidasInternas]: vehiculo.MedidasInternas || "",
        [VEH_FIELDS.MedidasExternas]: vehiculo.MedidasExternas || "",
        [VEH_FIELDS.AlturaPiso]: vehiculo.AlturaPiso || "",
        [VEH_FIELDS.PesoCargaUtil]: vehiculo.PesoCargaUtil || "",
        [VEH_FIELDS.PesoBruto]: vehiculo.PesoNeto || "",
        [VEH_FIELDS.Temperatura]: vehiculo.Temperatura || "",
        [VEH_FIELDS.TipoTemperatura]: vehiculo.TipoTemperatura || "",
        [VEH_FIELDS.TipoUnidad]: vehiculo.TipoUnidad || "",
        [VEH_FIELDS.Activo]: vehiculo.Activo !== false,
        [VEH_FIELDS.Correos]: cleanRichText(vehiculo.CorreosNotificacion),
      };

      if (vehiculo.EmpresaId && Number(vehiculo.EmpresaId) > 0) {
        item[`${VEH_FIELDS.Proveedor}Id`] = Number(vehiculo.EmpresaId);
      }

      const vehList = sp.web.lists.getByTitle(vehiculosList);

      if (accion === "actualizar" && vehiculo.Id && vehiculo.Id > 0) {
        await vehList.items
          .getById(vehiculo.Id)
          .update(item as Record<string, unknown>);
        savedVehiculoId = vehiculo.Id;
      } else {
        const addResult = (await vehList.items.add(
          item as Record<string, unknown>
        )) as { data?: { Id?: number; ID?: number } };
        savedVehiculoId =
          addResult.data?.Id ?? addResult.data?.ID ?? savedVehiculoId;
        if (!savedVehiculoId) {
          const found = (await vehList.items
            .select("Id")
            .filter(`${VEH_FIELDS.Title} eq '${placa.replace(/'/g, "''")}'`)
            .top(1)()) as Array<{ Id?: number }>;
          savedVehiculoId = found?.[0]?.Id ?? 0;
        }
      }

      if (savedVehiculoId > 0) {
        setVehiculo((prev) => ({ ...prev, Id: savedVehiculoId, Placa: placa, Title: placa }));
      }

      try {
        await saveCertificadosDeVehiculoSimple({
          placa,
          doc,
          docsFlags,
          listTitle: certificadosList,
        });
      } catch (errDocs) {
        console.error("Error al guardar certificados", errDocs);
        if (isCreateFlow && savedVehiculoId > 0) {
          setCargaPendiente({ vehiculoId: savedVehiculoId, placa });
          setModo("MODIFICAR");
          setAccion("actualizar");
          setErrorModal({
            title: "Carga parcial",
            message:
              "El vehículo se guardó, pero hubo un error al guardar la documentación. Podés completar lo faltante o cancelar la carga para revertir todo.",
          });
        } else {
          setErrorModal({
            title: "Guardado parcial",
            message:
              "El vehículo se guardó, pero hubo un error al guardar la documentación. Intentá nuevamente.",
          });
        }
        return;
      }

      setCargaPendiente(null);
      if (isModalDriven) {
        notifyModalClose({
          action: "saved",
          id: savedVehiculoId || undefined,
          placa,
        });
        return;
      }

      alert("Veh?culo y certificados guardados correctamente.");

      if (redireccion && urlRedireccion && urlRedireccion.trim()) {
        redirectContainingPage(resolveRedirectUrl(urlRedireccion));
        return;
      }

      resetFormulario(undefined, { scrollTop: true });
    } catch (err) {
      console.error("Error al guardar veh?culo o certificados", err);
      const raw = getErrorText(err);
      const placa = (vehiculo.Placa || "").trim();

      if (isDuplicatePlacaError(raw) && placa) {
        setErrorModal({
          title: "Error al guardar",
          message: `Error, no se puede hacer un doble registro de un veh?culo con placa ${placa}.`,
        });
      } else {
        setErrorModal({
          title: "Error al guardar",
          message:
            "Ocurri? un error al guardar el veh?culo. Verific? los datos e intent? nuevamente.",
        });
      }
    } finally {
      setBusy(false);
    }
  }, [
    accion,
    vehiculo,
    doc,
    docsFlags,
    sp,
    Borrar,
    lockedFields,
    Transportista,
    redireccion,
    urlRedireccion,
    spContext,
    redirectContainingPage,
    resolveRedirectUrl,
    isModalDriven,
    notifyModalClose,
    deleteVehiculoYCertificados,
    resetFormulario,
    vehiculosList,
  ]);

  const cargarVehiculos = React.useCallback(
    async (opts?: {
      includeFinalizados?: boolean;
      viewId?: string;
    }): Promise<void> => {
      const includeFinalizados = opts?.includeFinalizados ?? false;
      const explicitViewId = String(opts?.viewId || "").trim();
      const loadSeq = ++loadVehiculosSeqRef.current;

      _setVehiculos([]);

      try {
        const list = sp.web.lists.getByTitle(vehiculosList);

        const applyGridFilters = (
          items: IVehiculoItemFull[],
          opts?: { ignoreEmpresaFilter?: boolean }
        ): IVehiculoItemFull[] => {
          return items.filter((item) => {
            if (!includeFinalizados && item.Final) return false;
            if (!item.Activo) return false;
            if (
              !opts?.ignoreEmpresaFilter &&
              (Proveedor || !!Transportista) &&
              empresaUsuarioId
            ) {
              return Number(item.EmpresaId || 0) === Number(empresaUsuarioId);
            }
            return true;
          });
        };

        const loadFromView = async (viewId: string): Promise<IVehiculoItemFull[]> => {
          const view = await list.views.getById(viewId).select(
            "Id",
            "Title",
            "ListViewXml"
          )();

          const stream = await list.renderListDataAsStream({
            ViewXml: view.ListViewXml,
            AddAllFields: true,
            AddRequiredFields: true,
            RenderOptions: 2,
          });

          const rows = Array.isArray(stream.Row) ? stream.Row : [];
          const ids = rows
            .map((row) => {
              const r = row as Record<string, unknown>;
              const idCandidates = [
                r.Id,
                r.ID,
                r.id,
                r["ID"],
                r["Id"],
                r["id"],
              ];
              const parsed = idCandidates
                .map((v) => Number(v))
                .find((n) => Number.isFinite(n) && n > 0);
              return parsed || 0;
            })
            .filter((id) => id > 0);

          if (!ids.length) return [];

          const fullItems = await Promise.all(
            ids.map(async (id) => {
              const item = (await list.items
                .getById(id)
                .select(
                  "Id",
                  VEH_FIELDS.Title,
                  VEH_FIELDS.SOAT,
                  VEH_FIELDS.Codigo,
                  VEH_FIELDS.Marca,
                  VEH_FIELDS.Modelo,
                  VEH_FIELDS.Capacidad,
                  VEH_FIELDS.CapacidadOtros,
                  VEH_FIELDS.Rampa,
                  VEH_FIELDS.LargoRampa,
                  VEH_FIELDS.AnchoRampa,
                  VEH_FIELDS.Bonificacion,
                  VEH_FIELDS.RielesLogisticos,
                  VEH_FIELDS.Propiedad,
                  VEH_FIELDS.Resolucion,
                  VEH_FIELDS.MedidasInternas,
                  VEH_FIELDS.MedidasExternas,
                  VEH_FIELDS.AlturaPiso,
                  VEH_FIELDS.PesoCargaUtil,
                  VEH_FIELDS.PesoBruto,
                  VEH_FIELDS.Temperatura,
                  VEH_FIELDS.TipoTemperatura,
                  VEH_FIELDS.TipoUnidad,
                  VEH_FIELDS.Activo,
                  VEH_FIELDS.Final,
                  VEH_FIELDS.Correos,
                  `${VEH_FIELDS.Proveedor}/Id`,
                  `${VEH_FIELDS.Proveedor}/Title`
                )
                .expand(VEH_FIELDS.Proveedor)()) as Record<string, unknown>;

              return mapVehiculoRow(item);
            })
          );

          return fullItems;
        };

        const loadClassic = async (): Promise<IVehiculoItemFull[]> => {
          let req = list.items.select(
            "Id",
            VEH_FIELDS.Title,
            VEH_FIELDS.SOAT,
            VEH_FIELDS.Codigo,
            VEH_FIELDS.Marca,
            VEH_FIELDS.Modelo,
            VEH_FIELDS.Capacidad,
            VEH_FIELDS.CapacidadOtros,
            VEH_FIELDS.Rampa,
            VEH_FIELDS.LargoRampa,
            VEH_FIELDS.AnchoRampa,
            VEH_FIELDS.Bonificacion,
            VEH_FIELDS.RielesLogisticos,
            VEH_FIELDS.Propiedad,
            VEH_FIELDS.Resolucion,
            VEH_FIELDS.MedidasInternas,
            VEH_FIELDS.MedidasExternas,
            VEH_FIELDS.AlturaPiso,
            VEH_FIELDS.PesoCargaUtil,
            VEH_FIELDS.PesoBruto,
            VEH_FIELDS.Temperatura,
            VEH_FIELDS.TipoTemperatura,
            VEH_FIELDS.TipoUnidad,
            VEH_FIELDS.Activo,
            VEH_FIELDS.Final,
            VEH_FIELDS.Correos,
            `${VEH_FIELDS.Proveedor}/Id`,
            `${VEH_FIELDS.Proveedor}/Title`
          ).expand(VEH_FIELDS.Proveedor);

          const filtros: string[] = [`${VEH_FIELDS.Activo} eq 1`];
          if (!includeFinalizados) {
            filtros.push(`${VEH_FIELDS.Final} eq 1`);
          }
          if ((Proveedor || !!Transportista) && empresaUsuarioId) {
            filtros.push(`${VEH_FIELDS.Proveedor}/Id eq ${empresaUsuarioId}`);
          }
          if (filtros.length > 0) {
            req = req.filter(filtros.join(" and "));
          }

          const items = (await req.top(500)()) as Array<Record<string, unknown>>;
          return items.map((it) => mapVehiculoRow(it));
        };

        let mapped: IVehiculoItemFull[] = [];
        const effectiveViewId = explicitViewId || selectedGridViewId;

        if (effectiveViewId) {
          try {
            mapped = await loadFromView(effectiveViewId);
          } catch (viewErr) {
            console.warn(
              "No se pudo leer la vista seleccionada, se usa la lectura clásica de la lista",
              viewErr
            );
            mapped = await loadClassic();
          }
        } else {
          mapped = await loadClassic();
        }

        let filtered = applyGridFilters(mapped, {
          ignoreEmpresaFilter: !!effectiveViewId,
        });

        if (loadSeq === loadVehiculosSeqRef.current) {
          _setVehiculos(filtered);
        }
      } catch (err) {
        if (loadSeq === loadVehiculosSeqRef.current) {
          _setVehiculos([]);
        }
        console.error("Error leyendo lista Vehiculos", err);
        alert("No se pudo cargar la lista de veh?culos.");
      }
  }, [
    sp,
    Proveedor,
    Transportista,
    empresaUsuarioId,
    vehiculosList,
    selectedGridViewId,
  ]);

  const onCancelar = React.useCallback((): void => {
    if (cargaPendiente) {
      const confirmRollback = window.confirm(
        "Si cancelás la carga, se eliminará el vehículo y la documentación que ya se guardó. ¿Querés continuar?"
      );
      if (!confirmRollback) return;

      setBusy(true);
      deleteVehiculoYCertificados(sp, cargaPendiente.placa)
        .then(() => {
          setCargaPendiente(null);
          resetFormulario("crear", { scrollTop: true });
          cargarVehiculos({ includeFinalizados: false }).catch((err) =>
            console.error(err)
          );
          if (isModalDriven) {
            notifyModalClose({ action: "cancelled" });
          }
        })
        .catch((err) => {
          console.error("No se pudo revertir la carga parcial", err);
          alert(
            "No se pudo revertir la carga parcial. Revisá la consola e intentá nuevamente."
          );
        })
        .finally(() => {
          setBusy(false);
        });
      return;
    }

    if (accion === "visualizar") {
      if (isModalDriven) {
        notifyModalClose({ action: "cancelled" });
        return;
      }

      resetFormulario("crear", { scrollTop: true });
      return;
    }

    if (isModalDriven) {
      notifyModalClose({ action: "cancelled" });
      return;
    }

    window.location.reload();
  }, [
    cargaPendiente,
    cargarVehiculos,
    deleteVehiculoYCertificados,
    accion,
    isModalDriven,
    notifyModalClose,
    resetFormulario,
    sp,
  ]);

  const handleRowDoubleClick = React.useCallback(
    async (veh: IVehiculoItemFull): Promise<void> => {
      setCargaPendiente(null);

      if (accion === "actualizar" && veh.Id && veh.Id > 0) {
        try {
          const current = (await sp.web.lists
            .getByTitle(vehiculosList)
            .items.getById(veh.Id)
            .select("Id", VEH_FIELDS.Final)()) as Record<string, unknown>;

          if (current && current[VEH_FIELDS.Final] === false) {
            alert(
              "El vehículo ya fue finalizado. Actualizá la grilla para ver el estado actual."
            );
            cargarVehiculos({ includeFinalizados: false }).catch((err) =>
              console.error(err)
            );
            return;
          }
        } catch (err) {
          console.error("No se pudo verificar el estado final del vehículo", err);
          alert(
            "No se pudo verificar el estado actual del vehículo. Intentá nuevamente."
          );
          return;
        }
      }

      selectionLockedRef.current = true;

      setVehiculo({
        Id: veh.Id,
        Title: veh.Title || "",
        Proveedor: veh.Proveedor || "",
        SOAT: veh.SOAT || "",
        CodigoInterno: veh.CodigoInterno || "",
        Placa: veh.Title || "",
        Codigo: veh.CodigoInterno || "",
        Marca: veh.Marca || "",
        Modelo: veh.Modelo || "",
        Capacidad: veh.Capacidad || "",
        Otros: veh.Otros || "",
        Rampa: !!veh.Rampa,
        LargoRampa: veh.LargoRampa || "",
        AnchoRampa: veh.AnchoRampa || "",
        Bonificacion: !!veh.Bonificacion,
        RielesLogisticos: !!veh.RielesLogisticos,
        Propiedad: !!veh.Propiedad,
        NroResolucion: veh.NroResolucion || "",
        MedidasInternas: veh.MedidasInternas || "",
        MedidasExternas: veh.MedidasExternas || "",
        AlturaPiso: veh.AlturaPiso || "",
        PesoCargaUtil: veh.PesoCargaUtil || "",
        PesoNeto: veh.PesoNeto || "",
        Temperatura: veh.Temperatura || "",
        TipoTemperatura: veh.TipoTemperatura || "",
        TipoUnidad: veh.TipoUnidad || "",
        Activo: veh.Activo !== false,
        CorreosNotificacion: cleanRichText(veh.CorreosNotificacion),
        Empresa: veh.Empresa || veh.Proveedor || "",
        EmpresaId: veh.EmpresaId,
      });

      try {
        const certRows = await getCertificadosListado(
          veh.Title || "",
          certificadosList
        );

        setDoc(() => {
          const next: DocStateLocal = {
            propFile: undefined,
            revTecDate: "",
            revTecText: "",
            revTecFile: undefined,
            resBonificacionFile: undefined,
            fumigacionDate: "",
            fumigacionFile: undefined,
            SanipesDate: "",
            SanipesText: "",
            sanipesFile: undefined,
            termokingDate: "",
            termokingFile: undefined,
            limpiezaDate: "",
            limpiezaFile: undefined,
          };

          const toYMD = (v?: string | undefined): string =>
            v ? new Date(v).toISOString().slice(0, 10) : "";

          for (const c of certRows) {
            const tipo = (c.tipo || "").toUpperCase();

            if (tipo.includes("TARJETA") && tipo.includes("PROPIEDAD")) {
              next.propFile = c.archivo
                ? { name: c.archivo, url: c.archivoUrl }
                : undefined;
            }

            if (
              tipo.includes("REVISI") &&
              (tipo.includes("TÉCN") || tipo.includes("TECN"))
            ) {
              next.revTecDate = toYMD(c.caducidad || undefined);
              next.revTecText =
                c.anio !== undefined && c.anio !== null ? String(c.anio) : "";
              next.revTecFile = c.archivo
                ? { name: c.archivo, url: c.archivoUrl }
                : undefined;
            }

            if (tipo.includes("FUMIG")) {
              next.fumigacionDate = dateOnly(c.emision || undefined);
              next.fumigacionFile = c.archivo
                ? { name: c.archivo, url: c.archivoUrl }
                : undefined;
            }

            if (tipo.includes("BONIFIC")) {
              next.resBonificacionFile = c.archivo
                ? { name: c.archivo, url: c.archivoUrl }
                : undefined;
            }

            if (tipo.includes("SANIPES")) {
              next.SanipesDate = dateOnly(
                c.resolucion || c.emision || undefined
              );
              next.SanipesText = c.expediente || "";
              next.sanipesFile = c.archivo
                ? { name: c.archivo, url: c.archivoUrl }
                : undefined;
            }

            if (tipo.includes("TERMO")) {
              next.termokingDate = dateOnly(c.emision || undefined);
              next.termokingFile = c.archivo
                ? { name: c.archivo, url: c.archivoUrl }
                : undefined;
            }

            if (
              tipo.includes("LIMPIEZA") ||
              tipo.includes("DESINFECCION") ||
              tipo.includes("DESINFECCIÓN")
            ) {
              next.limpiezaDate = dateOnly(c.emision || undefined);
              next.limpiezaFile = c.archivo
                ? { name: c.archivo, url: c.archivoUrl }
                : undefined;
            }
          }

          return next;
        });
      } catch (err) {
        console.error("Error cargando certificados", err);
        alert("No se pudo cargar la documentaci?n de este veh?culo.");
      }

      if (accion === "baja") {
        setModo("BAJA");
        setAccion("baja");
      } else if (accion === "visualizar") {
        setModo("VISUALIZAR");
        setAccion("visualizar");
      } else {
        setModo("MODIFICAR");
        setAccion("actualizar");
      }

      setValidationError(undefined);
    },
    [accion, cargarVehiculos, certificadosList, sp]
  );

  const hasValueUI = (v: DocFileValue): boolean => {
    if (!v) return false;
    if (v instanceof File) return true;
    if (typeof v === "string") return v.trim().length > 0;
    if (typeof v === "object" && "name" in v)
      return String((v as any).name || "").trim().length > 0;
    return false;
  };

  const missingDocsRequiredLabels = React.useMemo((): string[] => {
    if (accion === "baja" || accion === "visualizar") return [];
    if (Transportista) return []; // no se exige documentaci?n

    const missing: string[] = [];

    // Tarjeta de propiedad (siempre)
    if (!hasValueUI(doc.propFile)) missing.push("Tarjeta de propiedad");

    return missing;
  }, [Proveedor, accion, Transportista, doc, docsFlags]);

  const missingRequiredLabels = React.useMemo((): string[] => {
    if (accion === "baja" || accion === "visualizar") return [];

    const isLocked = (name: string): boolean =>
      (lockedFields || []).includes(name);

    const missing: string[] = [];
    const req = (
      value: unknown,
      label: string,
      lockedBy?: string | string[]
    ): void => {
      const keys = Array.isArray(lockedBy)
        ? lockedBy
        : lockedBy
        ? [lockedBy]
        : [];
      if (keys.some((k) => isLocked(k))) return;

      if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
      ) {
        missing.push(label);
      }
    };
    if (Proveedor) {
      req(vehiculo.EmpresaId, "Empresa", ["Empresa", "EmpresaId"]);
      req(vehiculo.Placa, "Placa", ["Placa", "Title"]);
      if (vehiculo.Placa && !isPlacaValid(vehiculo.Placa, placaPattern)) {
        missing.push("Placa");
      }
      req(vehiculo.Marca, "Marca", "Marca");
      req(vehiculo.Modelo, "Modelo", "Modelo");
      return missing;
    }

    // Empresa
    req(vehiculo.EmpresaId, "Empresa", ["Empresa", "EmpresaId"]);

    // Solo los campos obligatorios definidos para el formulario
    req(vehiculo.Marca, "Marca", "Marca");
    req(vehiculo.Modelo, "Modelo", "Modelo");

    req(vehiculo.Placa, "Placa", ["Placa", "Title"]);
    if (vehiculo.Placa && !isPlacaValid(vehiculo.Placa, placaPattern)) {
      missing.push("Placa");
    }
    return missing;
  }, [Proveedor, accion, vehiculo, lockedFields, placaPattern, showCodigoVehicular]);

  React.useEffect((): void => {
    if (accion === "baja" || accion === "visualizar") {
      setValidationError(undefined);
      return;
    }

    const allMissing = [...missingRequiredLabels, ...missingDocsRequiredLabels];

    if (allMissing.length > 0) {
      setValidationError(
        "Complet? los campos obligatorios: " + allMissing.join(", ")
      );
    } else {
      setValidationError(undefined);
    }
  }, [accion, missingRequiredLabels, missingDocsRequiredLabels]);

  return (
    <ThemeProvider theme={theme}>
      <div className={classes.root} aria-busy={busy}>
        <div ref={topRef} />
        {busy && (
          <div className={classes.overlay} role="alert" aria-live="assertive">
            <div className={classes.progressPanel}>
              <ProgressIndicator
                label={accion === "baja" ? "Procesando baja..." : "Guardando..."}
              />
            </div>
          </div>
        )}

        <Modal
          isOpen={!!errorModal}
          onDismiss={() => setErrorModal(null)}
          isBlocking={false}
        >
          <div style={errorModalStyles.container}>
            <div style={errorModalStyles.header}>
              <Icon iconName="StatusErrorFull" style={errorModalStyles.icon} />
              <div style={errorModalStyles.title}>
                {errorModal?.title || "Error"}
              </div>
            </div>
            <div style={errorModalStyles.body}>{errorModal?.message}</div>
            <div style={errorModalStyles.footer}>
              <PrimaryButton
                text="Cerrar"
                onClick={() => setErrorModal(null)}
                styles={secondaryButtonStyles}
              />
            </div>
          </div>
        </Modal>

        <div className={`${classes.page} ${busy ? classes.busyMask : ""}`}>
          <div className={classes.heroCard}>
            <div className={classes.heroHeader}>
              <div className={classes.heroIcon}>
                <Icon
                  iconName="Car"
                  styles={{ root: { fontSize: 24, color: theme.palette.white } }}
                />
              </div>
              <div>
                <div className={classes.heroTitle}>Vehiculo</div>
              </div>
            </div>
            {!isUrlDrivenEdit && showActionButtons && (
              <div className={classes.actions}>
                {mostrarIngresar && (
                  <ActionTile
                    icon="Add"
                    label="Ingresar"
                    selected={accion === "crear"}
                    disabled={busy}
                    onClick={onIngresarClick}
                  />
                )}

                {mostrarModificar && (
                  <ActionTile
                    icon="Edit"
                    label="Modificar"
                    selected={accion === "actualizar"}
                    disabled={busy}
                    onClick={(): void => {
                      setAccion("actualizar");
                      setModo("MODIFICAR");
                      cargarVehiculos({
                        includeFinalizados: false,
                        viewId: vehiculosViewModificacionId || "",
                      }).catch((e) => console.error(e));
                    }}
                  />
                )}

                {mostrarVisualizar && (
                  <ActionTile
                    icon="View"
                    label="Visualizar"
                    selected={accion === "visualizar"}
                    disabled={busy}
                    onClick={onVisualizarClick}
                  />
                )}

                {mostrarBaja && (
                  <ActionTile
                    icon="Delete"
                    label="Dar de baja"
                    selected={accion === "baja"}
                    disabled={busy}
                    onClick={(): void => {
                      setAccion("baja");
                      setModo("BAJA");
                      cargarVehiculos({
                        includeFinalizados: true,
                        viewId: vehiculosViewBajaId || "",
                      }).catch((e) => console.error(e));
                    }}
                  />
                )}
              </div>
            )}
          </div>

          {!isUrlDrivenEdit &&
            accion !== "crear" &&
            (modo === "MODIFICAR" ||
              modo === "BAJA" ||
              modo === "VISUALIZAR") && (
            <VehiculosGrid
              vehiculos={vehiculos}
              onRowDoubleClick={handleRowDoubleClick}
            />
          )}

          <DatosVehiculo
            vehiculo={vehiculo}
            setVehiculo={setVehiculo}
            disabled={busy || accion === "baja" || accion === "visualizar"}
            required={requiredVehicleFields}
            isChoice={(n: string): boolean =>
              ["Temperatura", "TipoTemperatura", "TipoUnidad"].includes(n)
            }
            isLookup={(_n: string): boolean => false}
            isNumber={(_n: string): boolean => false}
            choices={choices}
            lookups={{}}
            empresaBloqueada={empresaBloqueada}
            proveedor={Proveedor}
            bonificacionBloqueada={!!Transportista}
            lockedFields={lockedFields}
            proveedoresList={proveedoresList}
            proveedoresDisplayField={proveedoresDisplayField}
            proveedoresUserField={proveedoresUserField}
            placaFormat={placaFormat}
            alturaPisoHelpImageUrl={alturaPisoHelpImageUrl}
          />

          <DocumentacionLiteLocal
            doc={doc}
            setDoc={setDoc}
            showTermoking={docsFlags.showTermoking}
            showSanipes={docsFlags.showSanipes}
            showFumigacion={docsFlags.showFumigacion}
            showLimpieza={docsFlags.showLimpieza}
            showResBonificacion={docsFlags.showResBonificacion}
            disabled={accion === "visualizar"}
          />

          <Notificaciones
            vehiculo={vehiculo}
            setVehiculo={setVehiculo}
            disabled={busy || accion === "baja" || accion === "visualizar"}
          />

          {fechaError && accion !== "baja" && (
            <MessageBar
              messageBarType={MessageBarType.error}
              isMultiline={false}
            >
              {fechaError}
            </MessageBar>
          )}

          {cargaPendiente && accion !== "baja" && (
            <MessageBar messageBarType={MessageBarType.warning} isMultiline>
              Carga parcial: el vehículo ya quedó guardado. Completá la
              documentación faltante o usá "Cancelar carga" para revertirlo.
            </MessageBar>
          )}

          {validationError && accion !== "baja" && (
            <MessageBar messageBarType={MessageBarType.error} isMultiline>
              {validationError}
            </MessageBar>
          )}

          <div className={classes.footer}>
            {accion !== "visualizar" && (
              <PrimaryButton
                text={
                  cargaPendiente
                    ? "GUARDAR"
                    : accion === "baja"
                    ? "DAR DE BAJA"
                    : accion === "actualizar"
                    ? "GRABAR ACTUALIZACIÓN"
                    : "GUARDAR"
                }
                onClick={onGuardar}
                iconProps={{
                  iconName:
                    accion === "baja"
                      ? "Delete"
                      : accion === "actualizar"
                      ? "Save"
                      : "Save",
                }}
                disabled={
                  busy ||
                  (accion !== "baja" &&
                    (!!fechaError ||
                      missingRequiredLabels.length > 0 ||
                      missingDocsRequiredLabels.length > 0))
                }
                styles={primaryButtonStyles}
              />
            )}
            <DefaultButton
              text={
                accion === "visualizar"
                  ? "Cerrar"
                  : cargaPendiente
                  ? "Cancelar carga"
                  : "Cancelar"
              }
              onClick={onCancelar}
              iconProps={{ iconName: "Clear" }}
              disabled={busy}
              styles={secondaryButtonStyles}
            />
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default RegistroVehicular;
