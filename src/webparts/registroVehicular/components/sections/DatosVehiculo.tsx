import * as React from "react";
import {
  Dropdown,
  IDropdownOption,
  Icon,
  IconButton,
  Modal,
  Separator,
  TextField,
  Toggle,
} from "@fluentui/react";

import { classes } from "../../ui/styles";
import {
  getProveedoresCatalogFromList,
  ProveedorInfo,
} from "../../data/proveedoresCatalog";

type VehiculoExt = {
  Empresa?: string;
  EmpresaId?: number;
  Activo?: boolean;

  Placa?: string;
  SOAT?: string;
  Codigo?: string;
  Marca?: string;
  Modelo?: string;
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
};

const CAPACIDAD_OPTIONS: IDropdownOption[] = [
  { key: "02pp", text: "02pp" },
  { key: "06pp", text: "06pp" },
  { key: "08pp", text: "08pp" },
  { key: "10pp", text: "10pp" },
  { key: "12pp", text: "12pp" },
  { key: "14pp", text: "14pp" },
  { key: "16pp", text: "16pp" },
  { key: "20pp", text: "20pp" },
  { key: "25pp", text: "25pp" },
  { key: "26pp", text: "26pp" },
  { key: "28pp", text: "28pp" },
  { key: "30pp", text: "30pp" },
  { key: "48pp", text: "48pp" },
  { key: "50pp", text: "50pp" },
  { key: "otro", text: "otro" },
];

const normalizar = (s: unknown): string =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const hasValue = (v: unknown): boolean =>
  v !== undefined && v !== null && String(v).trim() !== "";

