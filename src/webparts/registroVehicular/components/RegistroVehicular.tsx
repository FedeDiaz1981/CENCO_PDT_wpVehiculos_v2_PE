import * as React from "react";
import { spfi, SPFI } from "@pnp/sp";
import { SPFx } from "@pnp/sp/presets/all";
import {
  ThemeProvider,
  PrimaryButton,
  DefaultButton,
  Modal,
  Icon,
  Spinner,
  SpinnerSize,
  TextField,
  Stack,
  Separator,
} from "@fluentui/react";
import { WebPartContext } from "@microsoft/sp-webpart-base";

import { classes, theme } from "../ui/styles";
import DatosVehiculo from "./sections/DatosVehiculo";
import { VehiculosGrid } from "./sections/VehiculosGrid";
import { DocCard } from "./atoms/DocCard";
import { LISTS, VEH_FIELDS } from "../services/fields";
import {
  saveCertificadosDeVehiculoSimple,
  getCertificadosListado,
  deleteCertificadosPorPlaca,
} from "../services/certificados.service";
import { IVehiculoItem } from "../services/vehiculos.service";
import { getEmpresaForCurrentUser } from "../services/proveedores.service";

type IVehiculoItemFull = IVehiculoItem & {
  Placa?: string;
  Marca?: string;
  Modelo?: string;
  Codigo?: string;
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

type DocFileValue = File | { name: string } | string | undefined;

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
    camión: {
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
    camión: {
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

  const getExistingName = (f: DocFileValue): string | undefined => {
    if (!f) return undefined;
    if (typeof f === "string") return f;
    if (typeof f === "object" && "name" in f) return String(f.name);
    return undefined;
  };

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
        <div className={classes.cardTitle}>2- Documentación</div>
      </div>
      <Separator />

      <div className={classes.docsGrid}>
        <div className={`${classes.docItem} ${classes.docLabelScope}`}>
          <DocCard
            title="Tarjeta de propiedad *"
            file={fileOut(doc.propFile)}
            existingFileName={getExistingName(doc.propFile)}
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
              title="Resolución de bonificación *"
              file={fileOut(doc.resBonificacionFile)}
              existingFileName={getExistingName(doc.resBonificacionFile)}
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
              title="Certificado de fumigación *"
              dateLabel="Fecha de emisión *"
              dateValue={doc.fumigacionDate || ""}
              onDateChange={
                disabled
                  ? undefined
                  : (value?: string) => setField("fumigacionDate")(value || "")
              }
              dateMax={todayStr}
              file={fileOut(doc.fumigacionFile)}
              existingFileName={getExistingName(doc.fumigacionFile)}
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
            title="Revisión técnica *"
            dateLabel="Fecha de vencimiento *"
            dateValue={doc.revTecDate || ""}
            onDateChange={
              disabled
                ? undefined
                : (value?: string) => setField("revTecDate")(value || "")
            }
            dateMin={todayStr}
            textLabel="Año de fabricación *"
            textValue={doc.revTecText ?? ""}
            onTextChange={
              disabled
                ? undefined
                : (v?: string) => setField("revTecText")(String(v ?? ""))
            }
            textAsDropdown
            textOptions={yearOptions}
            file={fileOut(doc.revTecFile)}
            existingFileName={getExistingName(doc.revTecFile)}
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
              dateLabel="Fecha de resolución de expediente"
              dateValue={doc.SanipesDate || ""}
              onDateChange={
                disabled
                  ? undefined
                  : (value?: string) => setField("SanipesDate")(value || "")
              }
              dateMax={todayStr}
              textLabel="N° de expediente"
              textValue={doc.SanipesText ?? ""}
              onTextChange={
                disabled
                  ? undefined
                  : (v?: string) => setField("SanipesText")(String(v ?? ""))
              }
              file={fileOut(doc.sanipesFile)}
              existingFileName={getExistingName(doc.sanipesFile)}
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
              title="Certificado de mantenimiento de termoking *"
              dateLabel="Fecha de emisión *"
              dateValue={doc.termokingDate || ""}
              onDateChange={
                disabled
                  ? undefined
                  : (value?: string) => setField("termokingDate")(value || "")
              }
              dateMax={todayStr}
              file={fileOut(doc.termokingFile)}
              existingFileName={getExistingName(doc.termokingFile)}
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
              title="Limpieza y desinfección *"
              dateLabel="Fecha de emisión *"
              dateValue={doc.limpiezaDate || ""}
              onDateChange={
                disabled
                  ? undefined
                  : (value?: string) => setField("limpiezaDate")(value || "")
              }
              dateMax={todayStr}
              file={fileOut(doc.limpiezaFile)}
              existingFileName={getExistingName(doc.limpiezaFile)}
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

const Notificaciones: React.FC<{
  vehiculo: NotificacionesVehiculo;
  setVehiculo: React.Dispatch<React.SetStateAction<IVehiculoItemFull>>;
  disabled?: boolean;
}> = ({ vehiculo, setVehiculo, disabled }) => {
  const value = vehiculo.CorreosNotificacion || "";
  return (
    <div className={classes.card}>
      <div className={classes.cardHeader}>
        <div className={classes.cardTitle}>Notificaciones</div>
      </div>

      <div style={{ padding: 16 }}>
        <Stack tokens={{ childrenGap: 12 }}>
          <Stack.Item grow>
            <TextField
              label="Correos de notificación"
              placeholder="correo1@dominio.com; correo2@dominio.com"
              value={value}
              onChange={(_, v) =>
                setVehiculo((s) => ({
                  ...s,
                  CorreosNotificacion: v || "",
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

const ActionTile: React.FC<{
  icon?: string;
  label: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}> = ({ label, selected, disabled, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        cursor: disabled ? "default" : "pointer",
        minWidth: 120,
        padding: "12px 16px",
        borderRadius: 8,
        border: selected ? "2px solid #0078d4" : "1px solid #ccc",
        background: selected ? "#eef6ff" : "#fff",
        fontWeight: selected ? 600 : 400,
      }}
    >
      {label}
    </button>
  );
};

type RegistroVehicularProps = {
  spContext: WebPartContext;
  vehiculosListTitle: string;
  proveedoresList: string;
  proveedoresDisplayField: string;
  proveedoresUserField: string;
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
    Proveedor,
    Transportista,
    proveedoresList,
    proveedoresDisplayField,
    proveedoresUserField,
    Borrar,
    alturaPisoHelpImageUrl,
    redireccion,
    urlRedireccion,
  } = _props;

  const sp = React.useMemo<SPFI>(
    () => spfi().using(SPFx(spContext)),
    [spContext]
  );

  const [accion, setAccion] = React.useState<"crear" | "actualizar" | "baja">(
    "crear"
  );
  const [modo, setModo] = React.useState<"INGRESAR" | "MODIFICAR" | "BAJA">(
    "INGRESAR"
  );
  const [vehiculos, _setVehiculos] = React.useState<IVehiculoItemFull[]>([]);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [vehiculo, setVehiculo] =
    React.useState<IVehiculoItemFull>(vehiculoInicial);
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
  const topRef = React.useRef<HTMLDivElement | null>(null);
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
          "La fecha de vencimiento de la revisión técnica no puede estar vencida.";
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
          "La fecha de emisión del certificado de fumigación no puede tener más de 6 meses de antigüedad.";
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
          "La fecha de emisión del certificado de termoking no puede tener más de 6 meses de antigüedad.";
      }
    }

    if (!errorMsg && doc.limpiezaDate) {
      const limpiezaD = new Date(doc.limpiezaDate);
      limpiezaD.setHours(0, 0, 0, 0);
      const diffDias =
        (hoy.getTime() - limpiezaD.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDias > 31) {
        errorMsg =
          "La fecha de emisión del certificado de limpieza y desinfección no puede tener más de un mes de antigüedad.";
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
        });

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
      nextAccion?: "crear" | "actualizar" | "baja",
      opts?: { scrollTop?: boolean }
    ): void => {
      if (nextAccion) {
        setAccion(nextAccion);
      }

      let baseVeh: IVehiculoItemFull = {
        ...vehiculoInicial,
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
        CorreosNotificacion: "",
      };

      if (empresaBloqueada && empresaUsuarioId) {
        baseVeh = { ...baseVeh, EmpresaId: empresaUsuarioId };
      }

      setVehiculo(baseVeh);
      setDoc({ ...docinicial });
      setValidationError(undefined);
      setFechaError(undefined);

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
    [empresaBloqueada, empresaUsuarioId]
  );

  const onIngresarClick = (): void => {
    resetFormulario("crear", { scrollTop: true });
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

  const deleteVehiculoYCertificados = React.useCallback(
    async (spLocal: SPFI, placa: string): Promise<void> => {
      await deleteCertificadosPorPlaca(placa);

      const list = spLocal.web.lists.getByTitle(LISTS.Vehiculos);
      const found = await list.items
        .select("Id")
        .filter(`${VEH_FIELDS.Title} eq '${placa.replace(/'/g, "''")}'`)
        .top(1)();

      const id = found?.[0]?.Id as number | undefined;
      if (id) {
        await list.items.getById(id).delete();
      }
    },
    []
  );

  const baseLockedFields = [
    "Empresa",
    "EmpresaId",
    "Placa",
    "Title",
    "Marca",
    "Modelo",
    "Codigo",
    "CodigoInterno",
  ];
  const lockedFields =
    accion === "actualizar" || !!Transportista ? baseLockedFields : [];

  const dateOnly = (v?: string | undefined): string => {
    if (!v) return "";
    const m = /^(\d{4}-\d{2}-\d{2})/.exec(v);
    if (m) return m[1];
    const d = new Date(v);
    return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
  };

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
            "Tenés que ingresar un motivo para poder dar de baja el vehículo."
          );
        }
      }

      try {
        setBusy(true);
        const placa = (vehiculo.Placa || "").trim();
        const vehList = sp.web.lists.getByTitle(LISTS.Vehiculos);

        if (Borrar) {
          if (vehiculo.Id) {
            await vehList.items
              .getById(vehiculo.Id)
              .update({ motivobaja: motivo });
          }
          await deleteVehiculoYCertificados(sp, placa);
          alert("Vehículo y certificados eliminados correctamente.");
        } else {
          if (!vehiculo.Id) {
            alert("No se encontró el Id del vehículo para dar de baja.");
          } else {
            await vehList.items.getById(vehiculo.Id).update({
              [VEH_FIELDS.Activo]: false,
              motivobaja: motivo,
            });
            alert("Vehículo dado de baja (marcado como inactivo).");
          }
        }
      } catch (err) {
        console.error("Error al dar de baja el vehículo", err);
        alert("Error al dar de baja el vehículo. Revisá consola.");
      } finally {
        setBusy(false);
      }
      return;
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
    req(vehiculo.SOAT, "SOAT", "SOAT");
    req(vehiculo.Codigo || vehiculo.CodigoInterno, "Código de unidad", [
      "Codigo",
      "CodigoInterno",
    ]);

    req(vehiculo.Capacidad, "Capacidad", "Capacidad");
    req(vehiculo.MedidasInternas, "Medida interna", "MedidasInternas");
    req(vehiculo.MedidasExternas, "Medida externa", "MedidasExternas");
    req(vehiculo.AlturaPiso, "Altura de piso a furgón", "AlturaPiso");
    req(vehiculo.PesoCargaUtil, "Peso útil", "PesoCargaUtil");
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

    // Solo exigir docs si NO es transportista (como ya venías haciendo)
    if (!Transportista) {
      // Tarjeta propiedad (siempre)
      if (!hasDocFile(doc.propFile)) erroresDocs.push("Tarjeta de propiedad");

      // Revisión técnica (siempre)
      if (!hasValueLocal(doc.revTecDate))
        erroresDocs.push("Fecha de vencimiento (Revisión técnica)");
      if (!hasValueLocal(doc.revTecText))
        erroresDocs.push("Año de fabricación (Revisión técnica)");
      if (!hasDocFile(doc.revTecFile))
        erroresDocs.push("Documento (Revisión técnica)");

      // Fumigación (cuando aplica)
      if (docsFlags.showFumigacion) {
        if (!hasValueLocal(doc.fumigacionDate))
          erroresDocs.push("Fecha de emisión (Fumigación)");
        if (!hasDocFile(doc.fumigacionFile))
          erroresDocs.push("Certificado de fumigación");
      }

      // Termoking (cuando aplica)  ✅ lo que pediste
      if (docsFlags.showTermoking) {
        if (!hasValueLocal(doc.termokingDate))
          erroresDocs.push("Fecha de emisión (Termoking)");
        if (!hasDocFile(doc.termokingFile))
          erroresDocs.push("Certificado de mantenimiento de termoking");
      }

      // Limpieza (cuando aplica)
      if (docsFlags.showLimpieza) {
        if (!hasValueLocal(doc.limpiezaDate))
          erroresDocs.push("Fecha de emisión (Limpieza y desinfección)");
        if (!hasDocFile(doc.limpiezaFile))
          erroresDocs.push("Certificado de limpieza y desinfección");
      }

      // Bonificación (cuando aplica)
      if (docsFlags.showResBonificacion) {
        if (!hasDocFile(doc.resBonificacionFile))
          erroresDocs.push("Resolución de bonificación");
      }

      // SANIPES NO obligatorio => no se valida
    }

    // =========================
    // CORTE SI HAY ERRORES (vehículo o docs)
    // =========================
    if (errores.length > 0 || erroresDocs.length > 0) {
      const partes: string[] = [];
      if (errores.length > 0) partes.push(errores.join(", "));
      if (erroresDocs.length > 0) partes.push(erroresDocs.join(", "));

      setValidationError(
        "Completá los campos obligatorios: " + partes.join(", ")
      );
      return;
    }

    setValidationError(undefined);

    // =========================
    // GUARDADO
    // =========================
    try {
      setBusy(true);

      const placa = (vehiculo.Placa || "").trim();
      let vehiculoGuardado = false;
      const item: Record<string, unknown> = {
        [VEH_FIELDS.Title]: vehiculo.Placa || "",
        [VEH_FIELDS.SOAT]: vehiculo.SOAT || "",
        [VEH_FIELDS.Codigo]: vehiculo.CodigoInterno || "",
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
        [VEH_FIELDS.Correos]: vehiculo.CorreosNotificacion || "",
      };

      if (vehiculo.EmpresaId && Number(vehiculo.EmpresaId) > 0) {
        item[`${VEH_FIELDS.Proveedor}Id`] = Number(vehiculo.EmpresaId);
      }

      const vehList = sp.web.lists.getByTitle(LISTS.Vehiculos);

      if (accion === "actualizar" && vehiculo.Id && vehiculo.Id > 0) {
        await vehList.items
          .getById(vehiculo.Id)
          .update(item as Record<string, unknown>);
      } else {
        await vehList.items.add(item as Record<string, unknown>);
      }
      vehiculoGuardado = true;

      if (!Transportista) {
        try {
          await saveCertificadosDeVehiculoSimple({ placa, doc, docsFlags });
        } catch (errDocs) {
          console.error("Error al guardar certificados", errDocs);
          if (vehiculoGuardado) {
            setErrorModal({
              title: "Guardado parcial",
              message:
                "El vehículo se guardó, pero hubo un error al guardar la documentación. Intentá nuevamente.",
            });
          }
          return;
        }
      }

      alert("Vehículo y certificados guardados correctamente.");

      if (redireccion && urlRedireccion && urlRedireccion.trim()) {
        redirectContainingPage(resolveRedirectUrl(urlRedireccion));
        return;
      }

      resetFormulario(undefined, { scrollTop: true });
    } catch (err) {
      console.error("Error al guardar vehículo o certificados", err);
      const raw = getErrorText(err);
      const placa = (vehiculo.Placa || "").trim();

      if (isDuplicatePlacaError(raw) && placa) {
        setErrorModal({
          title: "Error al guardar",
          message: `Error, no se puede hacer un doble registro de un vehículo con placa ${placa}.`,
        });
      } else {
        setErrorModal({
          title: "Error al guardar",
          message:
            "Ocurrió un error al guardar el vehículo. Verificá los datos e intentá nuevamente.",
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
    deleteVehiculoYCertificados,
    resetFormulario,
  ]);

  const onCancelar = React.useCallback((): void => {
    window.location.reload();
  }, []);

  const handleRowDoubleClick = React.useCallback(
    async (veh: IVehiculoItemFull): Promise<void> => {
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
        const certRows = await getCertificadosListado(veh.Title || "");

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
              next.propFile = c.archivo ? { name: c.archivo } : undefined;
            }

            if (
              tipo.includes("REVISI") &&
              (tipo.includes("TÉCN") || tipo.includes("TECN"))
            ) {
              next.revTecDate = toYMD(c.caducidad || undefined);
              next.revTecText =
                c.anio !== undefined && c.anio !== null ? String(c.anio) : "";
              next.revTecFile = c.archivo || undefined;
            }

            if (tipo.includes("FUMIG")) {
              next.fumigacionDate = dateOnly(c.emision || undefined);
              next.fumigacionFile = c.archivo || undefined;
            }

            if (tipo.includes("BONIFIC")) {
              next.resBonificacionFile = c.archivo || undefined;
            }

            if (tipo.includes("SANIPES")) {
              next.SanipesDate = dateOnly(
                c.resolucion || c.emision || undefined
              );
              next.SanipesText = c.expediente || "";
              next.sanipesFile = c.archivo || undefined;
            }

            if (tipo.includes("TERMO")) {
              next.termokingDate = dateOnly(c.emision || undefined);
              next.termokingFile = c.archivo || undefined;
            }

            if (
              tipo.includes("LIMPIEZA") ||
              tipo.includes("DESINFECCION") ||
              tipo.includes("DESINFECCIÓN")
            ) {
              next.limpiezaDate = dateOnly(c.emision || undefined);
              next.limpiezaFile = c.archivo || undefined;
            }
          }

          return next;
        });
      } catch (err) {
        console.error("Error cargando certificados", err);
        alert("No se pudo cargar la documentación de este vehículo.");
      }

      if (accion === "baja") {
        setModo("BAJA");
        setAccion("baja");
      } else {
        setModo("MODIFICAR");
        setAccion("actualizar");
      }

      setValidationError(undefined);
    },
    [accion]
  );

  const cargarVehiculos = React.useCallback(async (): Promise<void> => {
    try {
      let req = sp.web.lists
        .getByTitle(LISTS.Vehiculos)
        .items.select(
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
        .expand(VEH_FIELDS.Proveedor);

      const filtros: string[] = [`${VEH_FIELDS.Activo} eq 1`];
      if ((Proveedor || !!Transportista) && empresaUsuarioId) {
        filtros.push(`${VEH_FIELDS.Proveedor}/Id eq ${empresaUsuarioId}`);
      }
      if (filtros.length > 0) {
        req = req.filter(filtros.join(" and "));
      }

      const items = (await req.top(500)()) as Array<Record<string, unknown>>;

      const cleanHtml = (v: unknown): string =>
        String(v ?? "")
          .replace(/<[^>]*>/g, "")
          .replace(/&nbsp;/gi, " ")
          .trim();

      const mapped: IVehiculoItemFull[] = items.map((it) => {
        const anyIt = it as Record<string, unknown> & {
          Id?: number;
          Proveedor?: { Title?: string; Id?: number };
        };

        return {
          Id: Number(anyIt.Id || 0),
          Title: String(anyIt[VEH_FIELDS.Title] ?? ""),
          Proveedor: String(anyIt.Proveedor?.Title ?? ""),
          SOAT: String(anyIt[VEH_FIELDS.SOAT] ?? ""),
          CodigoInterno: String(anyIt[VEH_FIELDS.Codigo] ?? ""),
          Marca: String(anyIt[VEH_FIELDS.Marca] ?? ""),
          Modelo: String(anyIt[VEH_FIELDS.Modelo] ?? ""),
          Capacidad: String(anyIt[VEH_FIELDS.Capacidad] ?? ""),
          Otros: String(anyIt[VEH_FIELDS.CapacidadOtros] ?? ""),
          Rampa: anyIt[VEH_FIELDS.Rampa] === true,
          LargoRampa: String(anyIt[VEH_FIELDS.LargoRampa] ?? ""),
          AnchoRampa: String(anyIt[VEH_FIELDS.AnchoRampa] ?? ""),
          Bonificacion: anyIt[VEH_FIELDS.Bonificacion] === true,
          RielesLogisticos: anyIt[VEH_FIELDS.RielesLogisticos] === true,
          Propiedad: anyIt[VEH_FIELDS.Propiedad] === true,
          NroResolucion: String(anyIt[VEH_FIELDS.Resolucion] ?? ""),
          MedidasInternas: String(anyIt[VEH_FIELDS.MedidasInternas] ?? ""),
          MedidasExternas: String(anyIt[VEH_FIELDS.MedidasExternas] ?? ""),
          AlturaPiso: String(anyIt[VEH_FIELDS.AlturaPiso] ?? ""),
          PesoCargaUtil: String(anyIt[VEH_FIELDS.PesoCargaUtil] ?? ""),
          PesoNeto: String(anyIt[VEH_FIELDS.PesoBruto] ?? ""),
          Temperatura: String(anyIt[VEH_FIELDS.Temperatura] ?? ""),
          TipoTemperatura: String(anyIt[VEH_FIELDS.TipoTemperatura] ?? ""),
          TipoUnidad: String(anyIt[VEH_FIELDS.TipoUnidad] ?? ""),
          Activo: anyIt[VEH_FIELDS.Activo] !== false,
          CorreosNotificacion: cleanHtml(anyIt[VEH_FIELDS.Correos]),
          Empresa: String(anyIt.Proveedor?.Title ?? ""),
          EmpresaId: anyIt.Proveedor?.Id ?? undefined,
        };
      });

      _setVehiculos(mapped);
    } catch (err) {
      console.error("Error leyendo lista Vehiculos", err);
      alert("No se pudo cargar la lista de vehículos.");
    }
  }, [sp, Proveedor, Transportista, empresaUsuarioId]);

  const hasValueUI = (v: unknown): boolean =>
    v !== undefined && v !== null && String(v).trim() !== "";

  const hasDocFileUI = (v: DocFileValue): boolean => {
    if (!v) return false;
    if (v instanceof File) return true;
    if (typeof v === "string") return v.trim().length > 0;
    if (typeof v === "object" && "name" in v)
      return String((v as any).name || "").trim().length > 0;
    return false;
  };

  const missingDocsRequiredLabels = React.useMemo((): string[] => {
    if (accion === "baja") return [];
    if (Transportista) return []; // no se exige documentación

    const missing: string[] = [];

    // Tarjeta de propiedad (siempre)
    if (!hasDocFileUI(doc.propFile)) missing.push("Tarjeta de propiedad");

    // Revisión técnica (siempre)
    if (!hasValueUI(doc.revTecDate))
      missing.push("Fecha de vencimiento (Revisión técnica)");
    if (!hasValueUI(doc.revTecText))
      missing.push("Año de fabricación (Revisión técnica)");
    if (!hasDocFileUI(doc.revTecFile))
      missing.push("Documento (Revisión técnica)");

    // Fumigación (si aplica)
    if (docsFlags.showFumigacion) {
      if (!hasValueUI(doc.fumigacionDate))
        missing.push("Fecha de emisión (Fumigación)");
      if (!hasDocFileUI(doc.fumigacionFile))
        missing.push("Certificado de fumigación");
    }

    // Termoking (si aplica)
    if (docsFlags.showTermoking) {
      if (!hasValueUI(doc.termokingDate))
        missing.push("Fecha de emisión (Termoking)");
      if (!hasDocFileUI(doc.termokingFile))
        missing.push("Certificado de mantenimiento de termoking");
    }

    // Limpieza (si aplica)
    if (docsFlags.showLimpieza) {
      if (!hasValueUI(doc.limpiezaDate))
        missing.push("Fecha de emisión (Limpieza y desinfección)");
      if (!hasDocFileUI(doc.limpiezaFile))
        missing.push("Certificado de limpieza y desinfección");
    }

    // Bonificación (si aplica)
    if (docsFlags.showResBonificacion) {
      if (!hasDocFileUI(doc.resBonificacionFile))
        missing.push("Resolución de bonificación");
    }

    // SANIPES no obligatorio => no validar

    return missing;
  }, [accion, Transportista, doc, docsFlags]);

  const missingRequiredLabels = React.useMemo((): string[] => {
    if (accion === "baja") return [];

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

    // Empresa
    req(vehiculo.EmpresaId, "Empresa", ["Empresa", "EmpresaId"]);

    // Selecciones
    req(vehiculo.Temperatura, "Temperatura", "Temperatura");
    req(vehiculo.TipoUnidad, "Tipo de unidad", "TipoUnidad");

    if (
      (vehiculo.Temperatura || "").trim().toLowerCase() === "con temperatura"
    ) {
      req(vehiculo.TipoTemperatura, "Tipo temperatura", "TipoTemperatura");
    }

    // Marca / Modelo
    req(vehiculo.Marca, "Marca", "Marca");
    req(vehiculo.Modelo, "Modelo", "Modelo");

    req(vehiculo.Placa, "Placa", ["Placa", "Title"]);
    req(vehiculo.SOAT, "SOAT", "SOAT");
    req(vehiculo.Codigo || vehiculo.CodigoInterno, "Código de unidad", [
      "Codigo",
      "CodigoInterno",
    ]);
    req(vehiculo.Capacidad, "Capacidad", "Capacidad");
    req(vehiculo.MedidasInternas, "Medida interna", "MedidasInternas");
    req(vehiculo.MedidasExternas, "Medida externa", "MedidasExternas");
    req(vehiculo.AlturaPiso, "Altura de piso a furgón", "AlturaPiso");
    req(vehiculo.PesoCargaUtil, "Peso útil", "PesoCargaUtil");
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

    return missing;
  }, [accion, vehiculo, lockedFields]);

  React.useEffect((): void => {
    if (accion === "baja") {
      setValidationError(undefined);
      return;
    }

    const allMissing = [...missingRequiredLabels, ...missingDocsRequiredLabels];

    if (allMissing.length > 0) {
      setValidationError(
        "Completá los campos obligatorios: " + allMissing.join(", ")
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
            <Spinner label="Guardando..." size={SpinnerSize.large} />
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
              />
            </div>
          </div>
        </Modal>

        <div className={`${classes.page} ${busy ? classes.busyMask : ""}`}>
          <div className={classes.actions}>
            <ActionTile
              label="Ingresar"
              selected={accion === "crear"}
              disabled={busy}
              onClick={onIngresarClick}
            />

            <ActionTile
              label="Modificar"
              selected={accion === "actualizar"}
              disabled={busy}
              onClick={(): void => {
                setAccion("actualizar");
                setModo("MODIFICAR");
                cargarVehiculos().catch((e) => console.error(e));
              }}
            />

            <ActionTile
              label="Dar de baja"
              selected={accion === "baja"}
              disabled={busy}
              onClick={(): void => {
                setAccion("baja");
                setModo("BAJA");
                cargarVehiculos().catch((e) => console.error(e));
              }}
            />
          </div>

          {accion !== "crear" && (modo === "MODIFICAR" || modo === "BAJA") && (
            <VehiculosGrid
              vehiculos={vehiculos}
              onRowDoubleClick={handleRowDoubleClick}
            />
          )}

          <DatosVehiculo
            vehiculo={vehiculo}
            setVehiculo={setVehiculo}
            disabled={busy || accion === "baja"}
            required={{
              EmpresaId: true,
              Temperatura: true,
              TipoUnidad: true,
              TipoTemperatura: true,

              Placa: true,
              SOAT: true,
              CodigoInterno: true,
              Marca: true,
              Modelo: true,

              Capacidad: true,
              Otros: true,
              MedidasInternas: true,
              MedidasExternas: true,
              AlturaPiso: true,
              PesoCargaUtil: true,
              PesoNeto: true,

              // NO forzar toggles:
              // Bonificacion: false,
              // NroResolucion: false,
              // Rampa: false,
              // LargoRampa: false,
              // AnchoRampa: false,
            }}
            isChoice={(n: string): boolean =>
              ["Temperatura", "TipoTemperatura", "TipoUnidad"].includes(n)
            }
            isLookup={(_n: string): boolean => false}
            isNumber={(_n: string): boolean => false}
            choices={choices}
            lookups={{}}
            empresaBloqueada={empresaBloqueada}
            bonificacionBloqueada={!!Transportista}
            lockedFields={lockedFields}
            proveedoresList={proveedoresList}
            proveedoresDisplayField={proveedoresDisplayField}
            proveedoresUserField={proveedoresUserField}
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
            disabled={!!Transportista}
          />

          <Notificaciones
            vehiculo={vehiculo}
            setVehiculo={setVehiculo}
            disabled={busy || accion === "baja"}
          />

          {fechaError && accion !== "baja" && (
            <div style={{ color: "red", marginTop: 12, fontWeight: 600 }}>
              {fechaError}
            </div>
          )}

          {validationError && accion !== "baja" && (
            <div style={{ color: "red", marginTop: 8, fontWeight: 600 }}>
              {validationError}
            </div>
          )}

          <div className={classes.footer}>
            <PrimaryButton
              text={
                accion === "baja"
                  ? "DAR DE BAJA"
                  : accion === "actualizar"
                  ? "GRABAR ACTUALIZACIÓN"
                  : "GUARDAR"
              }
              onClick={onGuardar}
              disabled={
                busy ||
                (accion !== "baja" &&
                  (!!fechaError ||
                    missingRequiredLabels.length > 0 ||
                    missingDocsRequiredLabels.length > 0))
              }
            />
            <DefaultButton
              text="Cancelar"
              onClick={onCancelar}
              disabled={busy}
            />
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default RegistroVehicular;
