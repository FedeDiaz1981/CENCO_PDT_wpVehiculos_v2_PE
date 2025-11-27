import * as React from "react";
import { spfi, SPFI } from "@pnp/sp";
import { SPFx } from "@pnp/sp/presets/all";
import {
  ThemeProvider,
  PrimaryButton,
  DefaultButton,
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
  ICertificadoItem,
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

type DocStateLocal = {
  propFile?: any;
  revTecDate?: string;
  revTecText?: string;
  revTecFile?: any;
  resBonificacionFile?: any;
  fumigacionDate?: string;
  fumigacionFile?: any;
  SanipesDate?: string;
  SanipesText?: string;
  sanipesFile?: any;
  termokingDate?: string;
  termokingFile?: any;
  limpiezaDate?: string;
  limpiezaFile?: any;
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
  propFile: null,
  resBonificacionFile: null,
  fumigacionFile: null,
  revTecFile: null,
  revTecText: "",
  sanipesFile: null,
  SanipesText: "",
  termokingFile: null,
  limpiezaFile: null,
};

const DOC_MATRIX: Record<
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

function getDocumentosVisibles(vehiculo: {
  Temperatura?: string;
  TipoUnidad?: string;
  Bonificacion?: boolean;
}) {
  const tempRaw = (vehiculo.Temperatura || "").trim().toLowerCase();
  const tempKey: "con temperatura" | "seco" =
    tempRaw === "con temperatura" ? "con temperatura" : "seco";

  const unidadRaw = (vehiculo.TipoUnidad || "").trim().toLowerCase();
  let unidadKey: "camión" | "tracto" | "carreta" = "camión";
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
  const setField =
    <K extends keyof DocStateLocal>(k: K) =>
    (v: DocStateLocal[K]) => {
      if (disabled) return;
      setDoc((s) => ({ ...s, [k]: v }));
    };

  const fileOut = (f: any): File | undefined =>
    f instanceof File ? f : undefined;

  const yearOptions = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    const arr: { key: string; text: string }[] = [];
    for (let y = currentYear; y >= 1980; y--) {
      arr.push({ key: String(y), text: String(y) });
    }
    return arr;
  }, []);

  const getExistingName = (f: any): string | undefined => {
    if (!f) return undefined;
    if (typeof f === "string") return f;
    if (typeof f === "object" && f.name) return String(f.name);
    return undefined;
  };

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
        {/* Tarjeta de propiedad (OBLIGATORIO) */}
        <div className={`${classes.docItem} ${classes.docLabelScope}`}>
          <DocCard
            title="Tarjeta de propiedad *"
            file={fileOut(doc.propFile)}
            existingFileName={getExistingName(doc.propFile)}
            onFileChange={disabled ? undefined : (f) => setField("propFile")(f)}
          />
        </div>

        {/* Resolución de bonificación (OBLIGATORIO cuando se muestra) */}
        {showResBonificacion && (
          <div className={`${classes.docItem} ${classes.docLabelScope}`}>
            <DocCard
              title="Resolución de bonificación *"
              file={fileOut(doc.resBonificacionFile)}
              existingFileName={
                typeof doc.resBonificacionFile === "string"
                  ? doc.resBonificacionFile
                  : undefined
              }
              onFileChange={
                disabled ? undefined : (f) => setField("resBonificacionFile")(f)
              }
            />
          </div>
        )}

        {/* Certificado de fumigación (OBLIGATORIO cuando se muestra) */}
        {showFumigacion && (
          <div className={`${classes.docItem} ${classes.docLabelScope}`}>
            <DocCard
              title="Certificado de fumigación *"
              dateLabel="Fecha de emisión *"
              dateValue={doc.fumigacionDate || ""}
              onDateChange={
                disabled
                  ? undefined
                  : (value) => setField("fumigacionDate")(value || "")
              }
              file={fileOut(doc.fumigacionFile)}
              existingFileName={
                typeof doc.fumigacionFile === "string"
                  ? doc.fumigacionFile
                  : undefined
              }
              onFileChange={
                disabled ? undefined : (f) => setField("fumigacionFile")(f)
              }
            />
          </div>
        )}

        {/* Revisión técnica (OBLIGATORIO) */}
        <div className={`${classes.docItem} ${classes.docLabelScope}`}>
          <DocCard
            title="Revisión técnica *"
            dateLabel="Fecha de vencimiento *"
            dateValue={doc.revTecDate || ""}
            onDateChange={
              disabled
                ? undefined
                : (value) => setField("revTecDate")(value || "")
            }
            textLabel="Año de fabricación *"
            textValue={doc.revTecText ?? ""}
            onTextChange={
              disabled
                ? undefined
                : (v) => setField("revTecText")(String(v ?? ""))
            }
            textAsDropdown
            textOptions={yearOptions}
            file={fileOut(doc.revTecFile)}
            existingFileName={
              typeof doc.revTecFile === "string" ? doc.revTecFile : undefined
            }
            onFileChange={
              disabled ? undefined : (f) => setField("revTecFile")(f)
            }
          />
        </div>

        {/* SANIPES (NO obligatorio) */}
        {showSanipes && (
          <div className={`${classes.docItem} ${classes.docLabelScope}`}>
            <DocCard
              title="SANIPES"
              dateLabel="Fecha de resolución de expediente"
              dateValue={doc.SanipesDate || ""}
              onDateChange={
                disabled
                  ? undefined
                  : (value) => setField("SanipesDate")(value || "")
              }
              textLabel="N° de expediente"
              textValue={doc.SanipesText ?? ""}
              onTextChange={
                disabled
                  ? undefined
                  : (v) => setField("SanipesText")(String(v ?? ""))
              }
              file={fileOut(doc.sanipesFile)}
              existingFileName={
                typeof doc.sanipesFile === "string"
                  ? doc.sanipesFile
                  : undefined
              }
              onFileChange={
                disabled ? undefined : (f) => setField("sanipesFile")(f)
              }
            />
          </div>
        )}

        {/* Termoking (OBLIGATORIO cuando se muestra) */}
        {showTermoking && (
          <div className={`${classes.docItem} ${classes.docLabelScope}`}>
            <DocCard
              title="Certificado de mantenimiento de termoking *"
              dateLabel="Fecha de emisión *"
              dateValue={doc.termokingDate || ""}
              onDateChange={
                disabled
                  ? undefined
                  : (value) => setField("termokingDate")(value || "")
              }
              file={fileOut(doc.termokingFile)}
              existingFileName={
                typeof doc.termokingFile === "string"
                  ? doc.termokingFile
                  : undefined
              }
              onFileChange={
                disabled ? undefined : (f) => setField("termokingFile")(f)
              }
            />
          </div>
        )}

        {/* Limpieza y desinfección (OBLIGATORIO cuando se muestra) */}
        {showLimpieza && (
          <div className={`${classes.docItem} ${classes.docLabelScope}`}>
            <DocCard
              title="Limpieza y desinfección *"
              dateLabel="Fecha de emisión *"
              dateValue={doc.limpiezaDate || ""}
              onDateChange={
                disabled
                  ? undefined
                  : (value) => setField("limpiezaDate")(value || "")
              }
              file={fileOut(doc.limpiezaFile)}
              existingFileName={
                typeof doc.limpiezaFile === "string"
                  ? doc.limpiezaFile
                  : undefined
              }
              onFileChange={
                disabled ? undefined : (f) => setField("limpiezaFile")(f)
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};

const Notificaciones: React.FC<{
  vehiculo: any;
  setVehiculo: React.Dispatch<React.SetStateAction<any>>;
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
                setVehiculo((s: any) => ({
                  ...(s || {}),
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

const RegistroVehicular: React.FC<{
  spContext: WebPartContext;
  vehiculosListTitle: string;
  proveedoresList: string;
  proveedoresDisplayField: string;
  proveedoresUserField: string;
  Proveedor: boolean;
  Distribuidor: boolean;
  Coordinador: boolean;
  Transportista?: boolean;
  // true  => borra registro
  // false => marca Activo = false
  Borrar?: boolean;
}> = (_props) => {
  const {
    spContext,
    Proveedor,
    Transportista,
    proveedoresList,
    proveedoresDisplayField,
    proveedoresUserField,
    Borrar,
  } = _props;

  const sp = React.useMemo<SPFI>(() => {
    return spfi().using(SPFx(spContext));
  }, [spContext]);

  const [accion, setAccion] = React.useState<"crear" | "actualizar" | "baja">(
    "crear"
  );
  const [modo, setModo] = React.useState<"INGRESAR" | "MODIFICAR" | "BAJA">(
    "INGRESAR"
  );
  const [vehiculos, _setVehiculos] = React.useState<IVehiculoItemFull[]>([]);
  const [_selectedVehiculo, setSelectedVehiculo] =
    React.useState<IVehiculoItem | null>(null);
  const [_certificadosVehiculo, setCertificadosVehiculo] = React.useState<
    ICertificadoItem[]
  >([]);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [vehiculo, setVehiculo] =
    React.useState<IVehiculoItemFull>(vehiculoInicial);
  const [empresaBloqueada, setEmpresaBloqueada] =
    React.useState<boolean>(false);
  const [empresaUsuarioId, setEmpresaUsuarioId] = React.useState<number | null>(
    null
  );

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

  const [fechaError, setFechaError] = React.useState<string | null>(null);
  const [validationError, setValidationError] = React.useState<string | null>(
    null
  );

  // Validaciones de fechas (se calculan, pero luego se ignoran en modo baja)
  React.useEffect(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let errorMsg: string | null = null;

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
      const termoking = new Date(doc.termokingDate);
      termoking.setHours(0, 0, 0, 0);
      const diffMeses =
        (hoy.getFullYear() - termoking.getFullYear()) * 12 +
        (hoy.getMonth() - termoking.getMonth());
      if (diffMeses > 6) {
        errorMsg =
          "La fecha de emisión del certificado de termoking no puede tener más de 6 meses de antigüedad.";
      }
    }

    if (!errorMsg && doc.limpiezaDate) {
      const limpieza = new Date(doc.limpiezaDate);
      limpieza.setHours(0, 0, 0, 0);
      const diffDias =
        (hoy.getTime() - limpieza.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDias > 31) {
        errorMsg =
          "La fecha de emisión del certificado de limpieza y desinfección no puede tener más de un mes de antigüedad.";
      }
    }

    setFechaError(errorMsg);
  }, [doc.revTecDate, doc.fumigacionDate, doc.termokingDate, doc.limpiezaDate]);

  // Resolución automática de Empresa cuando el usuario es Proveedor/Transportista
  React.useEffect(() => {
    const run = async () => {
      const debeForzar = Proveedor || Transportista;
      if (!debeForzar) {
        setEmpresaBloqueada(false);
        setEmpresaUsuarioId(null);
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
          setEmpresaUsuarioId(null);
        }
      } catch (err) {
        console.error("No se pudo resolver la empresa del usuario", err);
        setEmpresaBloqueada(false);
        setEmpresaUsuarioId(null);
      }
    };

    void run();
  }, [
    Proveedor,
    Transportista,
    proveedoresList,
    proveedoresDisplayField,
    proveedoresUserField,
  ]);

  const onIngresarClick = () => {
    setAccion("crear");

    let baseVeh = {
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
    } as IVehiculoItemFull;

    if (empresaBloqueada && empresaUsuarioId) {
      baseVeh = {
        ...baseVeh,
        EmpresaId: empresaUsuarioId,
      };
    }

    setVehiculo(baseVeh);
    setDoc({ ...docinicial });
    setSelectedVehiculo(null);
    setValidationError(null);
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

  const docsFlags = React.useMemo(() => {
    return getDocumentosVisibles({
      Temperatura: vehiculo.Temperatura,
      TipoUnidad: vehiculo.TipoUnidad,
      Bonificacion: vehiculo.Bonificacion,
    });
  }, [vehiculo.Temperatura, vehiculo.TipoUnidad, vehiculo.Bonificacion]);

  async function deleteVehiculoYCertificados(
    sp: SPFI,
    placa: string
  ): Promise<void> {
    await deleteCertificadosPorPlaca(placa);

    const list = sp.web.lists.getByTitle(LISTS.Vehiculos);
    const found = await list.items
      .select("Id")
      .filter(`${VEH_FIELDS.Title} eq '${placa.replace(/'/g, "''")}'`)
      .top(1)();
    if (found?.[0]?.Id) {
      await list.items.getById(found[0].Id).delete();
    }
  }

  const onGuardar = React.useCallback(async () => {
    // SI LA ACCIÓN ES "baja", NO VALIDAMOS CAMPOS NI FECHAS
    if (accion === "baja") {
      // Pedimos motivo y no dejamos continuar si está vacío
      let motivo: string | null = "";
      while (true) {
        motivo = window.prompt("Motivo de la baja:", motivo || "");
        if (motivo === null) {
          // usuario canceló -> no hacemos nada
          return;
        }
        if (motivo.trim()) {
          motivo = motivo.trim();
          break;
        }
        alert(
          "Tenés que ingresar un motivo para poder dar de baja el vehículo."
        );
      }

      try {
        setBusy(true);
        const placa = (vehiculo.Placa || "").trim();
        const vehList = sp.web.lists.getByTitle(LISTS.Vehiculos);

        if (Borrar) {
          // Primero guardamos el motivo en el registro, luego borramos
          if (vehiculo.Id) {
            await vehList.items.getById(vehiculo.Id).update({
              motivobaja: motivo,
            });
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

    // Validación de campos obligatorios (crear / actualizar)
    const errores: string[] = [];
    const req = (value: any, label: string) => {
      if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
      ) {
        errores.push(label);
      }
    };

    req(vehiculo.Placa, "Placa");
    req(vehiculo.SOAT, "SOAT");
    req(vehiculo.Codigo || vehiculo.CodigoInterno, "Código de unidad");
    req(vehiculo.Capacidad, "Capacidad");
    req(vehiculo.MedidasInternas, "Medida interna");
    req(vehiculo.MedidasExternas, "Medida externa");
    req(vehiculo.AlturaPiso, "Altura de piso");
    req(vehiculo.PesoCargaUtil, "Peso útil");
    req(vehiculo.PesoNeto, "Peso bruto");

    if (
      vehiculo.Capacidad &&
      vehiculo.Capacidad.toLowerCase().includes("otro")
    ) {
      req(vehiculo.Otros, "Capacidad otros");
    }

    if (vehiculo.Rampa) {
      req(vehiculo.LargoRampa, "Largo de rampa");
      req(vehiculo.AnchoRampa, "Ancho de rampa");
    }

    if (errores.length > 0) {
      setValidationError(
        "Completá los campos obligatorios: " + errores.join(", ")
      );
      return;
    } else {
      setValidationError(null);
    }

    try {
      setBusy(true);

      const placa = (vehiculo.Placa || "").trim();

      const item: Record<string, any> = {
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
      delete item[VEH_FIELDS.Proveedor];

      const vehList = sp.web.lists.getByTitle(LISTS.Vehiculos);

      if (accion === "actualizar" && vehiculo.Id && vehiculo.Id > 0) {
        await vehList.items.getById(vehiculo.Id).update(item);
      } else {
        await vehList.items.add(item);
      }

      await saveCertificadosDeVehiculoSimple({
        placa,
        doc,
        docsFlags,
      });

      alert("Vehículo y certificados guardados correctamente.");
    } catch (err) {
      console.error("Error al guardar vehículo o certificados", err);
      alert("Error al guardar. Revisá consola.");
    } finally {
      setBusy(false);
    }
  }, [accion, vehiculo, doc, docsFlags, sp, Borrar]);

  const onCancelar = React.useCallback(() => {
    window.location.reload();
  }, []);

  const dateOnly = (v?: string | null): string => {
    if (!v) return "";
    const m = /^(\d{4}-\d{2}-\d{2})/.exec(v);
    if (m) return m[1];
    const d = new Date(v);
    return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
  };

  const handleRowDoubleClick = React.useCallback(
    async (veh: IVehiculoItemFull) => {
      setSelectedVehiculo(veh);

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

        setCertificadosVehiculo(
          certRows.map((r) => ({
            Id: r.id,
            Title: veh.Title || "",
            tipoCert: r.tipo,
            FechaVencimiento: r.emision || r.resolucion || "",
            NumeroDocumento: r.expediente || r.anio?.toString() || "",
          })) as any as ICertificadoItem[]
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

          const toYMD = (v?: string | null) =>
            v ? new Date(v).toISOString().slice(0, 10) : "";

          for (const c of certRows) {
            const tipo = (c.tipo || "").toUpperCase();

            if (tipo.includes("TARJETA") && tipo.includes("PROPIEDAD")) {
              next.propFile = c.archivo ? { name: c.archivo } : undefined;
            }

            if (tipo.includes("REVISI") && tipo.includes("TÉCN")) {
              next.revTecDate = toYMD(c.caducidad);
              next.revTecText =
                (c.anio !== null && c.anio !== undefined
                  ? String(c.anio)
                  : "") || "";
              next.revTecFile = c.archivo || undefined;
            }

            if (tipo.includes("FUMIG")) {
              next.fumigacionDate = dateOnly(c.emision || "");
              next.fumigacionFile = c.archivo || undefined;
            }

            if (tipo.includes("BONIFIC")) {
              next.resBonificacionFile = c.archivo || undefined;
            }

            if (tipo.includes("SANIPES")) {
              next.SanipesDate = dateOnly(c.resolucion || c.emision || "");
              next.SanipesText = c.expediente || "";
              next.sanipesFile = c.archivo || undefined;
            }

            if (tipo.includes("TERMO")) {
              next.termokingDate = dateOnly(c.emision || "");
              next.termokingFile = c.archivo || undefined;
            }

            if (
              tipo.includes("LIMPIEZA") ||
              tipo.includes("DESINFECCION") ||
              tipo.includes("DESINFECCIÓN")
            ) {
              next.limpiezaDate = dateOnly(c.emision || "");
              next.limpiezaFile = c.archivo || undefined;
            }
          }

          return next;
        });
      } catch (err) {
        console.error("Error cargando certificados", err);
        alert("No se pudo cargar la documentación de este vehículo.");
      }

      // acá la diferencia:
      if (accion === "baja") {
        setModo("BAJA");
        setAccion("baja");
      } else {
        setModo("MODIFICAR");
        setAccion("actualizar");
      }

      setValidationError(null);
    },
    [
      accion,
      setSelectedVehiculo,
      setVehiculo,
      setCertificadosVehiculo,
      setDoc,
      setModo,
      setAccion,
    ]
  );

  const cargarVehiculos = React.useCallback(async () => {
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

      // Filtros: sólo activos y, si aplica, por proveedor del usuario
      const filtros: string[] = [`${VEH_FIELDS.Activo} eq 1`];

      if ((Proveedor || Transportista) && empresaUsuarioId) {
        filtros.push(`${VEH_FIELDS.Proveedor}/Id eq ${empresaUsuarioId}`);
      }

      if (filtros.length > 0) {
        req = req.filter(filtros.join(" and "));
      }

      const items = (await req.top(500)()) as Array<{
        Id: number;
        [VEH_FIELDS.Title]?: string;
        [VEH_FIELDS.SOAT]?: string;
        [VEH_FIELDS.Codigo]?: string;
        [VEH_FIELDS.Marca]?: string;
        [VEH_FIELDS.Modelo]?: string;
        [VEH_FIELDS.Capacidad]?: string;
        [VEH_FIELDS.CapacidadOtros]?: string;
        [VEH_FIELDS.Rampa]?: boolean;
        [VEH_FIELDS.LargoRampa]?: string;
        [VEH_FIELDS.AnchoRampa]?: string;
        [VEH_FIELDS.Bonificacion]?: boolean;
        [VEH_FIELDS.Resolucion]?: string;
        [VEH_FIELDS.MedidasInternas]?: string;
        [VEH_FIELDS.MedidasExternas]?: string;
        [VEH_FIELDS.AlturaPiso]?: string;
        [VEH_FIELDS.PesoCargaUtil]?: string;
        [VEH_FIELDS.PesoBruto]?: string;
        [VEH_FIELDS.Temperatura]?: string;
        [VEH_FIELDS.TipoTemperatura]?: string;
        [VEH_FIELDS.TipoUnidad]?: string;
        [VEH_FIELDS.Activo]?: boolean;
        [VEH_FIELDS.Correos]?: string;
        Proveedor?: {
          Id: number;
          Title: string;
        };
      }>;

      const cleanHtml = (v: any) =>
        String(v ?? "")
          .replace(/<[^>]*>/g, "")
          .replace(/&nbsp;/gi, " ")
          .trim();

      const mapped: IVehiculoItemFull[] = items.map((it) => ({
        Id: it.Id,
        Title: it[VEH_FIELDS.Title] ?? "",
        Proveedor: it.Proveedor?.Title ?? "",
        SOAT: it[VEH_FIELDS.SOAT] ?? "",
        CodigoInterno: it[VEH_FIELDS.Codigo] ?? "",
        Marca: it[VEH_FIELDS.Marca] ?? "",
        Modelo: it[VEH_FIELDS.Modelo] ?? "",
        Capacidad: it[VEH_FIELDS.Capacidad] ?? "",
        Otros: it[VEH_FIELDS.CapacidadOtros] ?? "",
        Rampa: it[VEH_FIELDS.Rampa] === true,
        LargoRampa: it[VEH_FIELDS.LargoRampa] ?? "",
        AnchoRampa: it[VEH_FIELDS.AnchoRampa] ?? "",
        Bonificacion: it[VEH_FIELDS.Bonificacion] === true,
        NroResolucion: it[VEH_FIELDS.Resolucion] ?? "",
        MedidasInternas: it[VEH_FIELDS.MedidasInternas] ?? "",
        MedidasExternas: it[VEH_FIELDS.MedidasExternas] ?? "",
        AlturaPiso: it[VEH_FIELDS.AlturaPiso] ?? "",
        PesoCargaUtil: it[VEH_FIELDS.PesoCargaUtil] ?? "",
        PesoNeto: it[VEH_FIELDS.PesoBruto] ?? "",
        Temperatura: it[VEH_FIELDS.Temperatura] ?? "",
        TipoTemperatura: it[VEH_FIELDS.TipoTemperatura] ?? "",
        TipoUnidad: it[VEH_FIELDS.TipoUnidad] ?? "",
        Activo: it[VEH_FIELDS.Activo] !== false,
        CorreosNotificacion: cleanHtml(it[VEH_FIELDS.Correos]),
        Empresa: it.Proveedor?.Title ?? "",
        EmpresaId: it.Proveedor?.Id ?? undefined,
      }));

      _setVehiculos(mapped);
    } catch (err) {
      console.error("Error leyendo lista Vehiculos", err);
      alert("No se pudo cargar la lista de vehículos.");
    }
  }, [sp, _setVehiculos, Proveedor, Transportista, empresaUsuarioId]);

  // >>> CAMBIO AQUÍ: lista base + condición que incluye Transportista en crear <<<
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
  // <<< FIN DE CAMBIO >>>

  return (
    <ThemeProvider theme={theme}>
      <div className={classes.root} aria-busy={busy}>
        {busy && (
          <div className={classes.overlay} role="alert" aria-live="assertive">
            <Spinner label="Guardando..." size={SpinnerSize.large} />
          </div>
        )}

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
              onClick={async () => {
                setAccion("actualizar");
                setModo("MODIFICAR");
                await cargarVehiculos();
              }}
            />
            <ActionTile
              label="Dar de baja"
              selected={accion === "baja"}
              disabled={busy}
              onClick={async () => {
                setAccion("baja");
                setModo("BAJA");
                await cargarVehiculos();
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
              Placa: true,
              SOAT: true,
              CodigoInterno: true,
              Capacidad: true,
              MedidasInternas: true,
              MedidasExternas: true,
              AlturaPiso: true,
              PesoCargaUtil: true,
              PesoNeto: true,
            }}
            isChoice={(n: string) =>
              ["Temperatura", "TipoTemperatura", "TipoUnidad"].includes(n)
            }
            isLookup={(_n: string) => false}
            isNumber={(_n: string) => false}
            choices={choices}
            lookups={{}}
            empresaBloqueada={empresaBloqueada}
            bonificacionBloqueada={!!Transportista}
            lockedFields={lockedFields}
            proveedoresList={proveedoresList}
            proveedoresDisplayField={proveedoresDisplayField}
            proveedoresUserField={proveedoresUserField}
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
                (accion !== "baja" && (!!fechaError || !!validationError))
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