const DatosVehiculo: React.FC<{
  vehiculo?: VehiculoExt;
  setVehiculo: React.Dispatch<React.SetStateAction<VehiculoExt>>;
  disabled?: boolean;
  required?: Record<string, boolean | undefined>;
  isChoice: (n: string) => boolean;
  isLookup: (n: string) => boolean;
  isNumber: (n: string) => boolean;
  choices: Record<string, IDropdownOption[]>;
  lookups: Record<string, IDropdownOption[]>;
  empresaBloqueada?: boolean;
  bonificacionBloqueada?: boolean;
  lockedFields?: string[];
  proveedoresList?: string;
  proveedoresDisplayField?: string;
  proveedoresUserField?: string;
  alturaPisoHelpImageUrl?: string;

  // NUEVO (para mostrar rectángulos SOLO después del primer intento de guardar)
  showValidation?: boolean;
  // acepta keys ("EmpresaId", "Placa", etc.) o labels ("Empresa", "Placa", etc.)
  missingRequired?: string[];
}> = ({
  vehiculo = {},
  setVehiculo,
  disabled,
  required = {},
  isChoice,
  isLookup,
  isNumber,
  choices,
  lookups,
  empresaBloqueada = false,
  bonificacionBloqueada = false,
  lockedFields = [],
  proveedoresList,
  proveedoresDisplayField,
  proveedoresUserField,
  alturaPisoHelpImageUrl,

  showValidation = false,
  missingRequired = [],
}) => {
  const safeVehiculo: VehiculoExt = vehiculo || {};

  const [isAlturaModalOpen, setIsAlturaModalOpen] = React.useState(false);

  const [proveedores, setProveedores] = React.useState<ProveedorInfo[]>([]);

  React.useEffect(() => {
    const run = async () => {
      try {
        const rows = await getProveedoresCatalogFromList(
          proveedoresList || "Proveedores"
        );
        setProveedores(rows);
      } catch (e) {
        console.error("Error cargando proveedores", e);
        setProveedores([]);
      }
    };
    void run();
  }, [proveedoresList]);

  const isLocked = React.useCallback(
    (name: string) => lockedFields?.includes(name),
    [lockedFields]
  );

  // ===========
  // Validación visual (solo si showValidation === true)
  // ===========
  const missingKeySet = React.useMemo(() => {
    const set = new Set<string>();

    // Mapea labels (lo que hoy genera RegistroVehicular) -> keys del formulario
    const labelToKey: Record<string, string> = {
      Empresa: "EmpresaId",
      Temperatura: "Temperatura",
      "Tipo de unidad": "TipoUnidad",
      "Tipo temperatura": "TipoTemperatura",
      Marca: "Marca",
      Modelo: "Modelo",
      Placa: "Placa",
      SOAT: "SOAT",
      "Código de unidad": "CodigoInterno",
      Capacidad: "Capacidad",
      "Capacidad otros": "Otros",
      "Medida interna": "MedidasInternas",
      "Medida externa": "MedidasExternas",
      "Altura de piso a furgón": "AlturaPiso",
      "Peso útil": "PesoCargaUtil",
      "Peso bruto": "PesoNeto",
      "Largo de rampa": "LargoRampa",
      "Ancho de rampa": "AnchoRampa",
      // si alguna vez lo usan:
      Bonificacion: "Bonificacion",
      "N° de resolución": "NroResolucion",
    };

    for (const raw of missingRequired || []) {
      const s = String(raw || "").trim();
      if (!s) continue;

      // Si ya viene como key
      if (
        [
          "EmpresaId",
          "Temperatura",
          "TipoUnidad",
          "TipoTemperatura",
          "Placa",
          "SOAT",
          "CodigoInterno",
          "Marca",
          "Modelo",
          "Capacidad",
          "Otros",
          "MedidasInternas",
          "MedidasExternas",
          "AlturaPiso",
          "PesoCargaUtil",
          "PesoNeto",
          "LargoRampa",
          "AnchoRampa",
          "Bonificacion",
          "NroResolucion",
        ].includes(s)
      ) {
        set.add(s);
        continue;
      }

      // Si viene como label, mapear
      const mapped = labelToKey[s];
      if (mapped) set.add(mapped);
    }

    return set;
  }, [missingRequired]);

  const isRequired = React.useCallback(
    (key: string): boolean => required?.[key] === true,
    [required]
  );

  // Fallback (por si no pasan missingRequired): usa required + valor
  const isInvalidFallback = React.useCallback(
    (key: string, value: unknown, lockedBy?: string | string[]): boolean => {
      if (!isRequired(key)) return false;
      if (disabled) return false;

      const locks = Array.isArray(lockedBy)
        ? lockedBy
        : lockedBy
        ? [lockedBy]
        : [key];

      if (locks.some((k) => isLocked(k))) return false;

      return !hasValue(value);
    },
    [disabled, isLocked, isRequired]
  );

  const isInvalid = React.useCallback(
    (key: string, value: unknown, lockedBy?: string | string[]): boolean => {
      // clave: NO mostrar nada si no se intentó guardar
      if (!showValidation) return false;

      // si el padre nos pasa faltantes, usamos eso (es lo que querés)
      if (missingKeySet.size > 0) {
        // igual respetamos locks para no marcar campos bloqueados
        const locks = Array.isArray(lockedBy)
          ? lockedBy
          : lockedBy
          ? [lockedBy]
          : [key];
        if (locks.some((k) => isLocked(k))) return false;

        return missingKeySet.has(key);
      }

      // fallback
      return isInvalidFallback(key, value, lockedBy);
    },
    [showValidation, missingKeySet, isLocked, isInvalidFallback]
  );

  const invalidBoxStyle = React.useCallback(
    (invalid: boolean): React.CSSProperties | undefined => {
      if (!invalid) return undefined;
      return {
        border: "2px solid #a4262c",
        borderRadius: 6,
        padding: 6,
      };
    },
    []
  );

  const setText =
    (key: keyof VehiculoExt) =>
    (
      _ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
      v?: string
    ) => {
      setVehiculo((s) => ({
        ...(s || {}),
        [key]: v ?? "",
      }));
    };

  const proveedorActual = React.useMemo(() => {
    if (!safeVehiculo.EmpresaId) return undefined;
    return proveedores.find((p) => p.id === safeVehiculo.EmpresaId);
  }, [safeVehiculo.EmpresaId, proveedores]);

  const setChoiceFromList =
    (key: keyof VehiculoExt) =>
    (_ev: React.FormEvent<HTMLDivElement>, opt?: IDropdownOption) => {
      setVehiculo((s) => ({
        ...(s || {}),
        [key]: (opt?.key as string) ?? "",
      }));
    };

  const setChoiceFixed =
    (key: keyof VehiculoExt) =>
    (_ev: React.FormEvent<HTMLDivElement>, opt?: IDropdownOption) => {
      setVehiculo((s) => ({
        ...(s || {}),
        [key]: (opt?.key as string) ?? "",
      }));
    };

  const isCapacidadOtro = React.useMemo(() => {
    const cap = normalizar(safeVehiculo.Capacidad);
    return cap === "otro";
  }, [safeVehiculo.Capacidad]);

  const showTipoTemperatura =
    (safeVehiculo.Temperatura || "").toLowerCase() === "con temperatura";

  const EMPRESA_OPTIONS: IDropdownOption[] = React.useMemo(() => {
    return proveedores.map((p) => ({
      key: p.id,
      text: p.title,
    }));
  }, [proveedores]);

  const onEmpresaChange = (
    _ev: React.FormEvent<HTMLDivElement>,
    opt?: IDropdownOption
  ) => {
    const proveedorId = opt ? (opt.key as number) : undefined;
    const proveedor = proveedores.find((p) => p.id === proveedorId);

    setVehiculo((s) => ({
      ...(s || {}),
      EmpresaId: proveedorId,
      Empresa: proveedor ? proveedor.title : "",
    }));
  };

  const alturaHelpUrl =
    (alturaPisoHelpImageUrl || "").trim() ||
    "https://cnco.sharepoint.com/sites/DucumentosTrasportesPE/SiteAssets/Altura.png";

  // ===========
  // flags de invalid por campo
  // ===========
  const invalidEmpresa = isInvalid("EmpresaId", safeVehiculo.EmpresaId, [
    "Empresa",
    "EmpresaId",
  ]);

  const invalidTemp = isInvalid("Temperatura", safeVehiculo.Temperatura, "Temperatura");
  const invalidTipoUnidad = isInvalid("TipoUnidad", safeVehiculo.TipoUnidad, "TipoUnidad");
  const invalidTipoTemp = showTipoTemperatura
    ? isInvalid("TipoTemperatura", safeVehiculo.TipoTemperatura, "TipoTemperatura")
    : false;

  const invalidPlaca = isInvalid("Placa", safeVehiculo.Placa, ["Placa", "Title"]);
  const invalidSoat = isInvalid("SOAT", safeVehiculo.SOAT, "SOAT");
  // OJO: tu estado usa vehiculo.Codigo, pero la validación/required la manejás como CodigoInterno
  const invalidCodigo = isInvalid("CodigoInterno", safeVehiculo.Codigo, [
    "Codigo",
    "CodigoInterno",
  ]);

  const invalidMarca = isInvalid("Marca", safeVehiculo.Marca, "Marca");
  const invalidModelo = isInvalid("Modelo", safeVehiculo.Modelo, "Modelo");

  const invalidCapacidad = isInvalid("Capacidad", safeVehiculo.Capacidad, "Capacidad");
  const invalidOtros = isCapacidadOtro ? isInvalid("Otros", safeVehiculo.Otros, "Otros") : false;

  // NOTA: por tus comentarios, NO querés forzar toggles. Igual si el padre manda faltantes para Rampa, lo pinta.
  const invalidRampa = isInvalid("Rampa", safeVehiculo.Rampa, "Rampa");
  const invalidLargoRampa =
    safeVehiculo.Rampa ? isInvalid("LargoRampa", safeVehiculo.LargoRampa, "LargoRampa") : false;
  const invalidAnchoRampa =
    safeVehiculo.Rampa ? isInvalid("AnchoRampa", safeVehiculo.AnchoRampa, "AnchoRampa") : false;

  const invalidBonificacion = isInvalid("Bonificacion", safeVehiculo.Bonificacion, "Bonificacion");
  const invalidResolucion =
    safeVehiculo.Bonificacion
      ? isInvalid("NroResolucion", safeVehiculo.NroResolucion, "NroResolucion")
      : false;

  const invalidMedInt = isInvalid("MedidasInternas", safeVehiculo.MedidasInternas, "MedidasInternas");
  const invalidMedExt = isInvalid("MedidasExternas", safeVehiculo.MedidasExternas, "MedidasExternas");
  const invalidAltura = isInvalid("AlturaPiso", safeVehiculo.AlturaPiso, "AlturaPiso");

  const invalidPesoUtil = isInvalid("PesoCargaUtil", safeVehiculo.PesoCargaUtil, "PesoCargaUtil");
  const invalidPesoBruto = isInvalid("PesoNeto", safeVehiculo.PesoNeto, "PesoNeto");

  return (
    <div className={classes.card}>
      <div className={classes.cardHeader}>
        <Icon iconName="Car" />
        <div className={classes.cardTitle}>1- Datos del vehículo</div>
      </div>
      <Separator />

      {/* Empresa */}
      <div className={classes.grid3}>
        <div className={classes.fieldCell}>
          <div className={classes.fieldLabel}>Empresa *</div>

          <div style={invalidBoxStyle(invalidEmpresa)}>
            <Dropdown
              placeholder="Seleccione..."
              options={EMPRESA_OPTIONS}
              selectedKey={safeVehiculo.EmpresaId || undefined}
              onChange={onEmpresaChange}
              disabled={
                disabled ||
                empresaBloqueada ||
                isLocked("Empresa") ||
                isLocked("EmpresaId")
              }
            />
          </div>

          {proveedorActual && (
            <div style={{ fontSize: "12px", color: "#555", marginTop: 4 }}>
              RUC: {proveedorActual.ruc}
            </div>
          )}
        </div>
        <div />
        <div />
      </div>

      {/* Temperatura / Tipo temperatura / Tipo de unidad */}
      <div className={classes.grid3}>
        <div className={classes.fieldCell}>
          <div className={classes.fieldLabel}>Temperatura *</div>
          <div style={invalidBoxStyle(invalidTemp)}>
            <Dropdown
              placeholder="Seleccione..."
              options={choices["Temperatura"] || []}
              selectedKey={safeVehiculo.Temperatura || undefined}
              onChange={setChoiceFromList("Temperatura")}
              disabled={disabled}
            />
          </div>
        </div>

        {showTipoTemperatura && (
          <div className={classes.fieldCell}>
            <div className={classes.fieldLabel}>Tipo temperatura *</div>
            <div style={invalidBoxStyle(invalidTipoTemp)}>
              <Dropdown
                placeholder="Seleccione..."
                options={choices["TipoTemperatura"] || []}
                selectedKey={safeVehiculo.TipoTemperatura || undefined}
                onChange={setChoiceFromList("TipoTemperatura")}
                disabled={disabled}
              />
            </div>
          </div>
        )}

        <div className={classes.fieldCell}>
          <div className={classes.fieldLabel}>Tipo de unidad *</div>
          <div style={invalidBoxStyle(invalidTipoUnidad)}>
            <Dropdown
              placeholder="Seleccione..."
              options={choices["TipoUnidad"] || []}
              selectedKey={safeVehiculo.TipoUnidad || undefined}
              onChange={setChoiceFromList("TipoUnidad")}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Placa / SOAT / Código */}
      <div className={classes.grid3}>
        <TextField
          label="Placa *"
          value={safeVehiculo.Placa || ""}
          onChange={setText("Placa")}
          disabled={disabled || isLocked("Placa") || isLocked("Title")}
          styles={
            invalidPlaca
              ? { fieldGroup: { borderColor: "#a4262c", borderWidth: 2 } }
              : undefined
          }
        />

        <TextField
          label="SOAT *"
          value={safeVehiculo.SOAT || ""}
          onChange={setText("SOAT")}
          disabled={disabled}
          styles={
            invalidSoat
              ? { fieldGroup: { borderColor: "#a4262c", borderWidth: 2 } }
              : undefined
          }
        />

        <TextField
          label="Código de unidad *"
          value={safeVehiculo.Codigo || ""}
          onChange={setText("Codigo")}
          disabled={disabled || isLocked("Codigo") || isLocked("CodigoInterno")}
          styles={
            invalidCodigo
              ? { fieldGroup: { borderColor: "#a4262c", borderWidth: 2 } }
              : undefined
          }
        />
      </div>

      {/* Marca / Modelo */}
      <div className={classes.grid3}>
        <TextField
          label="Marca *"
          value={safeVehiculo.Marca || ""}
          onChange={setText("Marca")}
          disabled={disabled || isLocked("Marca")}
          styles={
            invalidMarca
              ? { fieldGroup: { borderColor: "#a4262c", borderWidth: 2 } }
              : undefined
          }
        />

        <TextField
          label="Modelo *"
          value={safeVehiculo.Modelo || ""}
          onChange={setText("Modelo")}
          disabled={disabled || isLocked("Modelo")}
          styles={
            invalidModelo
              ? { fieldGroup: { borderColor: "#a4262c", borderWidth: 2 } }
              : undefined
          }
        />

        <div />
      </div>

      {/* Capacidad */}
      <div className={classes.grid3}>
        <div className={classes.fieldCell}>
          <div className={classes.fieldLabel}>Capacidad *</div>
          <div style={invalidBoxStyle(invalidCapacidad)}>
            <Dropdown
              placeholder="Seleccione..."
              options={CAPACIDAD_OPTIONS}
              selectedKey={safeVehiculo.Capacidad || undefined}
              onChange={setChoiceFixed("Capacidad")}
              disabled={disabled}
            />
          </div>
        </div>

        {isCapacidadOtro && (
          <div className={classes.fieldCell}>
            <TextField
              label="Especifique capacidad *"
              value={safeVehiculo.Otros || ""}
              onChange={setText("Otros")}
              disabled={disabled}
              styles={
                invalidOtros
                  ? { fieldGroup: { borderColor: "#a4262c", borderWidth: 2 } }
                  : undefined
              }
            />
          </div>
        )}

        <div />
      </div>

      {/* Rampa */}
      <div className={classes.grid3}>
        <div className={classes.fieldCell}>
          <div className={classes.fieldLabel}>Rampa *</div>
          <div style={invalidBoxStyle(invalidRampa)}>
            <Toggle
              checked={!!safeVehiculo.Rampa}
              onChange={(_e, c) =>
                setVehiculo((s) => ({
                  ...(s || {}),
                  Rampa: !!c,
                }))
              }
              disabled={disabled}
            />
          </div>
        </div>

        {safeVehiculo.Rampa && (
          <>
            <TextField
              label="Largo rampa *"
              value={safeVehiculo.LargoRampa || ""}
              onChange={setText("LargoRampa")}
              disabled={disabled}
              styles={
                invalidLargoRampa
                  ? { fieldGroup: { borderColor: "#a4262c", borderWidth: 2 } }
                  : undefined
              }
            />
            <TextField
              label="Ancho rampa *"
              value={safeVehiculo.AnchoRampa || ""}
              onChange={setText("AnchoRampa")}
              disabled={disabled}
              styles={
                invalidAnchoRampa
                  ? { fieldGroup: { borderColor: "#a4262c", borderWidth: 2 } }
                  : undefined
              }
            />
          </>
        )}
      </div>

      {/* Bonificación */}
      <div className={classes.grid3}>
        <div className={classes.fieldCell}>
          <div className={classes.fieldLabel}>Bonificación *</div>
          <div style={invalidBoxStyle(invalidBonificacion)}>
            <Toggle
              checked={!!safeVehiculo.Bonificacion}
              onChange={(_e, c) =>
                setVehiculo((s) => ({
                  ...(s || {}),
                  Bonificacion: !!c,
                }))
              }
              disabled={disabled || bonificacionBloqueada}
            />
          </div>
        </div>

        {safeVehiculo.Bonificacion && (
          <TextField
            label="N° de resolución *"
            value={safeVehiculo.NroResolucion || ""}
            onChange={setText("NroResolucion")}
            disabled={disabled || bonificacionBloqueada}
            styles={
              invalidResolucion
                ? { fieldGroup: { borderColor: "#a4262c", borderWidth: 2 } }
                : undefined
            }
          />
        )}

        <div />
      </div>

      {/* Rieles logísticos / Propiedad */}
      <div className={classes.grid3}>
        <div className={classes.fieldCell}>
          <div className={classes.fieldLabel}>¿Cuenta con rieles logísticos?</div>
          <Toggle
            checked={!!safeVehiculo.RielesLogisticos}
            onChange={(_e, c) =>
              setVehiculo((s) => ({
                ...(s || {}),
                RielesLogisticos: !!c,
              }))
            }
            disabled={disabled}
          />
        </div>

        <div className={classes.fieldCell}>
          <div className={classes.fieldLabel}>¿La unidad es propiedad?</div>
          <Toggle
            checked={!!safeVehiculo.Propiedad}
            onChange={(_e, c) =>
              setVehiculo((s) => ({
                ...(s || {}),
                Propiedad: !!c,
              }))
            }
            disabled={disabled}
          />
        </div>

        <div />
      </div>

      {/* Medidas */}
      <div className={classes.grid3}>
        <TextField
          label="Medidas internas *"
          value={safeVehiculo.MedidasInternas || ""}
          onChange={setText("MedidasInternas")}
          disabled={disabled}
          styles={
            invalidMedInt
              ? { fieldGroup: { borderColor: "#a4262c", borderWidth: 2 } }
              : undefined
          }
        />

        <TextField
          label="Medidas externas *"
          value={safeVehiculo.MedidasExternas || ""}
          onChange={setText("MedidasExternas")}
          disabled={disabled}
          styles={
            invalidMedExt
              ? { fieldGroup: { borderColor: "#a4262c", borderWidth: 2 } }
              : undefined
          }
        />

        <div />
      </div>

      {/* Altura */}
      <div className={classes.grid3}>
        <TextField
          onRenderLabel={() => (
            <div
              className={classes.fieldLabel}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <span>Altura de piso a furgón *</span>
              <IconButton
                iconProps={{ iconName: "Info" }}
                title="Ver referencia"
                aria-label="Ver referencia"
                styles={{ root: { height: 24, width: 24 } }}
                onClick={() => setIsAlturaModalOpen(true)}
              />
            </div>
          )}
          value={safeVehiculo.AlturaPiso || ""}
          onChange={setText("AlturaPiso")}
          disabled={disabled}
          styles={
            invalidAltura
              ? { fieldGroup: { borderColor: "#a4262c", borderWidth: 2 } }
              : undefined
          }
        />

        <div />
        <div />
      </div>

      {/* Pesos */}
      <div className={classes.grid3}>
        <TextField
          label="Peso carga útil *"
          value={safeVehiculo.PesoCargaUtil || ""}
          type={isNumber("pesocargautil") ? "number" : "text"}
          onChange={setText("PesoCargaUtil")}
          disabled={disabled}
          styles={
            invalidPesoUtil
              ? { fieldGroup: { borderColor: "#a4262c", borderWidth: 2 } }
              : undefined
          }
        />

        <TextField
          label="Peso bruto *"
          value={safeVehiculo.PesoNeto || ""}
          type={isNumber("pesobruto") ? "number" : "text"}
          onChange={setText("PesoNeto")}
          disabled={disabled}
          styles={
            invalidPesoBruto
              ? { fieldGroup: { borderColor: "#a4262c", borderWidth: 2 } }
              : undefined
          }
        />

        <div />
      </div>

      {/* Modal referencia Altura */}
      <Modal
        isOpen={isAlturaModalOpen}
        onDismiss={() => setIsAlturaModalOpen(false)}
        isBlocking={false}
      >
        <div style={{ padding: 12, maxWidth: 900 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <div style={{ fontWeight: 600 }}>
              Altura de piso a furgón — Referencia
            </div>
            <IconButton
              iconProps={{ iconName: "Cancel" }}
              aria-label="Cerrar"
              onClick={() => setIsAlturaModalOpen(false)}
            />
          </div>
          <img
            src={alturaHelpUrl}
            alt="altura de piso a furgón"
            style={{
              maxWidth: "100%",
              height: "auto",
              display: "block",
            }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default DatosVehiculo;
export { VehiculoExt };
