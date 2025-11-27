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
// CAMBIO: usamos la función que lee de la lista
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

const normalizar = (s: any) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

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
}) => {
  const safeVehiculo: VehiculoExt = vehiculo || {};

  const [isAlturaModalOpen, setIsAlturaModalOpen] = React.useState(false);

  // NUEVO: proveedores leídos de la lista
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

  return (
    <div className={classes.card}>
      {/* Header */}
      <div className={classes.cardHeader}>
        <Icon iconName="Car" />
        <div className={classes.cardTitle}>1- Datos del vehículo</div>
      </div>
      <Separator />

      {/* Empresa */}
      <div className={classes.grid3}>
        <div className={classes.fieldCell}>
          <div className={classes.fieldLabel}>Empresa *</div>
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
        {/* Temperatura */}
        <div className={classes.fieldCell}>
          <div className={classes.fieldLabel}>Temperatura *</div>
          <Dropdown
            placeholder="Seleccione..."
            options={choices["Temperatura"] || []}
            selectedKey={safeVehiculo.Temperatura || undefined}
            onChange={setChoiceFromList("Temperatura")}
            disabled={disabled}
          />
        </div>

        {/* Tipo temperatura (solo si aplica) */}
        {showTipoTemperatura && (
          <div className={classes.fieldCell}>
            <div className={classes.fieldLabel}>Tipo temperatura *</div>
            <Dropdown
              placeholder="Seleccione..."
              options={choices["TipoTemperatura"] || []}
              selectedKey={safeVehiculo.TipoTemperatura || undefined}
              onChange={setChoiceFromList("TipoTemperatura")}
              disabled={disabled}
            />
          </div>
        )}

        {/* Tipo de unidad */}
        <div className={classes.fieldCell}>
          <div className={classes.fieldLabel}>Tipo de unidad *</div>
          <Dropdown
            placeholder="Seleccione..."
            options={choices["TipoUnidad"] || []}
            selectedKey={safeVehiculo.TipoUnidad || undefined}
            onChange={setChoiceFromList("TipoUnidad")}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Placa / SOAT / Código de unidad */}
      <div className={classes.grid3}>
        <TextField
          label="Placa *"
          value={safeVehiculo.Placa || ""}
          onChange={setText("Placa")}
          disabled={disabled || isLocked("Placa") || isLocked("Title")}
        />

        <TextField
          label="SOAT *"
          value={safeVehiculo.SOAT || ""}
          onChange={setText("SOAT")}
          disabled={disabled}
        />

        <TextField
          label="Código de unidad *"
          value={safeVehiculo.Codigo || ""}
          onChange={setText("Codigo")}
          disabled={
            disabled || isLocked("Codigo") || isLocked("CodigoInterno")
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
        />

        <TextField
          label="Modelo *"
          value={safeVehiculo.Modelo || ""}
          onChange={setText("Modelo")}
          disabled={disabled || isLocked("Modelo")}
        />

        <div />
      </div>

      {/* Capacidad + "Especifique capacidad" si Capacidad = otro */}
      <div className={classes.grid3}>
        <div className={classes.fieldCell}>
          <div className={classes.fieldLabel}>Capacidad *</div>
          <Dropdown
            placeholder="Seleccione..."
            options={CAPACIDAD_OPTIONS}
            selectedKey={safeVehiculo.Capacidad || undefined}
            onChange={setChoiceFixed("Capacidad")}
            disabled={disabled}
          />
        </div>

        {isCapacidadOtro && (
          <div className={classes.fieldCell}>
            <TextField
              label="Especifique capacidad *"
              value={safeVehiculo.Otros || ""}
              onChange={setText("Otros")}
              disabled={disabled}
            />
          </div>
        )}

        <div />
      </div>

      {/* Rampa / Largo rampa / Ancho rampa */}
      <div className={classes.grid3}>
        <div className={classes.fieldCell}>
          <div className={classes.fieldLabel}>Rampa *</div>
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

        {safeVehiculo.Rampa && (
          <>
            <TextField
              label="Largo rampa *"
              value={safeVehiculo.LargoRampa || ""}
              onChange={setText("LargoRampa")}
              disabled={disabled}
            />
            <TextField
              label="Ancho rampa *"
              value={safeVehiculo.AnchoRampa || ""}
              onChange={setText("AnchoRampa")}
              disabled={disabled}
            />
          </>
        )}
      </div>

      {/* Bonificación / N° de resolución */}
      <div className={classes.grid3}>
        <div className={classes.fieldCell}>
          <div className={classes.fieldLabel}>Bonificación *</div>
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

        {safeVehiculo.Bonificacion && (
          <TextField
            label="N° de resolución *"
            value={safeVehiculo.NroResolucion || ""}
            onChange={setText("NroResolucion")}
            disabled={disabled || bonificacionBloqueada}
          />
        )}

        <div />
      </div>

      {/* Medidas internas / externas */}
      <div className={classes.grid3}>
        <TextField
          label="Medidas internas *"
          value={safeVehiculo.MedidasInternas || ""}
          onChange={setText("MedidasInternas")}
          disabled={disabled}
        />

        <TextField
          label="Medidas externas *"
          value={safeVehiculo.MedidasExternas || ""}
          onChange={setText("MedidasExternas")}
          disabled={disabled}
        />

        <div />
      </div>

      {/* Altura del piso + modal referencia */}
      <div className={classes.grid3}>
        <TextField
          onRenderLabel={() => (
            <div
              className={classes.fieldLabel}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <span>Altura del piso *</span>
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
        />

        <TextField
          label="Peso bruto *"
          value={safeVehiculo.PesoNeto || ""}
          type={isNumber("pesobruto") ? "number" : "text"}
          onChange={setText("PesoNeto")}
          disabled={disabled}
        />

        <div />
      </div>

      {/* Modal referencia Altura del piso */}
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
            <div style={{ fontWeight: 600 }}>Altura del piso — Referencia</div>
            <IconButton
              iconProps={{ iconName: "Cancel" }}
              aria-label="Cerrar"
              onClick={() => setIsAlturaModalOpen(false)}
            />
          </div>
          <img
            src="https://cnco.sharepoint.com/sites/DucumentosTrasportesPE/SiteAssets/Altura.png"
            alt="altura del piso"
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
